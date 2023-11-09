resource "aws_s3_object" "assets" {
  bucket = var.bucket_id
  acl    = var.is_public ? "public-read" : null

  for_each            = { for asset in var.assets : asset["key"] => asset }
  key                 = each.value["key"]
  source              = each.value["source"]
  etag                = filemd5(each.value["source"])
  content_type        = try(each.value["type"], null)
  content_disposition = try(each.value["disposition"], null)
}
