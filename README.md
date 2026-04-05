# C3 Child Kernel

**Portable contract patterns and gradient architecture**

The C3 kernel is a self-similar, self-contained guide to writing code using contracts, gradients, and spatial proof. Child projects load it to bootstrap Claude with C3's discipline without requiring the full C3 framework.

## What Is This?

The kernel teaches three core ideas:

1. **Contracts declare intent before execution.** Write what your code will do, what conditions define success and failure, then implement to match.

2. **Gradients make execution auditable through spatial arrangement.** Use `obs.step()`, `obs.observe()`, and `obs.return_()` to mark every boundary and observation, creating a readable trace of execution.

3. **The proof shape is language-independent.** The arrangement (MARK < Purpose < Success < Failure < contract < conduct < binding) works in Python, JavaScript, SQL, Svelte, and any language that respects spatial locality.

**This is NOT the C3 state machine.** This is NOT mutation control. This teaches contract patterns and how to write code that is readable and verifiable.

**If you read C3's THEORY.md, you understand the kernel's THEORY.md.** Same concepts, portable version.

## Why Use It?

Three benefits:

1. **Code becomes readable before execution.** Open a file, read top-down, and the spatial proof shape tells you the plot without running anything.

2. **Claude understands contract patterns immediately.** When you follow kernel shapes, Claude recognizes the structure and never asks for context.

3. **Execution is auditable through obs calls.** The gradient trace (what was read, what steps happened, what was observed, what was returned) proves that code matched its contract.

The kernel is complete. No "go read C3 for details" — everything you need is here.

## Quick Start

Three-step orientation. Takes 30 minutes total:

1. **Read THEORY.md (5 min)** — Understand the nine forces. You now understand the conceptual model.

2. **Read BOOTSTRAP.md (10 min)** — Learn how to write contracts in your language. You now know the pattern.

3. **Study EXAMPLES/ (15 min)** — See real implementations in your language. You can now write contracts.

After those 30 minutes: **Write all code following kernel/CONTRACTS.md shapes using obs.step/observe/return_**

See BOOTSTRAP.md § THE LOAD for detailed steps.

## File Guide

This kernel contains everything you need:

- **THEORY.md** — Distilled C3 forces and the spatial proof shape. No implementation details.
- **BOOTSTRAP.md** — How Claude orients using the kernel. The three-step load sequence.
- **CONTRACTS.md** — Contract templates for Python, JavaScript, TypeScript, Svelte, SQL. Copy these patterns.
- **obs_api.md** — Reference for obs.step(), obs.observe(), obs.return_(). Complete API docs.
- **EXAMPLES/** — Real working implementations in each language. Copy and customize these.

## For Child Projects

Your project's CLAUDE.md should reference the kernel:

```markdown
# Claude Kernel Projection

This project uses C3 contract patterns via kernel.

## THE TURN -> Orient with kernel
1. Load C3 kernel from /Users/server/C3/kernel/ or via C3_KERNEL_PATH environment variable
2. Read kernel/THEORY.md
3. Read kernel/BOOTSTRAP.md
4. Study kernel/EXAMPLES/{your_language}/
5. Write all code using kernel/CONTRACTS.md shapes with obs calls
```

Per D-03, this attachment is explicit, not implicit.

## Kernel Version

This is Kernel v1.0. Versions track updates but do not break child projects.

Child projects reference the kernel by path: `/Users/server/C3/kernel/`. Updates to the kernel are immediately available to all child projects without any child project changes required.
