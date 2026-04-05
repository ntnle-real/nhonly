# Claude Kernel Projection Example — How to Load the Kernel in a Child Project

This file shows how a child project (like nhonly) would create its own CLAUDE.md to load and use the C3 kernel.

---

# Claude Kernel Projection (nhonly)

This project uses C3 contract patterns via kernel for all code.

## THE TURN -> Orient with kernel

When Claude works in this project, the first act is to load the kernel and read these three files:

**Step 1: Load the kernel** (sets the context boundary)
```
C3_KERNEL_PATH=/Users/server/C3/kernel/
```

**Step 2: Read kernel/THEORY.md** (5 minutes)
Understand the five forces that keep code legible:
- MARK: Chapter boundaries visible on the minimap
- Purpose: One sentence declaring what a region does
- Success: Observable conditions that define winning
- Failure: Observable conditions that define losing
- Conduct: Execution with obs calls (obs.read, obs.step, obs.observe, obs.return_)

The spatial arrangement MARK < Purpose < Success < Failure < contract < conduct < binding IS THE PROOF.

**Step 3: Read kernel/BOOTSTRAP.md** (10 minutes)
Learn contract shapes for your language. Contracts are declarations of intent that bind execution. They have two parts:
- The contract (what we promise)
- The conduct (what we do)

Reading the contract first, without seeing the code, you should understand the entire plot.

**Step 4: Study kernel/EXAMPLES/{language}/** (15 minutes)
Read at least 2 working examples in your language. Examples are copy-paste templates:
- kernel/EXAMPLES/python/validate.py
- kernel/EXAMPLES/python/transform.py
- kernel/EXAMPLES/javascript/validate.js
- kernel/EXAMPLES/javascript/transform.js
- kernel/EXAMPLES/typescript/validate.ts
- kernel/EXAMPLES/typescript/transform.ts
- kernel/EXAMPLES/svelte/FormValidator.svelte
- kernel/EXAMPLES/svelte/DataTransformer.svelte
- kernel/EXAMPLES/sql/validate.sql
- kernel/EXAMPLES/sql/transform.sql

## Code Rules in nhonly

All code in nhonly follows the kernel contract shape:

```
MARK: <Region Purpose>
Purpose: <One sentence declaring what this function does>
Success: <Observable conditions for winning>
Failure: <Observable conditions for losing>
contract: <Machine-readable declaration>
conduct: <Implementation with obs API calls>
binding: <Connection between contract and conduct>
```

1. **Copy a template** from kernel/CONTRACTS.md for your language
2. **Customize** variable names and business logic
3. **Preserve** the contract shape (Purpose, Success, Failure, conduct)
4. **Use obs API** calls: obs.read(), obs.step(), obs.observe(), obs.return_()
5. **No state machine** — nhonly does not use TALK/CONVERGE/RATIFY/GROWTH

## Reference Files

When writing code:
- **For contract shapes:** kernel/CONTRACTS.md (copy-paste templates)
- **For obs API:** kernel/obs_api.md (method reference)
- **For working code:** kernel/EXAMPLES/{language}/ (real implementations)

## The Contract Is the Proof

Code in nhonly is not "working" until you can read it top-down and understand the plot without execution.

The contract declares:
- What this function is for (Purpose)
- What winning looks like (Success)
- What losing looks like (Failure)

The conduct shows:
- Each step of execution (obs.step calls)
- What we observed (obs.observe calls)
- What we return (obs.return_ calls)

A reader can verify the proof by reading the code layout, not by executing it.

---

## How to Copy This File for Your Project

1. Replace "nhonly" with your project name
2. Replace kernel path with your absolute path to /Users/server/C3/kernel/
3. Keep all kernel orientation steps (THEORY → BOOTSTRAP → EXAMPLES)
4. Add your project-specific code rules (if any)
5. Commit this file to your project root as CLAUDE.md

Then Claude will:
1. Load this file first when working in your project
2. Know to read kernel/THEORY.md, BOOTSTRAP.md, EXAMPLES/
3. Write all code following the contract shape
4. Use obs API calls matching the kernel patterns

---

## Success Criteria for nhonly Code

Code is ready when:
- [ ] Every function has a MARK and Purpose comment
- [ ] Every function declares Success and Failure conditions
- [ ] Every function uses obs.read, obs.step, obs.observe, obs.return_ appropriately
- [ ] Reading the function top-down reveals the plot
- [ ] No obs calls are forgotten or misnamed
- [ ] The contract matches the conduct exactly
