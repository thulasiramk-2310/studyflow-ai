variable "environment" {
  description = "The environment (e.g., dev, prod)"
  type        = string
}

variable "s3_bucket_name" {
  description = "The name of the S3 bucket the ECS tasks need access to"
  type        = string
  default     = ""
}
