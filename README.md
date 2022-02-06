# Squonk (Frontend)

This monorepo allows many parts of the most user-facing parts of Squonk (v2) to be developed in tandem.

The packages are grouped into:

1. [Apps](apps/packages.md)
2. [Libraries](libs/packages.md)

Each of these separate repos should essentially be as if the monorepo didn't exist. See [Pushing changes to submodules](#pushing-changes-to-submodules) for how to do this.
## Setup

This repository uses Git Submodules. [This is a good starting point for the unfamiliar](https://blog.bitsrc.io/how-to-utilize-submodules-within-git-repos-5dfdd1c62d09).

1. Clone the repo with the `--recurse-submodules` argument to `git clone`. Or clone normally and run `git submodule update --init --recursive`

2. Install and link *all packages* using `pnpm i:link` from the monorepo root


## Pushing changes to submodules

`pnpm` creates local links in the `pnpm-lock.yaml` which is very useful in development but we don't want these relative urls in the pushed commits. We need to regenerate the `pnpm-lock.yaml`s before pushing so that each submodule can be a singleton.

1. Run `pnpm i:remote` from the monorepo root. This will replace local links with the equivalent version from `npm`.

*Check* the lockfile, ensuring it *should not show any links* between packages. The updated submodules should be ready to push changes once the lockfile is committed.

Note that the `HEAD` of each submodule is not automatically updated when changes are made to the submodules' remotes. This needs to be kept up-to-date manually. Essentially this involves pushing changes to a submodules as above. Then committing the changes to the submodules at the root of the repo, its helpful to keep the submodules `HEAD`s up-to-date.

## `MONOREPO` Environment Variable

Some root npm scripts will set an environment variable `MONOREPO` which can be used to conditionally do things depending on whether the package is in the monorepo or not (also useful for ensuring the package works outside of the monorepo which it should).
