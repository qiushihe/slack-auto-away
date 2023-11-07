variable "function_name" {
  type = string
}

variable "function_handler" {
  type = string
}

variable "function_method" {
  type = string
}

variable "function_path" {
  type = string
}

variable "role_arn" {
  type = string
}

variable "execution_arn" {
  type = string
}

variable "api_id" {
  type = string
}

variable "s3_bucket" {
  type = string
}

variable "s3_key" {
  type = string
}

variable "source_code_hash" {
  type = string
}

variable "environment_variables" {
  type = map(string)
}
