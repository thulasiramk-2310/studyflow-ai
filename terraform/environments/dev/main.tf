provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "StudyFlowAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

module "networking" {
  source = "../../modules/networking"

  environment                = var.environment
  vpc_cidr                   = var.vpc_cidr
  public_subnets             = var.public_subnets
  private_app_subnets        = var.private_app_subnets
  private_db_subnets         = var.private_db_subnets
  private_ai_subnets         = var.private_ai_subnets
  availability_zones         = var.availability_zones
  single_nat_gateway         = var.single_nat_gateway
  enable_interface_endpoints = false
  enable_s3_gateway_endpoint = true
  enable_flow_logs           = true
  flow_log_retention_days    = 30
}

module "security" {
  source = "../../modules/security"

  environment = var.environment
  vpc_id      = module.networking.vpc_id
}

module "iam" {
  source = "../../modules/iam"

  environment = var.environment
}

module "secrets" {
  source = "../../modules/secrets"

  environment = var.environment
}

module "s3" {
  source = "../../modules/s3"

  environment = var.environment
}

module "ecr" {
  source = "../../modules/ecr"

  environment = var.environment
}

module "monitoring" {
  source = "../../modules/monitoring"

  environment           = var.environment
  ecs_cluster_name      = module.ecs.cluster_name
  rds_identifier        = module.rds.db_instance_id
  alb_arn_suffix        = module.alb.alb_arn_suffix
  ec2_instance_id       = module.ec2_ai.instance_id
  enable_ec2_monitoring = true
  enable_alb_monitoring = true
}

module "rds" {
  source = "../../modules/rds"

  environment        = var.environment
  subnet_ids         = module.networking.private_db_subnet_ids
  security_group_ids = [module.security.database_sg_id]
  db_username        = module.secrets.db_username
  db_password        = module.secrets.db_password
}

module "alb" {
  source = "../../modules/alb"

  environment    = var.environment
  vpc_id         = module.networking.vpc_id
  public_subnets = module.networking.public_subnet_ids
  alb_sg_id      = module.security.alb_sg_id
}

module "ecs" {
  source = "../../modules/ecs"

  environment                  = var.environment
  vpc_id                       = module.networking.vpc_id
  private_app_subnets          = module.networking.private_app_subnet_ids
  app_sg_id                    = module.security.service_sg_id
  api_gateway_sg_id            = module.security.gateway_sg_id
  ecs_task_execution_role_arn  = module.iam.ecs_execution_role_arn
  ecs_task_role_arn            = module.iam.ecs_task_role_arn
  api_gateway_target_group_arn = module.alb.api_gateway_target_group_arn
  alb_dns_name                 = module.alb.alb_dns_name
  repository_urls              = module.ecr.repository_urls
  db_host                      = module.rds.db_instance_address
  s3_bucket_name               = module.s3.bucket_id
  db_credentials_secret_arn    = module.secrets.db_credentials_secret_arn
  jwt_secret_arn               = module.secrets.jwt_secret_arn
  internal_api_key_secret_arn  = module.secrets.internal_api_key_secret_arn
  ollama_base_url              = "http://${module.ec2_ai.private_ip}:11434"
}

module "ec2_ai" {
  source = "../../modules/ec2_ai"

  project_name              = "studyflow"
  environment               = var.environment
  subnet_id                 = module.networking.private_ai_subnet_ids[0]
  security_group_id         = module.security.ai_gpu_sg_id
  iam_instance_profile_name = module.iam.ec2_ai_profile_name
  instance_type             = "t3.micro"
}
