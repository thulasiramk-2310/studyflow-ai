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

variable "public_subnets" {
  type = list(string)
}

variable "alb_sg_id" {
  type = string
}

variable "acm_certificate_arn" {
  type        = string
  description = "ARN of the ACM certificate for HTTPS listener"
  default     = ""
}
