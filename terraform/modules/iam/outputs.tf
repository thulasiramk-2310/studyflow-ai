output "ecs_execution_role_arn" {
  description = "The ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "The ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "ec2_ai_profile_name" {
  description = "The name of the IAM instance profile for the EC2 AI instance"
  value       = aws_iam_instance_profile.ec2_ai_profile.name
}

output "ec2_ai_role_arn" {
  description = "The ARN of the EC2 AI role"
  value       = aws_iam_role.ec2_ai_role.arn
}
