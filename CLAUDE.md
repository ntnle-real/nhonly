# Claude Kernel Projection (nhonly)

This project uses C3 contract patterns via a local kernel organ.

## THE TURN → Orient with kernel

1. Read `C3/kernel/THEORY.md` — Understand the forces (Purpose, Success, Failure, binding spatial proof)
2. Read `C3/kernel/BOOTSTRAP.md` — Learn how to write contracts using the MARK pattern and gradient thinking
3. Study `C3/kernel/EXAMPLES/typescript/` and `C3/kernel/EXAMPLES/svelte/` — Real contract implementations
4. Read `C3/kernel/CONTRACTS.md` — Copy-paste contract templates for all shapes
5. Reference `C3/kernel/obs_api.md` — Observation API (obs.step, obs.observe, obs.return_)

## Writing Code

All nhonly code follows C3 contract patterns:

- **Every function**: Use the MARK pattern with Purpose → Success → Failure → contract → conduct signature
- **Every contract**: Declare intent with obs.step(), observe conditions, return success/failure
- **Every shape**: Follow the templates in C3/kernel/CONTRACTS.md exactly
- **Gradient thinking**: Build understanding through successive obs.observe() calls
- **No external C3 reference**: The kernel is complete and self-contained. Read only files in C3/kernel/

## Kernel Details

- **Kernel location**: `C3/kernel/` (local to this project)
- **Kernel version**: 1.0
- **Language coverage**: TypeScript (SvelteKit frontend), JavaScript (utilities), SQL (if needed)
- **Examples are templates**: Copy C3/kernel/EXAMPLES/ patterns into feature code; they're starting points, not libraries
