# Phase 2: Infrastructure Hardening & Pen Testing Setup

## Overview
Set up the MacBook Air M2 for security testing and pen testing education. You'll attack your own infrastructure with standard security tools (nmap, nikto, OWASP ZAP) to learn how attackers reconnaissance targets and identify vulnerabilities.

## Prerequisites
- Phase 1 deployment complete (app running on 10.0.0.245:3000 via launchd)
- Personal MacBook on same WiFi network
- SSH client on personal machine
- Pen testing tools to install (nmap, nikto, OWASP ZAP)

---

## Phase 2 Tasks

### Task 1: Enable SSH with Key Authentication
**Goal:** Secure remote access without password login.

```bash
# On MacBook Air (server):
# 1. Check if SSH is enabled
sudo systemsetup -getremotelogin

# 2. Enable SSH
sudo systemsetup -setremotelogin on

# 3. Generate SSH key (if not already done)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""

# 4. Display public key (copy to personal machine)
cat ~/.ssh/id_ed25519.pub
```

On your personal MacBook:
```bash
# Add the server's public key to ~/.ssh/authorized_keys
mkdir -p ~/.ssh
echo "PASTE_SERVER_PUBLIC_KEY_HERE" >> ~/.ssh/id_ed25519.pub

# Test SSH connection
ssh server@10.0.0.245
# Should not prompt for password
```

**Acceptance Criteria:**
- [ ] SSH enabled on server
- [ ] Key-based auth works from personal machine
- [ ] No password prompts

---

### Task 2: Disable SSH Password Authentication
**Goal:** Force key-only auth; prevent brute-force password attacks.

```bash
# On MacBook Air (server):
sudo nano /etc/ssh/sshd_config
# Find and modify these lines:
# PasswordAuthentication no
# PubkeyAuthentication yes
# PermitRootLogin no

# Reload SSH
sudo launchctl stop com.openssh.sshd
sudo launchctl start com.openssh.sshd

# Verify
ssh -v server@10.0.0.245 2>&1 | grep -i "pubkey\|password"
```

**Acceptance Criteria:**
- [ ] PasswordAuthentication set to `no`
- [ ] PubkeyAuthentication set to `yes`
- [ ] SSH still works from personal machine with key
- [ ] Password login rejected if attempted

---

### Task 3: Configure macOS Firewall
**Goal:** Allow only SSH (22), HTTP (80), HTTPS (443).

```bash
# On MacBook Air (server):
# Enable firewall
sudo defaults write /Library/Preferences/com.apple.alf globalstate -int 1

# List current rules
sudo /usr/libexec/ApplicationFirewall/socketfilterfw -l

# Add allow rules (macOS has minimal CLI, use UI for simplicity)
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Check: "Enable stealth mode"
# Block all inbound traffic except SSH, HTTP, HTTPS
```

**Acceptance Criteria:**
- [ ] Firewall enabled
- [ ] SSH (port 22) accessible from personal machine
- [ ] HTTP (port 80) accessible from personal machine
- [ ] Unexpected ports blocked (e.g., 3000 direct access blocked)

---

### Task 4: Set Up HTTPS with Self-Signed Certificate (Local)
**Goal:** Encrypt traffic between personal machine and server on local LAN.

```bash
# On MacBook Air (server):
# 1. Generate self-signed cert (10-year validity)
openssl req -x509 -newkey rsa:4096 -keyout /opt/homebrew/etc/caddy/server.key -out /opt/homebrew/etc/caddy/server.crt -days 3650 -nodes \
  -subj "/C=US/ST=California/L=Local/O=nhonly/CN=10.0.0.245"

# 2. Update Caddyfile for HTTPS
cat > /opt/homebrew/etc/Caddyfile <<EOF
https://10.0.0.245:443 {
    reverse_proxy 127.0.0.1:3000
    tls /opt/homebrew/etc/caddy/server.crt /opt/homebrew/etc/caddy/server.key
}

http://10.0.0.245:80 {
    redir https://10.0.0.245:443
}
EOF

# 3. Restart Caddy
brew services restart caddy

# 4. Verify
curl -k https://10.0.0.245:443
```

**Acceptance Criteria:**
- [ ] Certificate generated and stored
- [ ] Caddyfile updated with TLS
- [ ] HTTP → HTTPS redirect works
- [ ] curl -k returns 200 with app HTML

---

### Task 5: Baseline Security Scanning (Reconnaissance)
**Goal:** Learn to scan your own infrastructure like an attacker would.

#### 5a: Port Scanning with nmap
```bash
# From personal MacBook:
# Install nmap (if needed)
brew install nmap

# 1. Basic port scan (which ports are open?)
nmap 10.0.0.245

# 2. More detailed scan with service detection
nmap -sV -p 1-65535 10.0.0.245

# 3. OS detection attempt
nmap -O 10.0.0.245

# Expected output:
# 22/tcp    open   ssh
# 80/tcp    open   http
# 443/tcp   open   https
# (3000/tcp should be closed if firewall is working)
```

#### 5b: Web Server Scanning with nikto
```bash
# From personal MacBook:
# Install nikto (if needed)
brew install nikto

# 1. Basic scan
nikto -h https://10.0.0.245

# 2. Look for common vulnerabilities
nikto -h https://10.0.0.245 -ignore-code 404 -Tuning 5

# Expected: Identify missing headers, outdated libraries, known paths
```

#### 5c: Manual Testing with curl
```bash
# Test HTTP → HTTPS redirect
curl -i http://10.0.0.245

# Test HTTPS with self-signed cert
curl -k https://10.0.0.245

# Check response headers for security headers
curl -i -k https://10.0.0.245 | grep -i "content-security\|x-frame\|strict-transport"
```

**Acceptance Criteria:**
- [ ] nmap shows ports 22, 80, 443 open; 3000 closed
- [ ] nikto runs and produces vulnerability report
- [ ] HTTP redirects to HTTPS
- [ ] App responds on HTTPS

---

### Task 6: OWASP ZAP Interactive Testing (Optional Deep Dive)
**Goal:** Active web application security testing—detect input validation, XSS, CSRF, etc.

```bash
# From personal MacBook:
# Install OWASP ZAP (GUI tool)
# Download from: https://www.zaproxy.org/download/

# 1. Start ZAP
# 2. Configure browser proxy to ZAP (127.0.0.1:8080)
# 3. Navigate to https://10.0.0.245 through ZAP
# 4. Use Passive Scan to detect:
#    - Missing security headers
#    - Cookie flags
#    - Outdated libraries
# 5. Use Active Scan for:
#    - SQL injection attempts
#    - XSS payloads
#    - Path traversal
```

**Learning Focus:**
- Understand OWASP Top 10 (Injection, Broken Auth, XSS, etc.)
- See what automated scanners can find
- Learn how to read security reports

**Acceptance Criteria:**
- [ ] ZAP successfully intercepts HTTPS traffic (with self-signed cert)
- [ ] Passive scan completes
- [ ] Report identifies any security issues in the nhonly UI

---

## Education: Key Pen Testing Concepts

### 1. Reconnaissance
- **What:** Gather info about target (ports, services, technologies)
- **Tools:** nmap, whois, curl, nikto
- **Goal:** Understand attack surface
- **Your Lab:** nmap on 10.0.0.245 to find open ports

### 2. Vulnerability Scanning
- **What:** Automated search for known issues (unpatched services, weak configs)
- **Tools:** nikto, OWASP ZAP, Nessus
- **Goal:** Identify exploitable weaknesses
- **Your Lab:** nikto against your app, ZAP active scan

### 3. Exploitation
- **What:** Attempt to leverage vulnerabilities (auth bypass, code execution)
- **Tools:** Metasploit, Burp Suite, custom scripts
- **Goal:** Prove impact
- **Your Lab:** (Defensive only—don't break your own app; understand *why* certain patterns prevent attacks)

### 4. Post-Exploitation
- **What:** Maintain access, escalate privileges, exfiltrate data
- **Tools:** SSH, cron jobs, file transfer
- **Your Lab:** After successful SSH, explore file system; understand how to clean up access

### 5. Reporting
- **What:** Document findings with severity, remediation steps
- **Tools:** Excel, CVSS scoring, pen testing reports
- **Your Lab:** Save nikto/ZAP reports; write one-sentence fix for each finding

---

## Defense Learning: What to Fix

From your pen testing results, you'll likely find:

1. **Missing Security Headers** → Add in Caddy/SvelteKit
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (or SAMEORIGIN)
   - `Content-Security-Policy: default-src 'self'`

2. **Self-Signed Certificate Warnings** → Accept locally (expected); use Let's Encrypt for nhon-ly.org

3. **Missing Rate Limiting** → Add to API endpoints (if any)

4. **Info Disclosure** → Remove or mask version strings in headers

5. **Weak Cookie Attributes** → Ensure `HttpOnly`, `Secure`, `SameSite=Strict`

---

## Execution Order

1. ✅ Phase 1 deployment (done)
2. → Task 1: Enable SSH with key auth
3. → Task 2: Disable password auth
4. → Task 3: Configure firewall
5. → Task 4: HTTPS with self-signed cert
6. → Task 5: Run nmap, nikto, curl tests
7. → Task 6 (optional): OWASP ZAP interactive testing
8. → Document findings and fixes

---

## Success Criteria

- [ ] SSH key-based auth works; password login disabled
- [ ] Firewall blocks unwanted ports (3000 direct access blocked)
- [ ] HTTPS working (self-signed cert accepted with -k flag)
- [ ] nmap shows only 22/80/443 open
- [ ] nikto runs without errors; report saved
- [ ] App still accessible and functional on HTTPS
- [ ] You understand 3+ pen testing techniques from hands-on practice
- [ ] You've documented findings and defensive fixes

---

## Next: Phase 3 (Post-Deployment)

Once Phase 2 is complete:
- Public HTTPS with Let's Encrypt (if you register nhon-ly.org)
- Tailscale Funnel for temporary public access
- Advanced pen testing (Burp Suite, Metasploit)
- Container security (if you add Docker)

---

**Created:** 2026-04-06
**Status:** Ready for execution
