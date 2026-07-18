# Log Groups
resource "aws_cloudwatch_log_group" "ecs_services" {
  for_each          = toset(var.log_group_names)
  name              = "/ecs/studyflow-${each.key}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Environment = var.environment
    Service     = each.key
  }
}

# ECS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  count               = var.ecs_cluster_name != "" ? 1 : 0
  alarm_name          = "studyflow-ecs-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This alarm monitors ECS cluster CPU utilization"
  dimensions = {
    ClusterName = var.ecs_cluster_name
  }
}

# ECS Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  count               = var.ecs_cluster_name != "" ? 1 : 0
  alarm_name          = "studyflow-ecs-memory-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This alarm monitors ECS cluster Memory utilization"
  dimensions = {
    ClusterName = var.ecs_cluster_name
  }
}

# RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count               = var.rds_identifier != "" ? 1 : 0
  alarm_name          = "studyflow-rds-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This alarm monitors RDS CPU utilization"
  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }
}

# RDS Free Storage Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  count               = var.rds_identifier != "" ? 1 : 0
  alarm_name          = "studyflow-rds-storage-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  # 5 GB in bytes
  threshold           = 5368709120
  alarm_description   = "This alarm monitors RDS Free Storage Space"
  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }
}

# ALB 5XX Errors Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count               = var.enable_alb_monitoring ? 1 : 0
  alarm_name          = "${var.project_name}-alb-5xx-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This alarm monitors ALB 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  count               = var.enable_alb_monitoring ? 1 : 0
  alarm_name          = "${var.project_name}-alb-response-time-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1 # 1 second
  alarm_description   = "This alarm monitors ALB target response time"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
}

# EC2 Status Check Alarm
resource "aws_cloudwatch_metric_alarm" "ec2_status" {
  count               = var.enable_ec2_monitoring ? 1 : 0
  alarm_name          = "studyflow-ec2-status-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "1"
  alarm_description   = "This alarm monitors EC2 AI GPU status check"
  dimensions = {
    InstanceId = var.ec2_instance_id
  }
}
