resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "studyflow-vpc-${var.environment}"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "studyflow-igw-${var.environment}"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnets)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "studyflow-public-subnet-${var.environment}-${count.index + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}

# Private App Subnets
resource "aws_subnet" "private_app" {
  count             = length(var.private_app_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "studyflow-private-app-subnet-${var.environment}-${count.index + 1}"
    Environment = var.environment
    Type        = "Private-App"
  }
}

# Private Database Subnets
resource "aws_subnet" "private_db" {
  count             = length(var.private_db_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_db_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "studyflow-private-db-subnet-${var.environment}-${count.index + 1}"
    Environment = var.environment
    Type        = "Private-Database"
  }
}

# Private AI Subnets
resource "aws_subnet" "private_ai" {
  count             = length(var.private_ai_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_ai_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "studyflow-private-ai-subnet-${var.environment}-${count.index + 1}"
    Environment = var.environment
    Type        = "Private-AI"
  }
}

# Elastic IPs for NAT Gateway(s)
resource "aws_eip" "nat" {
  count  = var.single_nat_gateway ? 1 : length(var.public_subnets)
  domain = "vpc"

  tags = {
    Name        = "studyflow-eip-${var.environment}-${count.index + 1}"
    Environment = var.environment
  }
}

# NAT Gateway(s)
resource "aws_nat_gateway" "main" {
  count         = var.single_nat_gateway ? 1 : length(var.public_subnets)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "studyflow-nat-${var.environment}-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "studyflow-public-rt-${var.environment}"
    Environment = var.environment
  }
}

# Route Tables - Private App
resource "aws_route_table" "private_app" {
  count  = var.single_nat_gateway ? 1 : length(var.public_subnets)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "studyflow-private-app-rt-${var.environment}-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Tables - Private DB
resource "aws_route_table" "private_db" {
  count  = var.single_nat_gateway ? 1 : length(var.public_subnets)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "studyflow-private-db-rt-${var.environment}-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Tables - Private AI
resource "aws_route_table" "private_ai" {
  count  = var.single_nat_gateway ? 1 : length(var.public_subnets)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "studyflow-private-ai-rt-${var.environment}-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnets)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private App
resource "aws_route_table_association" "private_app" {
  count          = length(var.private_app_subnets)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private_app[0].id : aws_route_table.private_app[count.index].id
}

# Route Table Associations - Private DB
resource "aws_route_table_association" "private_db" {
  count          = length(var.private_db_subnets)
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private_db[0].id : aws_route_table.private_db[count.index].id
}

# Route Table Associations - Private AI
resource "aws_route_table_association" "private_ai" {
  count          = length(var.private_ai_subnets)
  subnet_id      = aws_subnet.private_ai[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private_ai[0].id : aws_route_table.private_ai[count.index].id
}

data "aws_region" "current" {}

# VPC Endpoints
# 1. S3 Gateway Endpoint
resource "aws_vpc_endpoint" "s3" {
  count        = var.enable_s3_gateway_endpoint ? 1 : 0
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(
    aws_route_table.private_app[*].id,
    aws_route_table.private_db[*].id,
    aws_route_table.private_ai[*].id
  )

  tags = {
    Name        = "studyflow-s3-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# Interface Endpoints Security Group
resource "aws_security_group" "vpc_endpoints" {
  count       = var.enable_interface_endpoints ? 1 : 0
  name        = "studyflow-vpc-endpoints-sg-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name        = "studyflow-vpc-endpoints-sg-${var.environment}"
    Environment = var.environment
  }
}

# 2. ECR API Interface Endpoint
resource "aws_vpc_endpoint" "ecr_api" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-ecr-api-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# 3. ECR DKR Interface Endpoint
resource "aws_vpc_endpoint" "ecr_dkr" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-ecr-dkr-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# 4. CloudWatch Logs Interface Endpoint
resource "aws_vpc_endpoint" "logs" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-logs-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# 5. Secrets Manager Interface Endpoint
resource "aws_vpc_endpoint" "secretsmanager" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-secretsmanager-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# 6. KMS Interface Endpoint
resource "aws_vpc_endpoint" "kms" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.kms"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-kms-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# 7. ECS Interface Endpoint
resource "aws_vpc_endpoint" "ecs" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-ecs-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# 8. ECS Agent Interface Endpoint
resource "aws_vpc_endpoint" "ecs_agent" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecs-agent"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-ecs-agent-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# 9. ECS Telemetry Interface Endpoint
resource "aws_vpc_endpoint" "ecs_telemetry" {
  count               = var.enable_interface_endpoints ? 1 : 0
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecs-telemetry"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = aws_subnet.private_app[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]

  tags = {
    Name        = "studyflow-ecs-telemetry-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# VPC Flow Logs

resource "aws_cloudwatch_log_group" "flow_logs" {
  count             = var.enable_flow_logs ? 1 : 0
  name              = "/aws/vpc/studyflow-flow-logs-${var.environment}"
  retention_in_days = var.flow_log_retention_days

  tags = {
    Name        = "studyflow-flow-logs-${var.environment}"
    Environment = var.environment
  }
}

data "aws_iam_policy_document" "vpc_flow_logs_assume_role" {
  count = var.enable_flow_logs ? 1 : 0
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "vpc_flow_logs_role" {
  count              = var.enable_flow_logs ? 1 : 0
  name               = "studyflow-vpc-flow-logs-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_logs_assume_role[0].json
}

data "aws_iam_policy_document" "vpc_flow_logs_policy" {
  count = var.enable_flow_logs ? 1 : 0
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    resources = ["${aws_cloudwatch_log_group.flow_logs[0].arn}:*"]
  }
}

resource "aws_iam_role_policy" "vpc_flow_logs_policy" {
  count  = var.enable_flow_logs ? 1 : 0
  name   = "studyflow-vpc-flow-logs-policy-${var.environment}"
  role   = aws_iam_role.vpc_flow_logs_role[0].id
  policy = data.aws_iam_policy_document.vpc_flow_logs_policy[0].json
}

resource "aws_flow_log" "main" {
  count                = var.enable_flow_logs ? 1 : 0
  iam_role_arn         = aws_iam_role.vpc_flow_logs_role[0].arn
  log_destination      = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
}
