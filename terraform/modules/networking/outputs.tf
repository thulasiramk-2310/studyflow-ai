output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "List of private app subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "List of private db subnet IDs"
  value       = aws_subnet.private_db[*].id
}

output "private_ai_subnet_ids" {
  description = "List of private AI subnet IDs"
  value       = aws_subnet.private_ai[*].id
}

output "vpc_endpoints_sg_id" {
  description = "The ID of the VPC endpoints security group"
  value       = length(aws_security_group.vpc_endpoints) > 0 ? aws_security_group.vpc_endpoints[0].id : null
}

output "public_route_table_id" {
  value = aws_route_table.public.id
}

output "private_app_route_table_ids" {
  value = aws_route_table.private_app[*].id
}

output "private_db_route_table_ids" {
  value = aws_route_table.private_db[*].id
}

output "private_ai_route_table_ids" {
  value = aws_route_table.private_ai[*].id
}

output "vpc_endpoint_s3_id" {
  value = length(aws_vpc_endpoint.s3) > 0 ? aws_vpc_endpoint.s3[0].id : null
}

output "vpc_endpoint_ecr_api_id" {
  value = length(aws_vpc_endpoint.ecr_api) > 0 ? aws_vpc_endpoint.ecr_api[0].id : null
}

output "vpc_endpoint_ecr_dkr_id" {
  value = length(aws_vpc_endpoint.ecr_dkr) > 0 ? aws_vpc_endpoint.ecr_dkr[0].id : null
}

output "vpc_endpoint_logs_id" {
  value = length(aws_vpc_endpoint.logs) > 0 ? aws_vpc_endpoint.logs[0].id : null
}

output "vpc_endpoint_secretsmanager_id" {
  value = length(aws_vpc_endpoint.secretsmanager) > 0 ? aws_vpc_endpoint.secretsmanager[0].id : null
}

output "vpc_endpoint_kms_id" {
  value = length(aws_vpc_endpoint.kms) > 0 ? aws_vpc_endpoint.kms[0].id : null
}

output "vpc_endpoint_ecs_id" {
  value = length(aws_vpc_endpoint.ecs) > 0 ? aws_vpc_endpoint.ecs[0].id : null
}

output "vpc_endpoint_ecs_agent_id" {
  value = length(aws_vpc_endpoint.ecs_agent) > 0 ? aws_vpc_endpoint.ecs_agent[0].id : null
}

output "vpc_endpoint_ecs_telemetry_id" {
  value = length(aws_vpc_endpoint.ecs_telemetry) > 0 ? aws_vpc_endpoint.ecs_telemetry[0].id : null
}
