variable "bucket_name" {
  type = string
}

variable "bucket_acl" {
  type = string
}

variable "enable_website" {
  type    = bool
  default = false
}
