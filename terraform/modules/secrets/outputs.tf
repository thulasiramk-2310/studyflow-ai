output "db_credentials_secret_arn" {
  description = "The ARN of the Secrets Manager secret for DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_id" {
  description = "The ID of the Secrets Manager secret for DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.id
}

output "db_password" {
  description = "The generated database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "db_username" {
  description = "The database username"
  value       = "postgres"
}

output "jwt_secret_arn" {
  description = "The ARN of the Secrets Manager secret for JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

output "internal_api_key_secret_arn" {
  description = "The ARN of the Secrets Manager secret for internal API key"
  value       = aws_secretsmanager_secret.internal_api_key.arn
}
