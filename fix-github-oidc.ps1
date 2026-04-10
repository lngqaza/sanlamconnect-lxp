$ErrorActionPreference = "Stop"

# ===== EDIT THESE =====
$AwsAccountId = "684756697968"
$Region       = "eu-west-1"
$GitHubOrg    = "lngqaza"
$GitHubRepo   = "sanlamconnect-lxp"
$RoleName     = "GitHubActionsDeployRole"
$Branch       = "main"
# ======================

Write-Host "Checking AWS login..." -ForegroundColor Cyan
aws sts get-caller-identity

$ProviderArn = "arn:aws:iam::$AwsAccountId:oidc-provider/token.actions.githubusercontent.com"

Write-Host "Checking for GitHub OIDC provider..." -ForegroundColor Cyan
$providerExists = $false
try {
    aws iam get-open-id-connect-provider --open-id-connect-provider-arn $ProviderArn | Out-Null
    $providerExists = $true
} catch {
    $providerExists = $false
}

if (-not $providerExists) {
    Write-Host "Creating OIDC provider..." -ForegroundColor Yellow
    aws iam create-open-id-connect-provider `
        --url "https://token.actions.githubusercontent.com" `
        --client-id-list "sts.amazonaws.com" `
        --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
} else {
    Write-Host "OIDC provider already exists." -ForegroundColor Green
}

$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "$ProviderArn"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$GitHubOrg/$GitHubRepo:ref:refs/heads/$Branch"
        }
      }
    }
  ]
}
"@

$trustPolicyPath = Join-Path $PWD "github-trust-policy.json"
Set-Content -Path $trustPolicyPath -Value $trustPolicy -Encoding UTF8

Write-Host "Checking for IAM role..." -ForegroundColor Cyan
$roleExists = $false
try {
    aws iam get-role --role-name $RoleName | Out-Null
    $roleExists = $true
} catch {
    $roleExists = $false
}

if (-not $roleExists) {
    Write-Host "Creating IAM role..." -ForegroundColor Yellow
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document file://$trustPolicyPath
    Write-Host "Role created." -ForegroundColor Green
} else {
    Write-Host "Role exists. Updating trust policy..." -ForegroundColor Yellow
    aws iam update-assume-role-policy `
        --role-name $RoleName `
        --policy-document file://$trustPolicyPath
}

Write-Host "Attaching AdministratorAccess for initial testing..." -ForegroundColor Yellow
aws iam attach-role-policy `
    --role-name $RoleName `
    --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess"

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Use this role ARN in GitHub Actions:" -ForegroundColor Cyan
Write-Host "arn:aws:iam::$AwsAccountId:role/$RoleName" -ForegroundColor Magenta