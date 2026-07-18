variable "environment" {
  description = "The environment (e.g. dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "The VPC ID where security groups will be created"
  type        = string
}
