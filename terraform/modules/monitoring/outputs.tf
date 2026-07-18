output "log_group_arns" {
  description = "A map of log group names to their ARNs"
  value       = { for k, v in aws_cloudwatch_log_group.ecs_services : k => v.arn }
}

output "log_group_names" {
  description = "A map of log group names"
  value       = { for k, v in aws_cloudwatch_log_group.ecs_services : k => v.name }
}
