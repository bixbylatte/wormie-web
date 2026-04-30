param(
  [string]$Owner = "bixbylatte",
  [string]$Repo = "wormie-web",
  [string]$ProjectId = "wormie-ingenuity",
  [string]$ProjectNumber,
  [string]$Account = "bob.bbvillarin@gmail.com",
  [string]$Region = "asia-east1",
  [string]$ArtifactRepository = "wormie-web",
  [string]$ServiceName = "wormie-web",
  [string]$WifPoolId = "github",
  [string]$WifProviderId = "github-actions",
  [string]$RuntimeServiceAccountName = "wormie-web-runtime",
  [string]$DeployerServiceAccountName = "wormie-web-deployer",
  [string]$ApiBaseUrl
)

$ErrorActionPreference = "Stop"

if (-not $ApiBaseUrl) {
  throw "Provide -ApiBaseUrl with the production Wormie API URL before enabling main-branch deployments."
}

if (-not $ProjectNumber) {
  $ProjectNumber = & gcloud projects describe $ProjectId --account $Account --format "value(projectNumber)"
}

if (-not $ProjectNumber) {
  throw "Could not resolve project number for '$ProjectId'. Re-authenticate gcloud first."
}

$providerResource = "projects/$ProjectNumber/locations/global/workloadIdentityPools/$WifPoolId/providers/$WifProviderId"
$runtimeServiceAccount = "$RuntimeServiceAccountName@$ProjectId.iam.gserviceaccount.com"
$deployerServiceAccount = "$DeployerServiceAccountName@$ProjectId.iam.gserviceaccount.com"

$vars = @{
  "GCP_PROJECT_ID" = $ProjectId
  "GCP_PROJECT_NUMBER" = $ProjectNumber
  "GCP_REGION" = $Region
  "ARTIFACT_REPOSITORY" = $ArtifactRepository
  "CLOUD_RUN_SERVICE" = $ServiceName
  "WIF_PROVIDER" = $providerResource
  "DEPLOYER_SERVICE_ACCOUNT" = $deployerServiceAccount
  "RUNTIME_SERVICE_ACCOUNT" = $runtimeServiceAccount
  "API_BASE_URL" = $ApiBaseUrl
}

foreach ($item in $vars.GetEnumerator()) {
  & 'C:\Program Files\GitHub CLI\gh.exe' variable set $item.Key --repo "$Owner/$Repo" --body $item.Value
}

Write-Host ""
Write-Host "Configured GitHub Actions variables for $Owner/$Repo."
