variable "aws_region" {
  default = "ap-south-1"
}

variable "environment" {
  default = "dev"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnets" {
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_app_subnets" {
  default = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "private_db_subnets" {
  default = ["10.0.5.0/24", "10.0.6.0/24"]
}

variable "private_ai_subnets" {
  default = ["10.0.7.0/24", "10.0.8.0/24"]
}

variable "availability_zones" {
  default = ["ap-south-1a", "ap-south-1b"]
}

variable "single_nat_gateway" {
  default = true
}
