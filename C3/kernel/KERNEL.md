# C3 Child Kernel

## Metadata and File Manifest

This file describes the kernel's structure, version, and contents.

## Kernel Version

Version: 1.0
Release Date: 2026-04-05
Status: Stable
Stability: The kernel is designed for long-term use. Updates maintain backward compatibility.

## What's Included

The kernel contains the following core files and examples:

```
kernel/
├── README.md                    # Quick-start orientation guide
├── THEORY.md                    # Five forces and spatial proof shape
├── BOOTSTRAP.md                 # How Claude orients and writes contracts
├── CONTRACTS.md                 # Copy-paste templates for all 5 languages
├── obs_api.md                   # Complete observation API reference
├── KERNEL.md                    # This file (metadata and manifest)
└── EXAMPLES/
    ├── python/
    │   ├── validate.py          # Email validation contract
    │   └── transform.py         # User data transformation contract
    ├── javascript/
    │   ├── validate.js          # Email validation contract
    │   └── transform.js         # User data transformation contract
    ├── typescript/
    │   ├── validate.ts          # Email validation contract
    │   └── transform.ts         # User data transformation contract
    ├── svelte/
    │   ├── FormValidator.svelte # Email validation component
    │   └── DataTransformer.svelte # User data transformation component
    └── sql/
        ├── validate.sql         # Schema-level validation
        └── transform.sql        # User data transformation procedure
```

## How to Load the Kernel

Child projects load the kernel via CLAUDE.md in the project root:

```markdown
# Claude Kernel Projection (my_project)

This project uses C3 contract patterns via kernel.

## THE TURN -> Orient with kernel

1. Load C3 kernel from /Users/server/C3/kernel/ or via C3_KERNEL_PATH
2. Read kernel/THEORY.md (5 min) — understand the five forces
3. Read kernel/BOOTSTRAP.md (10 min) — learn contract shapes
4. Study kernel/EXAMPLES/{language}/ (15 min) — see real implementations
5. Write code using kernel/CONTRACTS.md shapes with obs calls
```

See kernel/README.md for detailed orientation instructions.

## What the Kernel Teaches

The kernel teaches 5 core concepts:

1. **MARK** — Chapter boundaries that stay legible
2. **Purpose** — One sentence declaring what a region does
3. **Success** — Observable conditions that define winning
4. **Failure** — Observable conditions that define losing
5. **Conduct** — Execution with obs calls (obs.read, obs.step, obs.observe, obs.return_)

The spatial arrangement MARK < Purpose < Success < Failure < contract < conduct < binding IS THE PROOF that intent became correct execution.

The kernel does NOT teach TALK/CONVERGE/RATIFY/GROWTH or mutation control. Those are C3-specific. The kernel is general-purpose contract-driven development.

## File Manifest

| File | Type | Approx Lines | Purpose |
|------|------|--------------|---------|
| README.md | Markdown | 140 | Quick-start orientation |
| THEORY.md | Markdown | 260 | Forces and proof shape |
| BOOTSTRAP.md | Markdown | 280 | Contract shapes and patterns |
| CONTRACTS.md | Markdown | 300 | Copy-paste templates |
| obs_api.md | Markdown | 220 | API reference |
| KERNEL.md | Markdown | 170 | Metadata (this file) |
| EXAMPLES/python/validate.py | Python | 80 | Validation contract |
| EXAMPLES/python/transform.py | Python | 120 | Transformation contract |
| EXAMPLES/javascript/validate.js | JavaScript | 70 | Validation contract |
| EXAMPLES/javascript/transform.js | JavaScript | 110 | Transformation contract |
| EXAMPLES/typescript/validate.ts | TypeScript | 80 | Validation contract (typed) |
| EXAMPLES/typescript/transform.ts | TypeScript | 130 | Transformation contract (typed) |
| EXAMPLES/svelte/FormValidator.svelte | Svelte | 120 | Validation component |
| EXAMPLES/svelte/DataTransformer.svelte | Svelte | 130 | Transformation component |
| EXAMPLES/sql/validate.sql | SQL | 70 | Validation schema |
| EXAMPLES/sql/transform.sql | SQL | 100 | Transformation procedure |

Total documentation: ~1570 lines
Total examples: ~1000 lines
Grand total: ~2570 lines

## Verification Checklist

The kernel is verified complete when:

- [ ] No forward references to C3 implementation (core/, DNA.md, etc.)
- [ ] No mention of state machine (TALK, CONVERGE, RATIFY, GROWTH)
- [ ] All 5 languages have 2-3 examples each
- [ ] All obs API methods documented (obs.read, obs.step, obs.observe, obs.return_)
- [ ] All contract templates copy-paste ready
- [ ] All example code syntactically valid
- [ ] All files use consistent markdown formatting
- [ ] THEORY and BOOTSTRAP reference each other correctly
- [ ] README directs users to THEORY → BOOTSTRAP → EXAMPLES
- [ ] EXAMPLES match patterns from CONTRACTS.md

## Using the Kernel in Child Projects

### Step 1: Create CLAUDE.md in Your Project Root

Your project needs a CLAUDE.md file that tells Claude to load the kernel. Here's a template:

```markdown
# Claude Kernel Projection (YourProject)

This project uses C3 contract patterns via the child kernel.

## THE TURN -> Orient with kernel

When working in this project, Claude orients by loading the kernel:

1. Read kernel/THEORY.md to understand forces: MARK, Purpose, Success, Failure, Conduct
2. Read kernel/BOOTSTRAP.md to learn contract shapes for your language
3. Read kernel/EXAMPLES/{language}/ to see real working contracts
4. Write all code using kernel/CONTRACTS.md templates with obs API calls

## Your Project's Contract Rules

All functions in this project follow the kernel contract shape:
- Begin with a human-readable MARK and Purpose comment
- Declare Success and Failure conditions
- Use obs.read, obs.step, obs.observe, obs.return_ for execution tracking
- End with observable proof that intent matched implementation
```

### Step 2: Reference the Kernel Path

Set the C3_KERNEL_PATH environment variable or use an absolute path:

```bash
export C3_KERNEL_PATH=/Users/server/C3/kernel
```

Or in your CLAUDE.md, use the absolute path directly.

### Step 3: Follow Contract Patterns

Copy contract templates from kernel/CONTRACTS.md for your language. Customize variable names and business logic, but preserve the contract shape:

```
MARK: <Region Purpose>
Purpose: <One sentence declaring what this function does>
Success: <Observable conditions for winning>
Failure: <Observable conditions for losing>
contract: <Machine-readable declaration (language-specific)>
conduct: <Implementation with obs API calls>
binding: <Connection between contract and conduct>
```

## Kernel Distribution and Updates

The kernel lives in `/Users/server/C3/kernel/` and is maintained by the C3 team.

**Versioning:** The kernel uses semantic versioning. Version 1.0 establishes the initial contract API. Future versions will maintain backward compatibility.

**Updates:** When the kernel is updated, child projects pull the latest version from C3. No code changes are needed as long as the contract API remains stable.

**Stability Promise:** The kernel maintains backward compatibility. Code written against kernel 1.0 will run against 1.x versions.

## Troubleshooting

If Claude in a child project cannot find the kernel:

1. Check that C3_KERNEL_PATH is set: `echo $C3_KERNEL_PATH`
2. Verify kernel files exist: `ls kernel/README.md kernel/THEORY.md`
3. Check CLAUDE.md has the kernel path specified
4. If using a relative path, ensure it resolves from the child project root

## Next Steps

The kernel is ready for:
1. Child projects to attach via CLAUDE.md
2. Integration tests to verify child project usage
3. Long-term use with version stability
4. Extensions for additional languages or patterns
