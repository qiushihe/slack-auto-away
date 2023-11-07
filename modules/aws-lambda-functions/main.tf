data "archive_file" "functions_archive" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = format("%s/%s", var.output_dir, var.output_filename)
}

resource "aws_s3_object" "functions_s3_object" {
  bucket = var.bucket_id
  key    = var.output_filename
  source = data.archive_file.functions_archive.output_path
  etag   = filemd5(data.archive_file.functions_archive.output_path)
}
