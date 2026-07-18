variable "project_name" {
  description = "Project name"
  type        = string
  default     = "studyflow"
}

variable "environment" {
  description = "The environment (dev, prod)"
  type        = string
}

variable "log_group_names" {
  description = "List of log group names to create for ECS services"
  type        = list(string)
  default     = ["api-gateway", "auth-service", "study-service", "ai-service"]
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster for alarms"
  type        = string
  default     = ""
}

variable "rds_identifier" {
  description = "Identifier of the RDS instance for alarms"
  type        = string
  default     = ""
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB for 5XX error alarms"
  type        = string
  default     = ""
}

variable "ec2_instance_id" {
  description = "The ID of the EC2 AI instance"
  type        = string
}

variable "enable_ec2_monitoring" {
  description = "Enable EC2 alarms"
  type        = bool
  default     = false
}

variable "enable_alb_monitoring" {
  description = "Enable ALB alarms"
  type        = bool
  default     = false
}
