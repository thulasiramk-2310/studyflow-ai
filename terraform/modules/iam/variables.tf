variable "environment" {
  description = "The environment (e.g., dev, prod)"
  type        = string
}

variable "s3_bucket_name" {
  description = "The name of the S3 bucket the ECS tasks need access to"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository for OIDC in the format owner/repo"
  type        = string
  default     = "thulasiramk-2310/studyflow-ai"
}
