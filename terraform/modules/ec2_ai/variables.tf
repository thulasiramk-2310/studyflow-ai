variable "project_name" {
  description = "The name of the project"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., dev, prod)"
  type        = string
}

variable "subnet_id" {
  description = "The subnet ID where the EC2 instance will be deployed"
  type        = string
}

variable "security_group_id" {
  description = "The security group ID for the EC2 instance"
  type        = string
}

variable "iam_instance_profile_name" {
  description = "The IAM instance profile name for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "The EC2 instance type (e.g., g4dn.xlarge for GPU)"
  type        = string
  default     = "g4dn.xlarge"
}

variable "ami_id" {
  description = "The AMI ID to use. If not provided, the latest Deep Learning AMI (Ubuntu) will be used."
  type        = string
  default     = ""
}

variable "volume_size" {
  description = "The size of the root volume in GB"
  type        = number
  default     = 100
}

variable "key_name" {
  description = "The key pair name for SSH access (optional)"
  type        = string
  default     = ""
}
