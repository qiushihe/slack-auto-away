resource "aws_apigatewayv2_api" "gateway" {
  name          = var.package_name
  protocol_type = "HTTP"
}

resource "aws_cloudwatch_log_group" "gateway" {
  name              = "/aws/api_gw/${aws_apigatewayv2_api.gateway.name}"
  retention_in_days = 30
}

resource "aws_apigatewayv2_stage" "gateway" {
  name        = var.package_name
  api_id      = aws_apigatewayv2_api.gateway.id
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.gateway.arn

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
    })
  }
}

