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

# -------------------------------------------------------------------------------------------------

data "archive_file" "dummy_functions" {
  type        = "zip"
  source_dir  = "${path.module}/src/functions/dummy"
  output_path = "${path.module}/.archives/dummy-functions.zip"
}

resource "aws_s3_object" "dummy_functions" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "dummy-functions.zip"
  source = data.archive_file.dummy_functions.output_path
  etag   = filemd5(data.archive_file.dummy_functions.output_path)
}

# -------------------------------------------------------------------------------------------------

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

resource "aws_lambda_function" "dummy_hello" {
  function_name = "DummyHello"

  role    = aws_iam_role.lambda_exec.arn
  runtime = "nodejs18.x"
  handler = "hello.handler"

  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.dummy_functions.key
  source_code_hash = data.archive_file.dummy_functions.output_base64sha256

  environment {
    variables = {
      BASE_URL      = aws_apigatewayv2_stage.lambda.invoke_url
      CLIENT_ID     = var.slack_app_client_id
      CLIENT_SECRET = var.slack_app_client_secret
    }
  }
}

resource "aws_cloudwatch_log_group" "dummy_hello" {
  name              = "/aws/lambda/${aws_lambda_function.dummy_hello.function_name}"
  retention_in_days = 30
}

resource "aws_lambda_function" "dummy_who" {
  function_name = "DummyWho"

  role    = aws_iam_role.lambda_exec.arn
  runtime = "nodejs18.x"
  handler = "who.handler"

  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.dummy_functions.key
  source_code_hash = data.archive_file.dummy_functions.output_base64sha256

  environment {
    variables = {
      BASE_URL = aws_apigatewayv2_stage.lambda.invoke_url
    }
  }
}

resource "aws_cloudwatch_log_group" "dummy_who" {
  name              = "/aws/lambda/${aws_lambda_function.dummy_who.function_name}"
  retention_in_days = 30
}

# -------------------------------------------------------------------------------------------------

resource "aws_lambda_permission" "dummy_hello" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
  function_name = aws_lambda_function.dummy_hello.function_name
}

resource "aws_lambda_permission" "dummy_who" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
  function_name = aws_lambda_function.dummy_who.function_name
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

resource "aws_apigatewayv2_integration" "dummy_hello" {
  api_id             = aws_apigatewayv2_api.lambda.id
  integration_uri    = aws_lambda_function.dummy_hello.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "dummy_hello" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "GET /dummy-hello"
  target    = "integrations/${aws_apigatewayv2_integration.dummy_hello.id}"
}

resource "aws_apigatewayv2_integration" "dummy_who" {
  api_id             = aws_apigatewayv2_api.lambda.id
  integration_uri    = aws_lambda_function.dummy_who.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "dummy_who" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "GET /dummy-who"
  target    = "integrations/${aws_apigatewayv2_integration.dummy_who.id}"
}
