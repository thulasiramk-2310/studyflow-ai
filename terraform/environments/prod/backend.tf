terraform {
  backend "s3" {
    bucket         = "studyflow-tf-state-809809510670"
    key            = "prod/networking/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "studyflow-tf-locks"
    encrypt        = true
  }
}
