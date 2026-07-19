variable "project_name" {
  type    = string
  default = "studyflow"
}

variable "environment" {
  type = string
}

variable "alb_dns_name" {
  type        = string
  description = "ALB DNS name; CloudFront routes /api and /auth to it"
}

# Optional custom-domain support (add later). When empty, CloudFront uses its
# default *.cloudfront.net certificate and serves no custom aliases.
variable "aliases" {
  type        = list(string)
  description = "Custom domains for the distribution (e.g. [example.com, www.example.com])"
  default     = []
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM cert ARN (us-east-1) for the custom domains; empty = default cert"
  default     = ""
}
