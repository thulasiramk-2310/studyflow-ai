variable "environment" {
  description = "The environment (e.g. dev, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "List of public subnet CIDRs"
  type        = list(string)
}

variable "private_app_subnets" {
  description = "List of private app subnet CIDRs"
  type        = list(string)
}

variable "private_db_subnets" {
  description = "List of private database subnet CIDRs"
  type        = list(string)
}

variable "private_ai_subnets" {
  description = "List of private AI subnet CIDRs"
  type        = list(string)
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "single_nat_gateway" {
  description = "Should be true if you want to provision a single shared NAT Gateway across all of your private networks"
  type        = bool
  default     = false
}

variable "enable_interface_endpoints" {
  description = "Should be true to provision interface VPC endpoints for AWS services"
  type        = bool
  default     = false
}

variable "enable_s3_gateway_endpoint" {
  description = "Should be true to provision a Gateway VPC endpoint for S3"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Should be true to enable VPC Flow Logs"
  type        = bool
  default     = false
}

variable "flow_log_retention_days" {
  description = "Number of days to retain VPC flow logs in CloudWatch"
  type        = number
  default     = 30
}
