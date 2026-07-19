resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster-${var.environment}"
  }
}

resource "aws_service_discovery_private_dns_namespace" "internal" {
  name        = "studyflow.internal"
  description = "StudyFlow internal service discovery namespace"
  vpc         = var.vpc_id
}

# --- Cloud Map Services ---

resource "aws_service_discovery_service" "auth" {
  name = "auth"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.internal.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "study" {
  name = "study"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.internal.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "ai" {
  name = "ai"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.internal.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# --- Task Definitions ---

# 1. API Gateway
resource "aws_ecs_task_definition" "api_gateway" {
  family                   = "${var.project_name}-api-gw-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([{
    name      = "api-gateway"
    image     = "${var.repository_urls["api-gateway"]}:latest"
    essential = true
    portMappings = [{
      containerPort = 8000
      hostPort      = 8000
      protocol      = "tcp"
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-api-gw-${var.environment}"
        "awslogs-region"        = "ap-south-1"
        "awslogs-stream-prefix" = "ecs"
        "awslogs-create-group"  = "true"
      }
    }
  }])
}

# 2. Auth Service
resource "aws_ecs_task_definition" "auth" {
  family                   = "${var.project_name}-auth-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 1024
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([{
    name      = "auth-service"
    image     = "${var.repository_urls["auth-service"]}:latest"
    essential = true
    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "DB_HOST", value = var.db_host },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = "studyflow" },
      { name = "DB_USER", value = "postgres" },
      { name = "CORS_ALLOWED_ORIGINS", value = "https://${var.frontend_domain},http://localhost:5173" }
    ]
    secrets = [
      {
        name      = "DB_PASSWORD"
        valueFrom = "${var.db_credentials_secret_arn}:password::"
      },
      {
        name      = "JWT_SECRET"
        valueFrom = var.jwt_secret_arn
      },
      {
        name      = "INTERNAL_API_KEY"
        valueFrom = var.internal_api_key_secret_arn
      }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-auth-${var.environment}"
        "awslogs-region"        = "ap-south-1"
        "awslogs-stream-prefix" = "ecs"
        "awslogs-create-group"  = "true"
      }
    }
  }])
}
