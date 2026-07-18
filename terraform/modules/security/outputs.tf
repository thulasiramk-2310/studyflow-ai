output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "gateway_sg_id" {
  value = aws_security_group.gateway.id
}

output "service_sg_id" {
  value = aws_security_group.service.id
}

output "database_sg_id" {
  value = aws_security_group.database.id
}

output "ai_gpu_sg_id" {
  value = aws_security_group.ai_gpu.id
}


