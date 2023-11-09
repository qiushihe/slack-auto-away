variable "bucket_id" {
  type = string
}

variable "assets" {
  type = list(map(string))
}

variable "is_public" {
  type    = bool
  default = false
}
