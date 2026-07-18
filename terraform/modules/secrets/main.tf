resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "studyflow-db-credentials-${var.environment}"
  description             = "Database credentials for StudyFlow RDS instance"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "db_credentials_version" {
  secret_id     = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "postgres"
    password = random_password.db_password.result
  })
}

resource "random_password" "jwt_secret" {
  length           = 64
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "studyflow-jwt-secret-${var.environment}"
  description             = "JWT Secret Key for Auth Service"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "jwt_secret_version" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

resource "random_password" "internal_api_key" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "internal_api_key" {
  name                    = "studyflow-internal-api-key-${var.environment}"
  description             = "Internal API Key for Service-to-Service auth"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
}

resource "aws_secretsmanager_secret_version" "internal_api_key_version" {
  secret_id     = aws_secretsmanager_secret.internal_api_key.id
  secret_string = random_password.internal_api_key.result
}
