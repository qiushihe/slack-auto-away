output "iam_role_arn" {
  value = aws_iam_role.role.arn
}

output "iam_policy_arn" {
  value = aws_iam_policy.policy.arn
}
