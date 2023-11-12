terraform {
  cloud {
    organization = "slack-auto-away"

    workspaces {
      name = "slack-auto-away"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.23.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.0"
    }
  }

  required_version = "~> 1.2"
}
