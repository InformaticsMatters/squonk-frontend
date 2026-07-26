# Squonk (Frontend)

This monorepo allows many parts of the most user-facing parts of Squonk (v2) to be developed in tandem.

The packages are grouped into:

1. [Apps](apps/packages.md)
2. [Libraries](libs/packages.md)

Each of these separate repos should essentially be as if the monorepo didn't exist. See [Pushing changes to submodules](#pushing-changes-to-submodules) for how to do this.

## Setup

This repository uses Git Submodules. [This is a good starting point for the unfamiliar](https://blog.bitsrc.io/how-to-utilize-submodules-within-git-repos-5dfdd1c62d09).

1. Clone the repo with the `--recurse-submodules` argument to `git clone`. Or clone normally and run `git submodule update --init --recursive`

2. Install and link _all packages_ using `pnpm i:link` from the monorepo root

## Local OpenAPI Clients

Generated OpenAPI client packages can be built locally for testing API spec changes that are not yet published to npm (packages are published by CI). The generated packages and local OpenAPI specs are intentionally ignored by Git.

To generate both local clients and link them into workspace consumers:

```bash
pnpm generate:clients:link
```

To generate one client:

```bash
pnpm generate:client:data-manager
pnpm generate:client:account-server
```

The generator reads the ignored OpenAPI specs from `openapi/`, builds each client in `.client-build/`, and replaces the corresponding ignored package in `libs/` with only `package.json`, `src/`, and `dist/`.

After generating without `:link`, run `pnpm i:link` from the monorepo root if apps should resolve the local generated clients instead of the published npm packages.

`data-manager-ui` installs generated OpenAPI clients as injected pnpm dependencies so their React/React Query peers resolve from the app. Because injected dependencies are copied into the app's virtual store, regenerate and relink clients with `pnpm generate:clients:link` after changing OpenAPI specs. Running only `pnpm generate:client:*` can leave the app using a stale injected copy until `pnpm i:link` is run from the monorepo root.

## Pushing changes to submodules

`pnpm` creates local links in the `pnpm-lock.yaml` which is very useful in development but we don't want these relative urls in the pushed commits. We need to regenerate the `pnpm-lock.yaml`s before pushing so that each submodule can be a singleton.

1. Run `pnpm i:remote` from the monorepo root. This will replace local links with the equivalent version from `npm`.

_Check_ the lockfile, ensuring it _should not show any links_ between packages. The updated submodules should be ready to push changes once the lockfile is committed.

Note that the `HEAD` of each submodule is not automatically updated when changes are made to the submodules' remotes. This needs to be kept up-to-date manually. Essentially this involves pushing changes to a submodules as above. Then committing the changes to the submodules at the root of the repo, its helpful to keep the submodules `HEAD`s up-to-date.

## Adding a new submodule

Use `git submodule add <url> <path>` to add a submodule to the registry. Then commit the `.gitmodules` file and the repo ref.

## Monorepo vs Polyrepo Mode

The submodule and pnpm configuration allow development with both a monorepo repo (locally linked pages) and a polyrepo (packages from the registry). These can be toggled with the `--link-workspace-packages` flag to `pnpm`.

- `pnpm i` install in _polyrepo mode_
- `pnpm i --link-workspace-packages` install in _monorepo mode_

Warning: in monorepo mode packages will only be linked if the **versions match**. I.e the dependency version in the consumer package must match the version field of the library.
