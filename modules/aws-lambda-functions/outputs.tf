output "archive_path" {
  value = data.archive_file.functions_archive.output_path
}

output "archive_base64sha256" {
  value = data.archive_file.functions_archive.output_base64sha256
}

output "archive_bucket" {
  value = aws_s3_object.functions_s3_object.bucket
}

output "archive_key" {
  value = aws_s3_object.functions_s3_object.key
}
