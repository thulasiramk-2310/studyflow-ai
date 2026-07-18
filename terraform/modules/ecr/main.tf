resource "aws_ecr_repository" "this" {
  for_each             = toset(var.repositories)
  name                 = "studyflow-${each.key}-${var.environment}"
  image_tag_mutability = var.environment == "prod" ? "IMMUTABLE" : "MUTABLE"
  force_delete         = var.environment == "prod" ? false : true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Optional: Add lifecycle policy to keep only the last 30 images to save costs
resource "aws_ecr_lifecycle_policy" "this" {
  for_each   = toset(var.repositories)
  repository = aws_ecr_repository.this[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
