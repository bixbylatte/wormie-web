# Wormie Web

Frontend service for Wormie. This repo is designed to stand on its own and deploy separately from the API.

## Local setup

1. Run `npm install`
2. Start the app with `npm run dev`
3. Open [http://127.0.0.1:5173](http://127.0.0.1:5173)

For local development, leave `VITE_API_BASE_URL` unset and let Vite proxy `/api` and `/media` to `http://127.0.0.1:8000`.

## Docker

```bash
docker build -t wormie-web .
docker run --rm -p 8080:8080 -e API_BASE_URL=https://your-api-service-url wormie-web
```

## Cloud Run

This repo deploys as its own public Cloud Run service and reads `API_BASE_URL` at runtime from `config.js`, so production frontend deploys do not require a rebuild for API URL changes.

### Bootstrap GCP

Create the web-specific production foundation once:

```powershell
.\scripts\bootstrap-gcp.ps1
```

Before you run it, attach an active billing account to the `wormie-ingenuity` project. Cloud Run and Artifact Registry cannot be enabled without billing.

That script creates or updates:

- Artifact Registry repo `wormie-web`
- runtime and deployer service accounts
- the shared GitHub Workload Identity Federation pool/provider if missing

### Configure GitHub Actions

After the API has a stable public URL, configure repository variables:

```powershell
.\scripts\configure-github-repo.ps1
```

By default that resolves the live `wormie-api` Cloud Run service and stores its regional `...asia-east1.run.app` URL as `API_BASE_URL`.

### Manual fallback deploy

Deploy this repo manually as its own Cloud Run service:

```powershell
.\scripts\deploy-cloud-run.ps1 `
  -ProjectId wormie-ingenuity `
  -Account bob.bbvillarin@gmail.com `
  -RuntimeServiceAccount "wormie-web-runtime@wormie-ingenuity.iam.gserviceaccount.com" `
  -AllowUnauthenticated
```

### Protect `main`

Once CI has run successfully at least once, protect the production branch:

```powershell
.\scripts\enable-branch-protection.ps1
```

That script also configures the repository to use squash merges only.

## PR To Production

Production changes should flow through GitHub only:

1. Branch from `main`.
2. Open a PR and wait for the `ci` workflow to pass.
3. Get one approval and resolve review comments.
4. Squash merge to `main`.
5. Let `deploy-prod` publish to Cloud Run automatically.

If a change spans both repos, merge and deploy `wormie-api` first, then merge `wormie-web` after the API deployment smoke checks pass.

## Notes

- Production covers should load directly from public GCS URLs.
- Legacy relative cover URLs such as `/media/...` are still resolved against the runtime `API_BASE_URL` during the transition period.
- Listings whose underlying cover files are already missing now show a placeholder card state; users need to re-upload those covers if the original files are unrecoverable.
- PRs validate the Vite build and Docker build.
- Pushes to `main` deploy production directly.
- The API repo still owns CORS. After the first web deployment, rerun the API repo configuration with `-WebServiceName "wormie-web"` so both public web URLs are present in `API_ALLOWED_ORIGINS`.
- Use `workflow_dispatch` as break-glass only. Avoid direct `gcloud` production hotfixes; if one is unavoidable, merge the matching repo fix immediately after.
