locals {
  policy_bucket_arns   = flatten([for item in var.bucket_arns : [item, "${item}/*"]])
  policy_queue_arns    = [for item in var.queue_arns : "${item}"]
  policy_function_arns = [for item in var.function_arns : "${item}"]
}

resource "aws_iam_role" "role" {
  name = var.package_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "role" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.role.name
}

resource "aws_iam_policy" "policy" {
  name        = var.package_name
  description = "Policy to grant the Lambda IAM role"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = "s3:*",
        Effect   = "Allow",
        Resource = local.policy_bucket_arns,
      },
      {
        Action   = "sqs:*",
        Effect   = "Allow",
        Resource = local.policy_queue_arns,
      },
      {
        Action   = "lambda:*",
        Effect   = "Allow",
        Resource = local.policy_function_arns,
      },
    ],
  })
}

resource "aws_iam_policy_attachment" "policy" {
  name       = var.package_name
  policy_arn = aws_iam_policy.policy.arn
  roles      = [aws_iam_role.role.name]
}
