data "aws_ami" "deep_learning" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04) *"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

locals {
  ami_id = var.ami_id != "" ? var.ami_id : data.aws_ami.deep_learning.id
}

resource "aws_instance" "ai_gpu" {
  ami           = local.ami_id
  instance_type = var.instance_type
  subnet_id     = var.subnet_id

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile = var.iam_instance_profile_name

  key_name = var.key_name != "" ? var.key_name : null

  root_block_device {
    volume_size           = var.volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2
    http_put_response_hop_limit = 1
  }

  user_data = <<-EOF
    #!/bin/bash
    echo "Starting Ollama setup..."
    # Optionally we can start Ollama here or use SSM to deploy containers
    # The AMI is expected to have GPU drivers installed
    # Example: curl -fsSL https://ollama.com/install.sh | sh
  EOF

  tags = {
    Name = "${var.project_name}-ai-gpu-${var.environment}"
  }
}
