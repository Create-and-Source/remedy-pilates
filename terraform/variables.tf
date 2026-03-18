variable "region" {
  default = "us-west-2"
}

variable "table_prefix" {
  default = "remedy-"
}

variable "project" {
  default = "remedy"
}

variable "cors_origins" {
  default = ["http://localhost:5173", "https://remedypilates.com"]
}
