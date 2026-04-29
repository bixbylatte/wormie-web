$ErrorActionPreference = "Stop"

param(
  [string]$ProjectId = "wormie-ingenuity",
  [string]$Account = "bob.bbvillarin@gmail.com",
  [string]$ServiceName = "wormie-web",
  [string]$Region = "asia-east1",
  [string]$Repository = "wormie-web",
  [string]$ApiBaseUrl,
  [switch]$AllowUnauthenticated
)

if (-not $ApiBaseUrl) {
  throw "Provide -ApiBaseUrl with the public backend URL before deploying."
}

$projectNumber = & gcloud projects describe $ProjectId --account $Account --format="value(projectNumber)"
if (-not $projectNumber) {
  throw "Could not access project '$ProjectId' with account '$Account'. Run 'gcloud auth login $Account' first, or confirm the project id."
}

& gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com `
  --project $ProjectId `
  --account $Account

$repositoryLookup = & gcloud artifacts repositories list `
  --project $ProjectId `
  --account $Account `
  --location $Region `
  --filter "name~/$Repository$" `
  --format "value(name)"

if (-not $repositoryLookup) {
  & gcloud artifacts repositories create $Repository `
    --repository-format docker `
    --location $Region `
    --description "Docker images for Wormie Web" `
    --project $ProjectId `
    --account $Account
}

$imageTag = Get-Date -Format "yyyyMMdd-HHmmss"
$imageUri = "$Region-docker.pkg.dev/$ProjectId/$Repository/$ServiceName:$imageTag"

& gcloud builds submit `
  --tag $imageUri `
  --project $ProjectId `
  --account $Account `
  .

$deployArgs = @(
  "run", "deploy", $ServiceName,
  "--image", $imageUri,
  "--region", $Region,
  "--platform", "managed",
  "--project", $ProjectId,
  "--account", $Account,
  "--set-env-vars", "API_BASE_URL=$ApiBaseUrl"
)

if ($AllowUnauthenticated) {
  $deployArgs += "--allow-unauthenticated"
}
else {
  $deployArgs += "--no-allow-unauthenticated"
}

& gcloud @deployArgs

Write-Host ""
Write-Host "Deployed $ServiceName to Cloud Run."
Write-Host "Image: $imageUri"
