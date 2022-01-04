# Squonk (Frontend)

This monorepo allows many parts of the most user-facing parts of Squonk (v2) to be developed in tandem.

The packages are grouped into:

1. [Apps](apps/packages.md)
2. [Libraries](libs/packages.md)

## Setup

This repository uses Git Submodules. [This is a good starting point for the unfamiliar](https://blog.bitsrc.io/how-to-utilize-submodules-within-git-repos-5dfdd1c62d09).

1. Clone the repo with the `--recurse-submodules` argument to `git clone`. Or clone normally and run `git submodule update --init --recursive`

2. Install and link all packages using `pnpm install`

## Pushing changes to submodules

Since pnpm creates local links in the `pnpm-lock.yaml`, we need to regenerate this before pushing so that each submodule can be a singleton.

1. Remove modified `pnpm-lock.yaml` files
2. Set `link-workspace-packages` in `.npmrc` to `false`
3. Re-run `pnpm install`

Checking the lockfile should not show any links between packages. The updated submodules should be ready to push changes once the lockfile is committed.
