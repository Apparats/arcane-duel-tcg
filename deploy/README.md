# Production deploy

GitHub `main` is the official production source. Every push to `main` runs the
`Deploy to Oracle VM` workflow and publishes the current repository contents to
the Oracle server.

## Required GitHub secrets

Open the repository on GitHub, then go to:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Add these secrets:

| Secret | Value |
| --- | --- |
| `ORACLE_HOST` | Public server IP or hostname, for example `129.159.183.48` |
| `ORACLE_SSH_KEY` | Full private SSH key used to connect to the VM |

Optional secrets:

| Secret | Default |
| --- | --- |
| `ORACLE_USER` | `ubuntu` |
| `ORACLE_APP_DIR` | `/home/ubuntu/arcane-duel-tcg` |
| `ORACLE_SERVICE` | `arcane-duel` |

Do not commit `.env`, SSH keys, MongoDB credentials, Discord secrets, or tunnel
tokens. The deploy workflow keeps the server's existing `.env` file in place.

If `ORACLE_HOST` or `ORACLE_SSH_KEY` is missing, the workflow will skip the
deploy instead of failing. Add both secrets, then run the workflow manually once
or push a new commit to `main`.

## Normal update flow

1. Edit the project locally.
2. Run checks locally if needed.
3. Commit and push to `main`.
4. GitHub Actions uploads the release, installs production dependencies, runs the
   smoke test, and restarts the systemd service.

You can also deploy manually from GitHub with:

`Actions -> Deploy to Oracle VM -> Run workflow`

## Server expectations

The VM must already have:

- Node.js and npm installed.
- The systemd service installed as `arcane-duel`.
- A valid `.env` at `/home/ubuntu/arcane-duel-tcg/.env`.
- The SSH public key authorized for the configured user.
