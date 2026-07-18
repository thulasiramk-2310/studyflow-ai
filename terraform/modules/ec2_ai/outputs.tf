output "instance_id" {
  description = "The ID of the EC2 AI instance"
  value       = aws_instance.ai_gpu.id
}

output "private_ip" {
  description = "The private IP address of the EC2 AI instance"
  value       = aws_instance.ai_gpu.private_ip
}
