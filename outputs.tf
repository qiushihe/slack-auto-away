output "lambda_bucket_name" {
  description = "Name of the S3 bucket used to store function code"
  value       = aws_s3_bucket.lambda_bucket.id
}

output "dummy_hello_function_name" {
  description = "Name of the dummy Lambda function"
  value       = aws_lambda_function.dummy_hello.function_name
}

output "base_url" {
  description = "Base URL for API Gateway stage"
  value       = aws_apigatewayv2_stage.lambda.invoke_url
}
