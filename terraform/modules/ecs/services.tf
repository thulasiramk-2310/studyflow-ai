# 3. Study Service
resource "aws_ecs_task_definition" "study" {
  family                   = "${var.project_name}-study-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([{
    name      = "study-service"
    image     = "${var.repository_urls["study-service"]}:latest"
    essential = true
    portMappings = [{
      containerPort = 8000
      hostPort      = 8000
      protocol      = "tcp"
    }]
    environment = [
      { name = "DB_HOST", value = var.db_host },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = "studyflow" },
      { name = "DB_USER", value = "postgres" },
      { name = "AI_SERVICE_URL", value = var.ai_service_url },
      { name = "AUTH_SERVICE_URL", value = var.auth_service_url },
      { name = "STORAGE_BACKEND", value = "s3" },
      { name = "AWS_S3_BUCKET", value = var.s3_bucket_name },
      { name = "AWS_DEFAULT_REGION", value = "ap-south-1" },
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
        "awslogs-group"         = "/ecs/${var.project_name}-study-${var.environment}"
        "awslogs-region"        = "ap-south-1"
        "awslogs-stream-prefix" = "ecs"
        "awslogs-create-group"  = "true"
      }
    }
  }])
}

# 4. AI Service
resource "aws_ecs_task_definition" "ai" {
  family                   = "${var.project_name}-ai-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 2048
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([{
    name      = "ai-service"
    image     = "${var.repository_urls["ai-service"]}:latest"
    essential = true
    portMappings = [{
      containerPort = 8002
      hostPort      = 8002
      protocol      = "tcp"
    }]
    environment = [
      { name = "GROQ_MODEL", value = "llama-3.1-8b-instant" },
      { name = "DB_HOST", value = var.db_host },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = "studyflow" },
      { name = "DB_USER", value = "postgres" },
      { name = "STORAGE_BACKEND", value = "s3" },
      { name = "AWS_S3_BUCKET", value = var.s3_bucket_name },
      { name = "AWS_DEFAULT_REGION", value = "ap-south-1" },
      { name = "AWS_REGION", value = "ap-south-1" },
      { name = "STUDY_SERVICE_URL", value = var.study_service_url }
    ]
    secrets = [
      {
        name      = "GROQ_API_KEY"
        valueFrom = var.groq_api_key_secret_arn
      },
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
        "awslogs-group"         = "/ecs/${var.project_name}-ai-${var.environment}"
        "awslogs-region"        = "ap-south-1"
        "awslogs-stream-prefix" = "ecs"
        "awslogs-create-group"  = "true"
      }
    }
  }])
}

# --- ECS Services ---

resource "aws_ecs_service" "api_gateway" {
  name            = "${var.project_name}-api-gw-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_app_subnets
    security_groups  = [var.api_gateway_sg_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.api_gateway_target_group_arn
    container_name   = "api-gateway"
    container_port   = 8000
  }
}

resource "aws_ecs_service" "auth" {
  name            = "${var.project_name}-auth-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.auth.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_app_subnets
    security_groups  = [var.app_sg_id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.auth.arn
  }
}

resource "aws_ecs_service" "study" {
  name            = "${var.project_name}-study-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.study.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_app_subnets
    security_groups  = [var.app_sg_id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.study.arn
  }
}

resource "aws_ecs_service" "ai" {
  name            = "${var.project_name}-ai-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.ai.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_app_subnets
    security_groups  = [var.app_sg_id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.ai.arn
  }
}
