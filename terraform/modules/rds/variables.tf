variable "environment" {
  description = "The environment (dev, prod)"
  type        = string
}

variable "subnet_ids" {
  description = "List of private subnet IDs for the database"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs for the database"
  type        = list(string)
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
