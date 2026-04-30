param(
  [string]$ProjectId = "wormie-ingenuity",
  [string]$Account = "bob.bbvillarin@gmail.com",
  [string]$ServiceName = "wormie-web",
  [string]$Region = "asia-east1",
  [string]$Repository = "wormie-web",
  [string]$RuntimeServiceAccount,
  [string]$ApiServiceName = "wormie-api",
  [string]$ApiBaseUrl,
  [switch]$AllowUnauthenticated
)

$ErrorActionPreference = "Stop"
function Get-CloudRunServiceUrls {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ServiceName
  )

  $serviceJson = & gcloud run services describe $ServiceName `
    --project $ProjectId `
    --account $Account `
    --region $Region `
    --format json

  if ($LASTEXITCODE -ne 0 -or -not $serviceJson) {
    throw "Could not resolve Cloud Run service URLs for '$ServiceName'."
  }

  $service = $serviceJson | ConvertFrom-Json
  $urls = @()
  $annotationUrls = $service.metadata.annotations.'run.googleapis.com/urls'

  if ($annotationUrls) {
    $urls += $annotationUrls | ConvertFrom-Json
  }

  if ($service.status.url) {
    $urls += $service.status.url
  }

  return $urls | Where-Object { $_ } | Select-Object -Unique
}

function Get-PreferredCloudRunUrl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ServiceName
  )

  $urls = Get-CloudRunServiceUrls -ServiceName $ServiceName
  $regionalUrl = $urls | Where-Object { $_ -like "https://*.$Region.run.app" } | Select-Object -First 1
  if ($regionalUrl) {
    return $regionalUrl
  }

  return $urls | Select-Object -First 1
}
if (-not $RuntimeServiceAccount) {
  throw "Provide -RuntimeServiceAccount with the web Cloud Run runtime service account email."
}

if (-not $ApiBaseUrl) {
  if (-not $ApiServiceName) {
    throw "Provide -ApiBaseUrl with the public backend URL before deploying, or pass -ApiServiceName to resolve it automatically."
  }

  $ApiBaseUrl = Get-PreferredCloudRunUrl -ServiceName $ApiServiceName
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
$imageUri = "$Region-docker.pkg.dev/$ProjectId/$Repository/${ServiceName}:$imageTag"
$envFile = New-TemporaryFile

try {
  @"
API_BASE_URL: "$ApiBaseUrl"
"@ | Set-Content -Path $envFile -Encoding utf8

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
    "--service-account", $RuntimeServiceAccount,
    "--cpu", "1",
    "--memory", "512Mi",
    "--concurrency", "80",
    "--min-instances", "0",
    "--execution-environment", "gen2",
    "--env-vars-file", $envFile
  )

  if ($AllowUnauthenticated) {
    $deployArgs += "--allow-unauthenticated"
  }
  else {
    $deployArgs += "--no-allow-unauthenticated"
  }

  & gcloud @deployArgs

  $serviceUrl = Get-PreferredCloudRunUrl -ServiceName $ServiceName
  $serviceUrls = Get-CloudRunServiceUrls -ServiceName $ServiceName

  Invoke-WebRequest -Uri "$serviceUrl/health" -UseBasicParsing | Out-Null

  Write-Host ""
  Write-Host "Deployed $ServiceName to Cloud Run."
  Write-Host "Image: $imageUri"
  Write-Host "Service URLs: $($serviceUrls -join ', ')"
  Write-Host "Runtime API base URL: $ApiBaseUrl"
}
finally {
  Remove-Item -LiteralPath $envFile -Force -ErrorAction SilentlyContinue
}
