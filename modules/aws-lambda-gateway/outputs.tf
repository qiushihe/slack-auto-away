output "gateway_execution_arn" {
  value = aws_apigatewayv2_api.gateway.execution_arn
}

output "gateway_api_id" {
  value = aws_apigatewayv2_api.gateway.id
}

output "invocation_url" {
  value = aws_apigatewayv2_stage.gateway.invoke_url
}
