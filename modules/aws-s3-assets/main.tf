resource "aws_s3_object" "assets" {
  for_each = { for asset in var.assets : asset["key"] => asset }

  bucket              = var.bucket_id
  key                 = each.value["key"]
  source              = each.value["source"]
  etag                = filemd5(each.value["source"])
  content_type        = try(each.value["type"], null)
  content_disposition = try(each.value["disposition"], null)
  acl                 = try(each.value["public"], false) ? "public-read" : null
}
