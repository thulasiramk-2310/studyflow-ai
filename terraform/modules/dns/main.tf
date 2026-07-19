# Route 53 hosted zone for the domain. After apply, repoint the domain's
# nameservers at the registrar (away from Vercel) to this zone's name_servers.
resource "aws_route53_zone" "primary" {
  name = var.domain_name

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# ── Certificate for CloudFront (frontend): apex + www, must be in us-east-1 ──
resource "aws_acm_certificate" "cloudfront" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# ── Certificate for the ALB (backend api): ap-south-1 (stack region) ──
resource "aws_acm_certificate" "api" {
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation records for both certs, written into the hosted zone.
# Deduplicated by record name (apex + www often share one validation record).
locals {
  validation_records = {
    for dvo in concat(
      tolist(aws_acm_certificate.cloudfront.domain_validation_options),
      tolist(aws_acm_certificate.api.domain_validation_options),
    ) : dvo.resource_record_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }...
  }
}

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for name, recs in local.validation_records : name => recs[0]
  }

  zone_id         = aws_route53_zone.primary.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# Wait for each certificate to be issued. These complete only once the
# domain's nameservers point at this Route 53 zone and DNS has propagated.
resource "aws_acm_certificate_validation" "cloudfront" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]
}
