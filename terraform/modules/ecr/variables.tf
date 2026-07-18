variable "environment" {
  description = "The environment (e.g., dev, prod)"
  type        = string
}

variable "repositories" {
  description = "List of ECR repository names to create"
  type        = list(string)
  default     = ["api-gateway", "auth-service", "study-service", "ai-service"]
}
