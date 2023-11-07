provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# -------------------------------------------------------------------------------------------------

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = var.aws_s3_functions_bucket_name
}

resource "aws_s3_bucket_ownership_controls" "lambda_bucket" {
  bucket = aws_s3_bucket.lambda_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "lambda_bucket" {
  depends_on = [aws_s3_bucket_ownership_controls.lambda_bucket]
  bucket     = aws_s3_bucket.lambda_bucket.id
  acl        = "private"
}

resource "aws_iam_role" "lambda_exec" {
  name = "slack-auto-away-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_exec.name
}

resource "aws_apigatewayv2_api" "lambda" {
  name          = "slack-auto-away-gateway"
  protocol_type = "HTTP"
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.lambda.name}"
  retention_in_days = 30
}

resource "aws_apigatewayv2_stage" "lambda" {
  api_id      = aws_apigatewayv2_api.lambda.id
  name        = "slack-auto-away-stage"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

# -------------------------------------------------------------------------------------------------

locals {
  oauth_start_url = format("%s/oauth-start", aws_apigatewayv2_stage.lambda.invoke_url)
  oauth_callback_url = format("%s/oauth-callback", aws_apigatewayv2_stage.lambda.invoke_url)
}

# -------------------------------------------------------------------------------------------------

module "dummy_functions" {
  source          = "./modules/aws-lambda-functions"
  bucket_id       = aws_s3_bucket.lambda_bucket.id
  source_dir      = "${abspath(path.module)}/src/functions/dummy"
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

  environment_variables = {
    BASE_URL  = aws_apigatewayv2_stage.lambda.invoke_url
    CLIENT_ID = var.slack_app_client_id
  }

  role_arn      = aws_iam_role.lambda_exec.arn
  execution_arn = aws_apigatewayv2_api.lambda.execution_arn
  api_id        = aws_apigatewayv2_api.lambda.id
}

module "dummy_functions_who" {
  source           = "./modules/aws-lambda-function"
  function_name    = "DummyWho"
  function_handler = "who"
  function_method  = "GET"
  function_path    = "/dummy-who"

  s3_bucket        = module.dummy_functions.archive_bucket
  s3_key           = module.dummy_functions.archive_key
  source_code_hash = module.dummy_functions.archive_base64sha256

  environment_variables = {
    BASE_URL = aws_apigatewayv2_stage.lambda.invoke_url
  }

  role_arn      = aws_iam_role.lambda_exec.arn
  execution_arn = aws_apigatewayv2_api.lambda.execution_arn
  api_id        = aws_apigatewayv2_api.lambda.id
}

module "oauth_functions" {
  source          = "./modules/aws-lambda-functions"
  bucket_id       = aws_s3_bucket.lambda_bucket.id
  source_dir      = "${abspath(path.module)}/src/functions/oauth"
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

  role_arn      = aws_iam_role.lambda_exec.arn
  execution_arn = aws_apigatewayv2_api.lambda.execution_arn
  api_id        = aws_apigatewayv2_api.lambda.id
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
    CLIENT_ID          = var.slack_app_client_id
    CLIENT_SECRET      = var.slack_app_client_secret
    OAUTH_CALLBACK_URL = local.oauth_callback_url
  }

  role_arn      = aws_iam_role.lambda_exec.arn
  execution_arn = aws_apigatewayv2_api.lambda.execution_arn
  api_id        = aws_apigatewayv2_api.lambda.id
}
