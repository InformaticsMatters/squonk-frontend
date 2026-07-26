# Local OpenAPI Specs

Place local OpenAPI specs in this directory when generating local JavaScript clients.

Expected filenames:

- `data-manager.yaml`
- `account-server.yaml`

The spec files are intentionally ignored by Git because they are local inputs and can go out of date quickly. The committed client metadata lives in `../tools/openapi-clients.json`.
