param(
  [string]$Region = "eu-west-1",
  [string]$Profile = "codebreaker",
  [string]$Cluster = "sanlamconnect-lxp-express",
  [string]$ServiceName = "sanlamconnect-lxp-frontend",
  [string]$TaskDefArn = "arn:aws:ecs:eu-west-1:684756697968:task-definition/sanlamconnect-lxp-frontend:1",
  [int]$ContainerPort = 3000
)

Write-Host "=== Creating ECS Service + ALB for $ServiceName ===" -ForegroundColor Cyan

# --- Default VPC + 2 subnets ---
$vpcId = aws ec2 describe-vpcs --region $Region --profile $Profile `
  --filters Name=isDefault,Values=true `
  --query "Vpcs[0].VpcId" --output text

if (-not $vpcId -or $vpcId -eq "None") { throw "No default VPC found in $Region." }
Write-Host "VPC: $vpcId" -ForegroundColor Green

$subnets = aws ec2 describe-subnets --region $Region --profile $Profile `
  --filters Name=vpc-id,Values=$vpcId `
  --query "Subnets[].SubnetId" --output text

$subnetList = $subnets -split "\s+"
if ($subnetList.Count -lt 2) { throw "Need at least 2 subnets in default VPC." }

$subnetA = $subnetList[0]
$subnetB = $subnetList[1]
Write-Host "Subnets: $subnetA, $subnetB" -ForegroundColor Green

# --- Security groups ---
$albSg = aws ec2 create-security-group --region $Region --profile $Profile `
  --vpc-id $vpcId --group-name "sg-$ServiceName-alb" `
  --description "ALB SG for $ServiceName" `
  --query "GroupId" --output text

aws ec2 authorize-security-group-ingress --region $Region --profile $Profile `
  --group-id $albSg --ip-permissions "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]" | Out-Null
Write-Host "ALB SG: $albSg" -ForegroundColor Green

$ecsSg = aws ec2 create-security-group --region $Region --profile $Profile `
  --vpc-id $vpcId --group-name "sg-$ServiceName-ecs" `
  --description "ECS SG for $ServiceName" `
  --query "GroupId" --output text

aws ec2 authorize-security-group-ingress --region $Region --profile $Profile `
  --group-id $ecsSg `
  --ip-permissions "IpProtocol=tcp,FromPort=$ContainerPort,ToPort=$ContainerPort,UserIdGroupPairs=[{GroupId=$albSg}]" | Out-Null
Write-Host "ECS SG: $ecsSg" -ForegroundColor Green

# --- ALB ---
$albArn = aws elbv2 create-load-balancer --region $Region --profile $Profile `
  --name "$ServiceName-alb" --type application --scheme internet-facing `
  --subnets $subnetA $subnetB `
  --security-groups $albSg `
  --query "LoadBalancers[0].LoadBalancerArn" --output text

$albDns = aws elbv2 describe-load-balancers --region $Region --profile $Profile `
  --load-balancer-arns $albArn `
  --query "LoadBalancers[0].DNSName" --output text

Write-Host "ALB: $albArn" -ForegroundColor Green

# --- Target Group ---
$tgArn = aws elbv2 create-target-group --region $Region --profile $Profile `
  --name "$ServiceName-tg" --protocol HTTP --port $ContainerPort --target-type ip `
  --vpc-id $vpcId --health-check-path "/" --matcher HttpCode=200-399 `
  --query "TargetGroups[0].TargetGroupArn" --output text

Write-Host "TargetGroup: $tgArn" -ForegroundColor Green

# --- Listener (80 -> TG) ---
$listenerArn = aws elbv2 create-listener --region $Region --profile $Profile `
  --load-balancer-arn $albArn --protocol HTTP --port 80 `
  --default-actions Type=forward,TargetGroupArn=$tgArn `
  --query "Listeners[0].ListenerArn" --output text

Write-Host "Listener: $listenerArn" -ForegroundColor Green

# --- ECS Cluster (create if missing) ---
$existing = aws ecs describe-clusters --region $Region --profile $Profile `
  --clusters $Cluster --query "clusters[0].clusterArn" --output text 2>$null

if (-not $existing -or $existing -eq "None") {
  aws ecs create-cluster --region $Region --profile $Profile --cluster-name $Cluster | Out-Null
  Write-Host "Created cluster: $Cluster" -ForegroundColor Green
} else {
  Write-Host "Cluster exists: $Cluster" -ForegroundColor Green
}

# --- ECS Service ---
$netCfg = "awsvpcConfiguration={subnets=[$subnetA,$subnetB],securityGroups=[$ecsSg],assignPublicIp=ENABLED}"

aws ecs create-service --region $Region --profile $Profile `
  --cluster $Cluster `
  --service-name $ServiceName `
  --task-definition $TaskDefArn `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration $netCfg `
  --load-balancers "targetGroupArn=$tgArn,containerName=lxp-frontend,containerPort=$ContainerPort" | Out-Null

Write-Host "`n✅ DEPLOYED. Hit the frontend here:" -ForegroundColor Cyan
Write-Host "http://$albDns" -ForegroundColor White