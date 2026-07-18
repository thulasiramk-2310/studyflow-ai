# 1. ALB Security Group (Internet -> ALB)
resource "aws_security_group" "alb" {
  name        = "studyflow-alb-sg-${var.environment}"
  description = "Allow inbound HTTP/HTTPS from the internet"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "studyflow-alb-sg-${var.environment}"
    Environment = var.environment
  }
}

# 2. Gateway Security Group (ALB -> Gateway)
resource "aws_security_group" "gateway" {
  name        = "studyflow-gateway-sg-${var.environment}"
  description = "Allow traffic from ALB to API Gateway"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "studyflow-gateway-sg-${var.environment}"
    Environment = var.environment
  }
}

# 3. Service Security Group (Gateway -> Internal Services)
resource "aws_security_group" "service" {
  name        = "studyflow-service-sg-${var.environment}"
  description = "Allow traffic from Gateway to backend services"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Auth Service from Gateway"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id]
  }

  ingress {
    description     = "Study Service from Gateway"
    from_port       = 8001
    to_port         = 8001
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id]
  }

  ingress {
    description     = "AI Service from Gateway"
    from_port       = 8002
    to_port         = 8002
    protocol        = "tcp"
    security_groups = [aws_security_group.gateway.id]
  }

  ingress {
    description = "Internal service to service communication"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "studyflow-service-sg-${var.environment}"
    Environment = var.environment
  }
}

# 4. Database Security Group (Services -> RDS)
resource "aws_security_group" "database" {
  name        = "studyflow-db-sg-${var.environment}"
  description = "Allow traffic from backend services to PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from Services"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.service.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "studyflow-db-sg-${var.environment}"
    Environment = var.environment
  }
}

# 5. AI GPU Instance Security Group (AI Service -> GPU EC2)
resource "aws_security_group" "ai_gpu" {
  name        = "studyflow-ai-gpu-sg-${var.environment}"
  description = "Allow traffic from AI Service to Ollama EC2 instance"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Ollama API from AI Service"
    from_port       = 11434
    to_port         = 11434
    protocol        = "tcp"
    security_groups = [aws_security_group.service.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "studyflow-ai-gpu-sg-${var.environment}"
    Environment = var.environment
  }
}
