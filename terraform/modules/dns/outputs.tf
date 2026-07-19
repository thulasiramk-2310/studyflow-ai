output "zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.primary.zone_id
}

output "name_servers" {
  description = "Repoint the domain's nameservers at the registrar to these"
  value       = aws_route53_zone.primary.name_servers
}

output "cloudfront_certificate_arn" {
  description = "Validated ACM cert (us-east-1) for the CloudFront frontend"
  value       = aws_acm_certificate_validation.cloudfront.certificate_arn
}

output "api_certificate_arn" {
  description = "Validated ACM cert (ap-south-1) for the ALB HTTPS listener"
  value       = aws_acm_certificate_validation.api.certificate_arn
}

output "api_fqdn" {
  description = "FQDN for the backend API (points at the ALB)"
  value       = "api.${var.domain_name}"
}
