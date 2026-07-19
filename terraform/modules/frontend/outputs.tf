output "bucket_id" {
  description = "S3 bucket holding the built frontend"
  value       = aws_s3_bucket.site.id
}

output "distribution_id" {
  description = "CloudFront distribution ID (for cache invalidations)"
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain (e.g. dxxxx.cloudfront.net)"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Fixed CloudFront hosted zone ID for Route 53 alias records"
  value       = aws_cloudfront_distribution.site.hosted_zone_id
}
