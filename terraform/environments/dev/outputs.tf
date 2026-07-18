output "vpc_id" {
  value = module.networking.vpc_id
}

output "internet_gateway_id" {
  value = module.networking.internet_gateway_id
}

output "nat_gateway_ids" {
  value = module.networking.nat_gateway_ids
}

output "public_subnet_ids" {
  value = module.networking.public_subnet_ids
}

output "private_app_subnet_ids" {
  value = module.networking.private_app_subnet_ids
}

output "private_db_subnet_ids" {
  value = module.networking.private_db_subnet_ids
}

output "private_ai_subnet_ids" {
  value = module.networking.private_ai_subnet_ids
}

output "public_route_table_id" {
  value = module.networking.public_route_table_id
}

output "private_app_route_table_ids" {
  value = module.networking.private_app_route_table_ids
}

output "private_db_route_table_ids" {
  value = module.networking.private_db_route_table_ids
}

output "private_ai_route_table_ids" {
  value = module.networking.private_ai_route_table_ids
}

output "vpc_endpoint_s3_id" {
  value = module.networking.vpc_endpoint_s3_id
}

output "vpc_endpoint_ecr_api_id" {
  value = module.networking.vpc_endpoint_ecr_api_id
}

output "vpc_endpoint_ecr_dkr_id" {
  value = module.networking.vpc_endpoint_ecr_dkr_id
}

output "vpc_endpoint_logs_id" {
  value = module.networking.vpc_endpoint_logs_id
}

output "vpc_endpoint_secretsmanager_id" {
  value = module.networking.vpc_endpoint_secretsmanager_id
}

output "vpc_endpoint_kms_id" {
  value = module.networking.vpc_endpoint_kms_id
}

output "vpc_endpoint_ecs_id" {
  value = module.networking.vpc_endpoint_ecs_id
}

output "vpc_endpoint_ecs_agent_id" {
  value = module.networking.vpc_endpoint_ecs_agent_id
}

output "vpc_endpoint_ecs_telemetry_id" {
  value = module.networking.vpc_endpoint_ecs_telemetry_id
}

output "security_group_alb_id" {
  value = module.security.alb_sg_id
}

output "security_group_gateway_id" {
  value = module.security.gateway_sg_id
}

output "security_group_service_id" {
  value = module.security.service_sg_id
}

output "security_group_database_id" {
  value = module.security.database_sg_id
}

output "security_group_ai_gpu_id" {
  value = module.security.ai_gpu_sg_id
}

output "ecs_execution_role_arn" {
  value = module.iam.ecs_execution_role_arn
}

output "ecs_task_role_arn" {
  value = module.iam.ecs_task_role_arn
}

output "ec2_ai_profile_name" {
  value = module.iam.ec2_ai_profile_name
}

output "ec2_ai_role_arn" {
  value = module.iam.ec2_ai_role_arn
}

output "db_credentials_secret_arn" {
  value = module.secrets.db_credentials_secret_arn
}

output "db_credentials_secret_id" {
  value = module.secrets.db_credentials_secret_id
}

output "db_password" {
  value     = module.secrets.db_password
  sensitive = true
}

output "db_username" {
  value = module.secrets.db_username
}

output "s3_bucket_id" {
  value = module.s3.bucket_id
}

output "s3_bucket_arn" {
  value = module.s3.bucket_arn
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "log_group_names" {
  value = module.monitoring.log_group_names
}

output "db_instance_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "db_name" {
  value = module.rds.db_name
}

output "ec2_ai_instance_id" {
  value = module.ec2_ai.instance_id
}

output "ec2_ai_private_ip" {
  value = module.ec2_ai.private_ip
}
