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
.\scripts\configure-github-repo.ps1 -ApiBaseUrl "https://your-api-service-url"
```

### Manual fallback deploy

Deploy this repo manually as its own Cloud Run service:

```powershell
.\scripts\deploy-cloud-run.ps1 `
  -ProjectId wormie-ingenuity `
  -Account bob.bbvillarin@gmail.com `
  -RuntimeServiceAccount "wormie-web-runtime@wormie-ingenuity.iam.gserviceaccount.com" `
  -ApiBaseUrl "https://your-api-service-url" `
  -AllowUnauthenticated
```

### Protect `main`

Once CI has run successfully at least once, protect the production branch:

```powershell
.\scripts\enable-branch-protection.ps1
```

## Notes

- PRs validate the Vite build and Docker build.
- Pushes to `main` deploy production directly.
- The API repo still owns CORS; after the first web deployment, rerun the API repo configuration with the final web URL in `API_ALLOWED_ORIGINS`.
