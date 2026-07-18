resource "aws_ecs_task_definition" "study_migration" {
  family                   = "${var.project_name}-study-migration-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "study-migration"
      image     = "${var.repository_urls["study-service"]}:v5"
      essential = true
      command   = ["alembic", "upgrade", "head"]
      
      environment = [
        { name = "ENVIRONMENT", value = var.environment },
        { name = "DB_HOST", value = split(":", var.db_host)[0] },
        { name = "DB_PORT", value = "5432" },
        { name = "DB_NAME", value = "studyflow" }
      ]
      secrets = [
        {
          name      = "DB_USER"
          valueFrom = "${var.db_credentials_secret_arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.db_credentials_secret_arn}:password::"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.project_name}-study-service-${var.environment}"
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "migration"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "auth_migration" {
  family                   = "${var.project_name}-auth-migration-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.ecs_task_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name      = "auth-migration"
      image     = "${var.repository_urls["auth-service"]}:v2"
      essential = true
      command   = ["java", "-jar", "app.jar", "--spring.flyway.enabled=true", "--spring.main.web-application-type=none"]
      
      environment = [
        { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
        { name = "DB_HOST", value = split(":", var.db_host)[0] },
        { name = "DB_PORT", value = "5432" },
        { name = "DB_NAME", value = "studyflow" }
      ]
      secrets = [
        {
          name      = "DB_USER"
          valueFrom = "${var.db_credentials_secret_arn}:username::"
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
          "awslogs-group"         = "/ecs/${var.project_name}-auth-service-${var.environment}"
          "awslogs-region"        = "ap-south-1"
          "awslogs-stream-prefix" = "migration"
        }
      }
    }
  ])
}
