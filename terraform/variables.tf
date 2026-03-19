variable "region" {
  default = "us-west-2"
}

variable "table_prefix" {
  default = "pilates-"
}

variable "project" {
  default = "pilates"
}

variable "cors_origins" {
  default = ["http://localhost:5173", "https://pilatesstudio.com"]
}
