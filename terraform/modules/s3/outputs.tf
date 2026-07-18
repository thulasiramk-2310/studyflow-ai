output "bucket_id" {
  description = "The name of the bucket"
  value       = aws_s3_bucket.data_bucket.id
}

output "bucket_arn" {
  description = "The ARN of the bucket"
  value       = aws_s3_bucket.data_bucket.arn
}

output "bucket_regional_domain_name" {
  description = "The bucket region-specific domain name"
  value       = aws_s3_bucket.data_bucket.bucket_regional_domain_name
}
