variable "package_name" {
  type = string
}

variable "bucket_arns" {
  type = list(string)
}

variable "queue_arns" {
  type = list(string)
}

variable "function_arns" {
  type = list(string)
}
