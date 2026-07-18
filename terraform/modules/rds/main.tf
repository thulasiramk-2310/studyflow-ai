resource "aws_db_subnet_group" "this" {
  name       = "studyflow-db-subnet-group-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Environment = var.environment
  }
}

resource "aws_db_instance" "this" {
  identifier = "studyflow-db-${var.environment}"

  engine               = "postgres"
  engine_version       = "16"
  instance_class       = var.environment == "prod" ? "db.t3.small" : "db.t3.micro"
  allocated_storage    = 20
  max_allocated_storage = var.environment == "prod" ? 100 : 0

  db_name  = "studyflow"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = var.security_group_ids

  multi_az               = var.environment == "prod" ? true : false
  publicly_accessible    = false
  skip_final_snapshot    = var.environment == "prod" ? false : true

  backup_retention_period = var.environment == "prod" ? 7 : 1
  storage_encrypted       = true

  tags = {
    Environment = var.environment
  }
}
