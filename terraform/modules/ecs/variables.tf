variable "project_name" {
  type    = string
  default = "studyflow"
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_app_subnets" {
  type = list(string)
}

variable "app_sg_id" {
  type = string
}

variable "ecs_task_execution_role_arn" {
  type = string
}

variable "ecs_task_role_arn" {
  type = string
}

variable "api_gateway_target_group_arn" {
  type = string
}

variable "repository_urls" {
  type = map(string)
}

variable "db_host" {
  type = string
}

variable "s3_bucket_name" {
  type = string
}

variable "ai_service_url" {
  type    = string
  default = "http://ai.studyflow.internal:8002"
}

variable "auth_service_url" {
  type    = string
  default = "http://auth.studyflow.internal:8080"
}

variable "study_service_url" {
  type    = string
  default = "http://study.studyflow.internal:8000"
}

variable "db_credentials_secret_arn" {
  type = string
}

variable "groq_api_key_secret_arn" {
  description = "ARN for Groq API Key secret"
  type        = string
}

variable "api_gateway_sg_id" {
  description = "Security group ID for API gateway"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN for JWT secret"
  type        = string
}

variable "internal_api_key_secret_arn" {
  description = "ARN for Internal API Key secret"
  type        = string
}

variable "alb_dns_name" {
  description = "The DNS name of the ALB"
  type        = string
}

variable "frontend_domain" {
  description = "CloudFront domain serving the frontend (added to CORS allowed origins)"
  type        = string
  default     = ""
}
