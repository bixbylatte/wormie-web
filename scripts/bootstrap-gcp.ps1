param(
  [string]$ProjectId = "wormie-ingenuity",
  [string]$Account = "bob.bbvillarin@gmail.com",
  [string]$Region = "asia-east1",
  [string]$GithubOwner = "bixbylatte",
  [string]$GithubRepo = "wormie-web",
  [string]$ArtifactRepository = "wormie-web",
  [string]$ServiceName = "wormie-web",
  [string]$WifPoolId = "github",
  [string]$WifProviderId = "github-actions",
  [string]$RuntimeServiceAccountName = "wormie-web-runtime",
  [string]$DeployerServiceAccountName = "wormie-web-deployer"
)

$ErrorActionPreference = "Stop"

function Invoke-Gcloud {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args
  )

  & gcloud @Args --project $ProjectId --account $Account
  if ($LASTEXITCODE -ne 0) {
    throw "gcloud command failed: gcloud $($Args -join ' ') --project $ProjectId --account $Account"
  }
}

function Ensure-ServiceAccount {
  param(
    [string]$Name,
    [string]$DisplayName
  )

  $lookup = Invoke-Gcloud -Args @("iam", "service-accounts", "list", "--filter", "email~^$Name@$ProjectId\\.iam\\.gserviceaccount\\.com$", "--format", "value(email)")
  if (-not $lookup) {
    Invoke-Gcloud -Args @("iam", "service-accounts", "create", $Name, "--display-name", $DisplayName) | Out-Null
  }
}

function Ensure-ProjectRoleBinding {
  param(
    [string]$Member,
    [string]$Role
  )

  Invoke-Gcloud -Args @("projects", "add-iam-policy-binding", $ProjectId, "--member", $Member, "--role", $Role, "--quiet") | Out-Null
}

$ProjectNumber = & gcloud projects describe $ProjectId --account $Account --format "value(projectNumber)"
if (-not $ProjectNumber) {
  throw "Could not access project '$ProjectId' with account '$Account'. Re-authenticate gcloud first."
}

$RuntimeServiceAccountEmail = "$RuntimeServiceAccountName@$ProjectId.iam.gserviceaccount.com"
$DeployerServiceAccountEmail = "$DeployerServiceAccountName@$ProjectId.iam.gserviceaccount.com"
$WifPoolResource = "projects/$ProjectNumber/locations/global/workloadIdentityPools/$WifPoolId"
$WifProviderResource = "$WifPoolResource/providers/$WifProviderId"
$RepoPrincipal = "principalSet://iam.googleapis.com/$WifPoolResource/attribute.repository/$GithubOwner/$GithubRepo"

Invoke-Gcloud -Args @(
  "services", "enable",
  "artifactregistry.googleapis.com",
  "cloudbuild.googleapis.com",
  "iam.googleapis.com",
  "iamcredentials.googleapis.com",
  "run.googleapis.com",
  "sts.googleapis.com",
  "--quiet"
) | Out-Null

$repoLookup = Invoke-Gcloud -Args @("artifacts", "repositories", "list", "--location", $Region, "--filter", "name~/$ArtifactRepository$", "--format", "value(name)")
if (-not $repoLookup) {
  Invoke-Gcloud -Args @(
    "artifacts", "repositories", "create", $ArtifactRepository,
    "--repository-format", "docker",
    "--location", $Region,
    "--description", "Docker images for Wormie Web"
  ) | Out-Null
}

Ensure-ServiceAccount -Name $RuntimeServiceAccountName -DisplayName "Wormie Web runtime"
Ensure-ServiceAccount -Name $DeployerServiceAccountName -DisplayName "Wormie Web deployer"

$poolLookup = Invoke-Gcloud -Args @("iam", "workload-identity-pools", "list", "--location", "global", "--filter", "name~/$WifPoolId$", "--format", "value(name)")
if (-not $poolLookup) {
  Invoke-Gcloud -Args @(
    "iam", "workload-identity-pools", "create", $WifPoolId,
    "--location", "global",
    "--display-name", "GitHub Actions Pool"
  ) | Out-Null
}

$providerLookup = Invoke-Gcloud -Args @("iam", "workload-identity-pools", "providers", "list", "--location", "global", "--workload-identity-pool", $WifPoolId, "--filter", "name~/$WifProviderId$", "--format", "value(name)")
if (-not $providerLookup) {
  Invoke-Gcloud -Args @(
    "iam", "workload-identity-pools", "providers", "create-oidc", $WifProviderId,
    "--location", "global",
    "--workload-identity-pool", $WifPoolId,
    "--display-name", "GitHub Actions Provider",
    "--issuer-uri", "https://token.actions.githubusercontent.com",
    "--attribute-mapping", "google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner",
    "--attribute-condition", "assertion.repository_owner == '$GithubOwner'"
  ) | Out-Null
}

Invoke-Gcloud -Args @(
  "iam", "service-accounts", "add-iam-policy-binding", $DeployerServiceAccountEmail,
  "--role", "roles/iam.workloadIdentityUser",
  "--member", $RepoPrincipal,
  "--quiet"
) | Out-Null

Ensure-ProjectRoleBinding -Member "serviceAccount:$DeployerServiceAccountEmail" -Role "roles/run.admin"
Ensure-ProjectRoleBinding -Member "serviceAccount:$DeployerServiceAccountEmail" -Role "roles/artifactregistry.writer"
Invoke-Gcloud -Args @(
  "iam", "service-accounts", "add-iam-policy-binding", $RuntimeServiceAccountEmail,
  "--member", "serviceAccount:$DeployerServiceAccountEmail",
  "--role", "roles/iam.serviceAccountUser",
  "--quiet"
) | Out-Null

Write-Host ""
Write-Host "Wormie Web GCP foundation is ready."
Write-Host "Project number: $ProjectNumber"
Write-Host "Workload Identity Provider: $WifProviderResource"
Write-Host "Runtime service account: $RuntimeServiceAccountEmail"
Write-Host "Deployer service account: $DeployerServiceAccountEmail"
