terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      # aws.us_east_1 is used for the CloudFront certificate, which must live
      # in us-east-1; the default aws provider is the ap-south-1 stack region.
      configuration_aliases = [aws.us_east_1]
    }
  }
}
