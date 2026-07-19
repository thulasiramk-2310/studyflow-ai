data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# 1. ECS Task Execution Role (Allows pulling from ECR and sending logs to CloudWatch)
data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_execution_role" {
  name               = "studyflow-ecs-execution-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_secrets_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = aws_iam_policy.ecs_task_policy.arn
}

# 2. ECS Task Role (Allows application code to interact with AWS services like S3 and Secrets Manager)
resource "aws_iam_role" "ecs_task_role" {
  name               = "studyflow-ecs-task-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

# S3 and Secrets Manager Policy for ECS Task Role
data "aws_iam_policy_document" "ecs_task_policy" {
  # Secrets Manager Access
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [
      "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:studyflow-*-${var.environment}-*"
    ]
  }

  # S3 Access (if bucket name is provided, else generic)
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = var.s3_bucket_name != "" ? [
      "arn:aws:s3:::${var.s3_bucket_name}",
      "arn:aws:s3:::${var.s3_bucket_name}/*"
    ] : [
      "arn:aws:s3:::studyflow-*-${var.environment}",
      "arn:aws:s3:::studyflow-*-${var.environment}/*"
    ]
  }

  # Allow ECS Execution Role to create CloudWatch log groups and streams
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/studyflow-*",
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/studyflow-*:*"
    ]
  }
}

resource "aws_iam_policy" "ecs_task_policy" {
  name   = "studyflow-ecs-task-policy-${var.environment}"
  policy = data.aws_iam_policy_document.ecs_task_policy.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_policy_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_policy.arn
}

