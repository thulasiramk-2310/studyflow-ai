data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "data_bucket" {
  bucket        = "studyflow-data-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.environment == "prod" ? false : true
}

resource "aws_s3_bucket_versioning" "data_bucket_versioning" {
  bucket = aws_s3_bucket.data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "data_bucket_cors" {
  bucket = aws_s3_bucket.data_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_sse" {
  bucket = aws_s3_bucket.data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_public_access_block" {
  bucket = aws_s3_bucket.data_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Optional: Add basic lifecycle rule for user uploads (transition to Standard-IA after 30 days)
resource "aws_s3_bucket_lifecycle_configuration" "data_bucket_lifecycle" {
  bucket = aws_s3_bucket.data_bucket.id

  rule {
    id     = "archive-uploads"
    status = "Enabled"

    filter {
      prefix = "uploads/"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Prefixes are usually created implicitly when uploading objects, 
# but if you need empty folders, you can define them:
resource "aws_s3_object" "uploads_prefix" {
  bucket       = aws_s3_bucket.data_bucket.id
  key          = "uploads/"
  content_type = "application/x-directory"
}

resource "aws_s3_object" "indexes_prefix" {
  bucket       = aws_s3_bucket.data_bucket.id
  key          = "indexes/"
  content_type = "application/x-directory"
}
