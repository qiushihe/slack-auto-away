output "asset_keys" {
  value = [for asset in aws_s3_object.assets : asset.key]
}
