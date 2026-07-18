output "db_instance_endpoint" {
  description = "The connection endpoint for the database (with port)"
  value       = aws_db_instance.this.endpoint
}

output "db_instance_address" {
  description = "The connection address for the database"
  value       = aws_db_instance.this.address
}

output "db_instance_id" {
  description = "The identifier of the RDS instance"
  value       = aws_db_instance.this.identifier
}

output "db_name" {
  description = "The database name"
  value       = aws_db_instance.this.db_name
}
