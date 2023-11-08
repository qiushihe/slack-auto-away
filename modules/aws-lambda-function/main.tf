resource "aws_lambda_function" "function" {
  function_name = var.function_name

  role    = var.role_arn
  runtime = "nodejs18.x"
  handler = format("%s.handler", var.function_handler)
  timeout = 60

  s3_bucket        = var.s3_bucket
  s3_key           = var.s3_key
  source_code_hash = var.source_code_hash

  environment {
    variables = var.environment_variables
  }
}

resource "aws_cloudwatch_log_group" "function_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.function.function_name}"
  retention_in_days = 30
}

resource "aws_lambda_permission" "function_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.execution_arn}/*/*"
  function_name = aws_lambda_function.function.function_name
}

resource "aws_apigatewayv2_integration" "function_integration" {
  api_id             = var.api_id
  integration_uri    = aws_lambda_function.function.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "function_route" {
  api_id    = var.api_id
  route_key = format("%s %s", var.function_method, var.function_path)
  target    = "integrations/${aws_apigatewayv2_integration.function_integration.id}"
}

#resource "aws_lambda_function_url" "function" {
#  function_name      = aws_lambda_function.function.function_name
#  authorization_type = "NONE"
#}

#resource "aws_apigatewayv2_integration_response" "function" {
#  api_id                   = var.api_id
#  integration_id           = aws_apigatewayv2_integration.function_integration.id
#  integration_response_key = "/200/"
#
#  response_templates = {
#    "application/json" = "$input.path('$')"
#    "text/html"        = "$input.path('body')"
#  }
#}

#resource "aws_apigatewayv2_integration" "function_integration" {
#  api_id             = var.api_id
#  integration_uri    = aws_lambda_function_url.function.function_url
#  integration_type   = "HTTP_PROXY"
#  integration_method = "POST"
#}
