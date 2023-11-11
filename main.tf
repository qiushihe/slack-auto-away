locals {
  package_name              = "slack-auto-away"
  dummy_hello_url           = format("%s/dummy-hello", module.lambda_gateway.invocation_url)
  oauth_start_url           = format("%s/oauth-start", module.lambda_gateway.invocation_url)
  oauth_callback_url        = format("%s/oauth-callback", module.lambda_gateway.invocation_url)
  slash_command_default_url = format("%s/slash-command-default", module.lambda_gateway.invocation_url)
  public_asset_urls         = [for key in module.public_assets.asset_keys : "https://${module.assets_bucket.bucket_name}.s3.amazonaws.com/${key}"]
}

# -------------------------------------------------------------------------------------------------

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# -------------------------------------------------------------------------------------------------

module "lambda_bucket" {
  source      = "./modules/aws-s3-bucket"
  bucket_name = var.aws_s3_functions_bucket_name
  bucket_acl  = "private"
}

module "assets_bucket" {
  source         = "./modules/aws-s3-bucket"
  bucket_name    = var.aws_s3_assets_bucket_name
  bucket_acl     = "public-read"
  enable_website = true
}

module "data_bucket" {
  source      = "./modules/aws-s3-bucket"
  bucket_name = var.aws_s3_data_bucket_name
  bucket_acl  = "private"
}

# -------------------------------------------------------------------------------------------------

module "lambda_role" {
  source       = "./modules/aws-lambda-role"
  package_name = local.package_name
  bucket_arns = [
    module.assets_bucket.bucket_arn,
    module.data_bucket.bucket_arn
  ]
  queue_arns = [aws_sqs_queue.jobs.arn]
  function_arns = [
    module.job_functions_send_response.function_arn,
    module.job_functions_check_status.function_arn
  ]
}

module "lambda_gateway" {
  source       = "./modules/aws-lambda-gateway"
  package_name = local.package_name
}

# -------------------------------------------------------------------------------------------------

module "public_assets" {
  source    = "./modules/aws-s3-assets"
  bucket_id = module.assets_bucket.bucket_id
  is_public = true

  assets = [
    {
      source = "${abspath(path.module)}/src/asset/callback-result.html",
      key    = "callback-result.html"
      type   = "text/html"
    }
  ]
}

# -------------------------------------------------------------------------------------------------

module "dummy_functions" {
  source          = "./modules/aws-lambda-functions"
  bucket_id       = module.lambda_bucket.bucket_id
  source_dir      = "${abspath(path.module)}/.build/src/functions/dummy"
  output_dir      = "${abspath(path.module)}/.archives"
  output_filename = "dummy-functions.zip"
}

module "dummy_functions_hello" {
  source           = "./modules/aws-lambda-function"
  function_name    = "DummyHello"
  function_handler = "hello"
  function_method  = "GET"
  function_path    = "/dummy-hello"

  s3_bucket        = module.dummy_functions.archive_bucket
  s3_key           = module.dummy_functions.archive_key
  source_code_hash = module.dummy_functions.archive_base64sha256

  environment_variables = {}

  role_arn      = module.lambda_role.iam_role_arn
  execution_arn = module.lambda_gateway.gateway_execution_arn
  api_id        = module.lambda_gateway.gateway_api_id
}

module "oauth_functions" {
  source          = "./modules/aws-lambda-functions"
  bucket_id       = module.lambda_bucket.bucket_id
  source_dir      = "${abspath(path.module)}/.build/src/functions/oauth"
  output_dir      = "${abspath(path.module)}/.archives"
  output_filename = "oauth-functions.zip"
}

module "oauth_functions_start" {
  source           = "./modules/aws-lambda-function"
  function_name    = "OAuthStart"
  function_handler = "start"
  function_method  = "GET"
  function_path    = "/oauth-start"

  s3_bucket        = module.oauth_functions.archive_bucket
  s3_key           = module.oauth_functions.archive_key
  source_code_hash = module.oauth_functions.archive_base64sha256

  environment_variables = {
    CLIENT_ID          = var.slack_app_client_id
    OAUTH_CALLBACK_URL = local.oauth_callback_url
  }

  role_arn      = module.lambda_role.iam_role_arn
  execution_arn = module.lambda_gateway.gateway_execution_arn
  api_id        = module.lambda_gateway.gateway_api_id
}

module "oauth_functions_callback" {
  source           = "./modules/aws-lambda-function"
  function_name    = "OAuthCallback"
  function_handler = "callback"
  function_method  = "GET"
  function_path    = "/oauth-callback"

  s3_bucket        = module.oauth_functions.archive_bucket
  s3_key           = module.oauth_functions.archive_key
  source_code_hash = module.oauth_functions.archive_base64sha256

  environment_variables = {
    DATA_BUCKET_NAME   = module.data_bucket.bucket_name
    CLIENT_ID          = var.slack_app_client_id
    CLIENT_SECRET      = var.slack_app_client_secret
    OAUTH_CALLBACK_URL = local.oauth_callback_url
    PUBLIC_ASSET_URLS  = join(",", local.public_asset_urls)
  }

  role_arn      = module.lambda_role.iam_role_arn
  execution_arn = module.lambda_gateway.gateway_execution_arn
  api_id        = module.lambda_gateway.gateway_api_id
}

module "slash_command_functions" {
  source          = "./modules/aws-lambda-functions"
  bucket_id       = module.lambda_bucket.bucket_id
  source_dir      = "${abspath(path.module)}/.build/src/functions/slash-command"
  output_dir      = "${abspath(path.module)}/.archives"
  output_filename = "slash-command-functions.zip"
}

module "slash_command_functions_default" {
  source           = "./modules/aws-lambda-function"
  function_name    = "SlashCommandDefault"
  function_handler = "default"
  function_method  = "POST"
  function_path    = "/slash-command-default"

  s3_bucket        = module.slash_command_functions.archive_bucket
  s3_key           = module.slash_command_functions.archive_key
  source_code_hash = module.slash_command_functions.archive_base64sha256

  environment_variables = {
    OAUTH_START_URL = local.oauth_start_url
    JOBS_QUEUE_URL  = aws_sqs_queue.jobs.url
  }

  role_arn      = module.lambda_role.iam_role_arn
  execution_arn = module.lambda_gateway.gateway_execution_arn
  api_id        = module.lambda_gateway.gateway_api_id
}

module "job_functions" {
  source          = "./modules/aws-lambda-functions"
  bucket_id       = module.lambda_bucket.bucket_id
  source_dir      = "${abspath(path.module)}/.build/src/functions/job"
  output_dir      = "${abspath(path.module)}/.archives"
  output_filename = "job-functions.zip"
}

module "job_functions_process" {
  source           = "./modules/aws-lambda-function"
  function_name    = "JobProcess"
  function_handler = "process"

  s3_bucket        = module.job_functions.archive_bucket
  s3_key           = module.job_functions.archive_key
  source_code_hash = module.job_functions.archive_base64sha256

  environment_variables = {
    FUNCTION_ARN_SEND_RESPONSE = module.job_functions_send_response.function_arn
    FUNCTION_ARN_CHECK_STATUS  = module.job_functions_check_status.function_arn
  }

  role_arn      = module.lambda_role.iam_role_arn
  execution_arn = module.lambda_gateway.gateway_execution_arn
  api_id        = module.lambda_gateway.gateway_api_id
}

module "job_functions_send_response" {
  source           = "./modules/aws-lambda-function"
  function_name    = "JobSendResponse"
  function_handler = "send-response"

  s3_bucket        = module.job_functions.archive_bucket
  s3_key           = module.job_functions.archive_key
  source_code_hash = module.job_functions.archive_base64sha256

  environment_variables = {}

  role_arn      = module.lambda_role.iam_role_arn
  execution_arn = module.lambda_gateway.gateway_execution_arn
  api_id        = module.lambda_gateway.gateway_api_id
}

module "job_functions_check_status" {
  source           = "./modules/aws-lambda-function"
  function_name    = "JobCheckStatus"
  function_handler = "check-status"

  s3_bucket        = module.job_functions.archive_bucket
  s3_key           = module.job_functions.archive_key
  source_code_hash = module.job_functions.archive_base64sha256

  environment_variables = {
    DATA_BUCKET_NAME = module.data_bucket.bucket_name
  }

  role_arn      = module.lambda_role.iam_role_arn
  execution_arn = module.lambda_gateway.gateway_execution_arn
  api_id        = module.lambda_gateway.gateway_api_id
}

# -------------------------------------------------------------------------------------------------

resource "aws_sqs_queue" "jobs" {
  name = local.package_name

  # This has to equal to or greater than Lambda function's execution timeout
  visibility_timeout_seconds = 60
}

resource "aws_lambda_event_source_mapping" "jobs" {
  event_source_arn = aws_sqs_queue.jobs.arn
  function_name    = module.job_functions_process.function_name
}
