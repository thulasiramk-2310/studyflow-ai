variable "project_name" {
  type    = string
  default = "studyflow"
}

variable "environment" {
  type = string
}

variable "domain_name" {
  type        = string
  description = "Root domain registered at the registrar (e.g. example.com)"
}
