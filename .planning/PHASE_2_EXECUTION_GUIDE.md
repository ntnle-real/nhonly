# Phase 2 Execution Guide: Step-by-Step Hands-On

This guide walks you through each Phase 2 task with exact commands for both the server (MacBook Air) and your personal machine.

---

## TASK 1: SSH Key Authentication Setup

### 1a. Server Setup (MacBook Air M2)

✅ Already completed:
```bash
# SSH key generated
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "server@nhonly"

# Public key:
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJouyjN3TayOjqlPKR+hr8keCeazOYwDpNOpvOJXVSZC server@nhonly

# SSH daemon is already listening on port 22
netstat -an | grep ":22.*LISTEN"
# Output shows: tcp4 *.22 LISTEN and tcp6 *.22 LISTEN ✓
```

### 1b. Personal Machine Setup (Your MacBook)

Run these commands on your personal MacBook:

```bash
# Step 1: Create .ssh directory (if needed)
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Step 2: Add server's public key to authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJouyjN3TayOjqlPKR+hr8keCeazOYwDpNOpvOJXVSZC server@nhonly" >> ~/.ssh/authorized_keys

# Step 3: Secure the file
chmod 600 ~/.ssh/authorized_keys

# Step 4: Test connection
ssh server@10.0.0.245

# Expected output:
# Should NOT prompt for a password
# Should show shell prompt: server@...

# Step 5: Verify you're connected to the server
whoami        # Should print: server
hostname      # Should print: MacBook-Air-M2.local or similar
uname -a      # Should show Darwin (macOS)

# Step 6: Disconnect
exit
```

### 1c. Server Verification

Once you've successfully SSH'd from your personal machine, verify on the server:

```bash
# On the server, check SSH logs
log stream --predicate 'process == "sshd"' --level debug 2>/dev/null | head -20

# Or check auth logs
tail -20 /var/log/system.log | grep sshd
```

**Acceptance Criteria:**
- [ ] Personal machine: `ssh server@10.0.0.245` works without password prompt
- [ ] Personal machine: Can run commands (whoami, hostname) via SSH
- [ ] Server: auth logs show successful key-based authentication

---

## TASK 2: Disable SSH Password Authentication

⚠️ **IMPORTANT:** Only proceed after Task 1 is working! If you lock down SSH before key auth is verified, you'll lose remote access.

### 2a. Create SSH Config Backup

```bash
# On MacBook Air (server):
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)
```

(This will require your password. If you can't enter password in this shell, skip the backup for now.)

### 2b. Update sshd_config (via Edit)

Key changes needed in `/etc/ssh/sshd_config`:

- Find line: `#PasswordAuthentication yes`
- Change to: `PasswordAuthentication no`

- Find line: `#PubkeyAuthentication yes`
- Change to: `PubkeyAuthentication yes`

- Find line: `#PermitRootLogin yes`
- Change to: `PermitRootLogin no`

- (Optional) Add near end of file:
  ```
  # Lock down SSH
  Protocol 2
  X11Forwarding no
  MaxAuthTries 3
  MaxSessions 2
  ClientAliveInterval 300
  ClientAliveCountMax 2
  ```

### 2c. Reload SSH Service

```bash
# On MacBook Air:
sudo launchctl stop com.openssh.sshd
sudo launchctl start com.openssh.sshd

# Verify service restarted
netstat -an | grep ":22.*LISTEN"
```

### 2d. Test from Personal Machine

```bash
# On your personal MacBook:
# Test key auth still works
ssh server@10.0.0.245

# Test that password auth is rejected
ssh -o PubkeyAuthentication=no server@10.0.0.245
# Should show: Authentications that can continue: publickey
# (Key auth only; password auth denied) ✓
```

**Acceptance Criteria:**
- [ ] sshd_config updated with PasswordAuthentication=no
- [ ] SSH service reloaded successfully
- [ ] Key auth still works from personal machine
- [ ] Password auth rejected with "publickey" message

---

## TASK 3: Configure macOS Firewall

### 3a. Enable Firewall

```bash
# On MacBook Air:
sudo defaults write /Library/Preferences/com.apple.alf globalstate -int 1

# Verify it's enabled
sudo defaults read /Library/Preferences/com.apple.alf globalstate
# Should print: 1
```

### 3b. Enable Stealth Mode (Hide from pings)

```bash
# On MacBook Air:
sudo defaults write /Library/Preferences/com.apple.alf stealthenabled -int 1

# Verify
sudo defaults read /Library/Preferences/com.apple.alf stealthenabled
# Should print: 1
```

### 3c. Allow Specific Applications

macOS firewall is app-based, not port-based. Use the GUI for fine control:

**Via System Preferences (Manual):**
1. Open System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add these apps to "Allow incoming connections":
   - Caddy (if installed separately)
   - Node.js (if not installed via launchd)
4. Ensure: "Block all incoming connections" is available but not enabled for your desired apps

**Via Command Line (app-based):**
```bash
# Add node to firewall allow list (if running standalone)
# This is complex; System Preferences GUI is easier for macOS
```

### 3d. Verify from Personal Machine

```bash
# On your personal MacBook:

# SSH should still work (added to exceptions or comes with system)
ssh server@10.0.0.245
# Should connect ✓

# Ping should not work (stealth mode)
ping -c 1 10.0.0.245
# Should timeout or say "no answer" ✓

# HTTP/HTTPS might need Caddy rules (see Task 4)
# nmap scan should show only SSH, HTTP, HTTPS
```

**Acceptance Criteria:**
- [ ] Firewall enabled (globalstate = 1)
- [ ] Stealth mode enabled (stealthenabled = 1)
- [ ] SSH still accessible from personal machine
- [ ] Ping times out (firewall blocks ICMP)

---

## TASK 4: HTTPS with Self-Signed Certificate

### 4a. Generate Self-Signed Certificate

```bash
# On MacBook Air:
# Create Caddy certs directory
mkdir -p /opt/homebrew/etc/caddy

# Generate self-signed cert (10-year validity)
openssl req -x509 \
  -newkey rsa:4096 \
  -keyout /opt/homebrew/etc/caddy/server.key \
  -out /opt/homebrew/etc/caddy/server.crt \
  -days 3650 \
  -nodes \
  -subj "/C=US/ST=California/L=Local/O=nhonly/CN=10.0.0.245"

# Verify files exist
ls -l /opt/homebrew/etc/caddy/server.*
```

### 4b. Update Caddyfile

```bash
# On MacBook Air:
# Backup current Caddyfile
cp /opt/homebrew/etc/Caddyfile /opt/homebrew/etc/Caddyfile.backup.$(date +%Y%m%d_%H%M%S)

# Write new Caddyfile
cat > /opt/homebrew/etc/Caddyfile << 'EOF'
# HTTPS (self-signed cert)
https://10.0.0.245:443 {
    reverse_proxy 127.0.0.1:3000
    tls /opt/homebrew/etc/caddy/server.crt /opt/homebrew/etc/caddy/server.key
}

# HTTP redirect to HTTPS
http://10.0.0.245:80 {
    redir https://10.0.0.245:443{uri}
}

# Localhost HTTP (for testing without cert)
http://127.0.0.1:8080 {
    reverse_proxy 127.0.0.1:3000
}
EOF

# Verify Caddyfile syntax
caddy validate --config /opt/homebrew/etc/Caddyfile
# Should print: "Valid configuration"
```

### 4c. Restart Caddy

```bash
# On MacBook Air:
brew services restart caddy

# Wait 2 seconds for startup
sleep 2

# Check if Caddy is running
brew services list | grep caddy
# Should show: caddy started /opt/homebrew/Cellar/...

# Verify it's listening on ports 80, 443
netstat -an | grep LISTEN | grep -E ":(80|443)"
# Should show both ports listening
```

### 4d. Test HTTPS Access

```bash
# On MacBook Air:
curl -k https://10.0.0.245:443
# Should return HTML (self-signed warning suppressed with -k)

# Test HTTP redirect
curl -i http://10.0.0.245:80
# Should show: HTTP/1.1 308 Permanent Redirect
# And Location: https://10.0.0.245:443
```

### 4e. Test from Personal Machine

```bash
# On your personal MacBook:

# HTTPS with self-signed cert warning suppressed
curl -k https://10.0.0.245:443
# Should return app HTML

# HTTP redirect
curl -i http://10.0.0.245:80
# Should redirect to HTTPS

# Test with browser
open https://10.0.0.245
# Browser will warn about self-signed cert (expected)
# Click "Accept Risk" or similar
# App should load
```

**Acceptance Criteria:**
- [ ] Certificate generated (server.crt, server.key exist)
- [ ] Caddyfile updated with TLS config
- [ ] Caddy running on ports 80 and 443
- [ ] curl -k returns 200 with HTML
- [ ] HTTP redirects to HTTPS
- [ ] App loads in browser on HTTPS

---

## TASK 5: Pen Testing - Baseline Reconnaissance

### 5a. Port Scanning with nmap

**On your personal MacBook:**

```bash
# Install nmap (if not already installed)
brew install nmap

# 1. Quick port scan (which ports are open?)
nmap 10.0.0.245
# Expected output:
# 22/tcp   open  ssh
# 80/tcp   open  http
# 443/tcp  open  https
# (3000/tcp should NOT appear if firewall working)

# 2. More detailed scan with service detection
nmap -sV 10.0.0.245
# Shows service versions (SSH, HTTP server)

# 3. Aggressive scan (OS detection, script scanning)
nmap -A 10.0.0.245
# May reveal more info about services running

# 4. Port range scan (check all ports 1-1000)
nmap -p 1-1000 10.0.0.245
# Verify only expected ports are open

# 5. Save results to file
nmap -A 10.0.0.245 > nmap_baseline.txt
# For documentation and comparison later
```

### 5b. Web Vulnerability Scanning with nikto

```bash
# On your personal MacBook:

# Install nikto (if not already installed)
brew install nikto

# 1. Basic scan
nikto -h https://10.0.0.245
# Expected: Report on missing headers, potential vulnerabilities

# 2. Detailed scan (all checks)
nikto -h https://10.0.0.245 -Tuning 5 -verbose
# More comprehensive vulnerability checking

# 3. Save report to file
nikto -h https://10.0.0.245 -o nikto_report.html -Format html
# Generates HTML report for documentation

# 4. Check specific ports
nikto -h https://10.0.0.245:443
nikto -h http://10.0.0.245:80
```

### 5c. Manual Testing with curl

```bash
# On your personal MacBook:

# Check HTTP headers
curl -i -k https://10.0.0.245
# Look at response headers for:
# - Content-Security-Policy (missing?)
# - X-Frame-Options (missing?)
# - Strict-Transport-Security (missing?)
# - Server version (information disclosure?)

# Check redirects
curl -i http://10.0.0.245
# Verify HTTP → HTTPS redirect works

# Test SSL/TLS info
openssl s_client -connect 10.0.0.245:443 -showcerts
# See certificate details, TLS version, cipher suites

# Look for directory listing vulnerabilities
curl -i -k https://10.0.0.245/
curl -i -k https://10.0.0.245/admin
curl -i -k https://10.0.0.245/api
# Check if 404 or accidentally exposes info
```

### 5d. Document Findings

Create a file to track vulnerabilities found:

```bash
# On your personal MacBook:
cat > security_findings.txt << 'EOF'
# Pen Testing Findings - 2026-04-06

## Reconnaissance Results

### nmap Scan
[Paste nmap output here]

### nikto Report
[Paste key nikto findings here]

### Manual curl Testing
[Document any security headers missing, etc.]

## Identified Vulnerabilities

1. [Finding 1]
   - Severity: [High/Medium/Low]
   - Description: [Details]
   - Remediation: [How to fix]

2. [Finding 2]
   - etc.

## Defensive Notes
[Note which issues are expected in this environment, which need fixing]
EOF
```

**Acceptance Criteria:**
- [ ] nmap scan shows only 22/80/443 open (3000 blocked)
- [ ] nikto runs successfully and generates report
- [ ] curl shows app responding on HTTPS
- [ ] Findings documented with severity levels

---

## TASK 6: OWASP ZAP Advanced Testing (Optional)

```bash
# On your personal MacBook:

# Download OWASP ZAP from: https://www.zaproxy.org/download/
# Or install via Homebrew:
brew install owasp-zap

# Start ZAP
/Applications/OWASP\ ZAP.app/Contents/MacOS/ZAP

# 1. Configure browser proxy
#    Set browser proxy to: 127.0.0.1:8080
#    ZAP default proxy port is 8080

# 2. Navigate to your app
#    https://10.0.0.245
#    Accept self-signed cert warning

# 3. Perform Passive Scan
#    Right-click → Scan
#    ZAP will flag missing headers, info disclosure, etc.

# 4. Perform Active Scan (CAREFUL - this sends attack payloads)
#    Tools → Active Scan
#    Tests for: XSS, SQL Injection, CSRF, etc.

# 5. Export Report
#    Report → Generate HTML Report
#    Save to: zap_active_scan.html

# 6. Review findings in Report tab
#    Note severity levels (High/Medium/Low)
```

**Learning Focus:**
- What automated scanners can detect
- OWASP Top 10 categories (Injection, XSS, CSRF, etc.)
- How defenders use the same tools
- False positives vs. real vulnerabilities

---

## Order of Execution

Execute tasks in this order:

1. ✅ **TASK 1** — SSH key setup (server + personal machine)
2. **→ TASK 2** — Disable password auth (after Task 1 verified)
3. **→ TASK 3** — Firewall hardening
4. **→ TASK 4** — HTTPS with self-signed cert
5. **→ TASK 5** — Run nmap, nikto, manual tests
6. **→ TASK 6** — OWASP ZAP (optional, time permitting)

---

## Success Summary

After completing all tasks, you'll have:

- ✅ Secure SSH access (key-only, no passwords)
- ✅ Firewall blocking unwanted ports
- ✅ HTTPS encryption for web traffic
- ✅ Hands-on pen testing experience with 4+ tools
- ✅ Documented security findings
- ✅ Understanding of attacker reconnaissance techniques
- ✅ Ideas for defensive fixes

---

## Next Phase (After Phase 2 Complete)

- Public HTTPS with Let's Encrypt (if registering nhon-ly.org)
- Tailscale Funnel for temporary public internet access
- Advanced pen testing (Burp Suite, Metasploit exploration)
- Container security (if adding Docker)

---

**Created:** 2026-04-06
**Status:** Ready for step-by-step execution
