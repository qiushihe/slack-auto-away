variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS Access Key"
  type        = string
}

variable "aws_secret_key" {
  description = "AWS Secret Key"
  type        = string
  sensitive   = true
}

variable "aws_s3_functions_bucket_name" {
  description = "AWS S3 bucket name to store functions"
  type        = string
  default     = "slack-auto-away-fns"
}

variable "aws_s3_assets_bucket_name" {
  description = "AWS S3 bucket name to store assets"
  type        = string
  default     = "slack-auto-away-assets"
}

variable "aws_s3_data_bucket_name" {
  description = "AWS S3 bucket name to store data"
  type        = string
  default     = "slack-auto-away-data"
}

variable "slack_app_client_id" {
  description = "Slack App's Client ID"
  type        = string
}

variable "slack_app_client_secret" {
  description = "Slack App's Client Secret"
  type        = string
  sensitive   = true
}

variable "slack_app_signing_secret" {
  description = "Slack App's Signing Secret"
  type        = string
  sensitive   = true
}

variable "loggable_slack_user_ids" {
  description = "IDs of users whose data can be logged"
  type        = list(string)
}
