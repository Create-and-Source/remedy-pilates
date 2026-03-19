terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Remote state in S3 — create bucket first with: aws s3 mb s3://pilates-terraform-state --region us-west-2
  backend "s3" {
    bucket         = "pilates-terraform-state"
    key            = "pilates/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "pilates-terraform-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "Pilates Studio"
      ManagedBy = "Terraform"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ── Table definitions (data-driven) ─────────────────────────────────
locals {
  tables = {
    clients              = { pk = "id", gsi = [{ name = "byEmail", pk = "email", sk = null }, { name = "byInstructor", pk = "preferredInstructor", sk = null }] }
    appointments         = { pk = "id", gsi = [{ name = "byDate", pk = "date", sk = "time" }, { name = "byClient", pk = "patientId", sk = "date" }, { name = "byInstructor", pk = "instructorId", sk = "date" }] }
    services             = { pk = "id", gsi = [{ name = "byCategory", pk = "category", sk = null }] }
    instructors          = { pk = "id", gsi = [] }
    locations            = { pk = "id", gsi = [] }
    class_packages       = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }] }
    inventory            = { pk = "id", gsi = [{ name = "bySku", pk = "sku", sk = null }] }
    emails               = { pk = "id", gsi = [] }
    texts                = { pk = "id", gsi = [] }
    social_posts         = { pk = "id", gsi = [] }
    retention_alerts     = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }, { name = "byStatus", pk = "status", sk = null }] }
    photos               = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }] }
    trainees             = { pk = "id", gsi = [] }
    posture_assessments  = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }] }
    prescriptions        = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }] }
    bookings             = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }] }
    settings             = { pk = "key", gsi = [] }
    checkins             = { pk = "id", gsi = [{ name = "byDate", pk = "date", sk = null }] }
    waivers              = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }] }
    waitlist             = { pk = "id", gsi = [{ name = "byService", pk = "serviceId", sk = null }] }
    wallet               = { pk = "id", gsi = [{ name = "byClient", pk = "clientId", sk = null }] }
    transactions         = { pk = "id", gsi = [{ name = "byClient", pk = "clientId", sk = "date" }] }
    inbox                = { pk = "id", gsi = [{ name = "byClient", pk = "clientId", sk = null }] }
    reviews              = { pk = "id", gsi = [{ name = "byInstructor", pk = "instructorId", sk = null }] }
    referrals            = { pk = "id", gsi = [{ name = "byReferrer", pk = "referrerId", sk = null }] }
    referral_settings    = { pk = "key", gsi = [] }
    memberships          = { pk = "id", gsi = [{ name = "byClient", pk = "clientId", sk = null }, { name = "byTier", pk = "tier", sk = null }] }
    membership_packages  = { pk = "id", gsi = [] }
    recovery_tips        = { pk = "id", gsi = [] }
    charts               = { pk = "id", gsi = [{ name = "byClient", pk = "patientId", sk = null }] }
  }

  # Flatten GSIs for dynamic blocks
  table_gsis = merge([
    for tname, tdef in local.tables : {
      for gsi in tdef.gsi : "${tname}:${gsi.name}" => merge(gsi, { table = tname })
    }
  ]...)

  # Lambda handler → table access mapping
  lambda_handlers = {
    clients        = ["clients"]
    appointments   = ["appointments"]
    services       = ["services"]
    instructors    = ["instructors"]
    locations      = ["locations"]
    packages       = ["class_packages"]
    inventory      = ["inventory"]
    emails         = ["emails"]
    texts          = ["texts"]
    social-posts   = ["social_posts"]
    retention      = ["retention_alerts"]
    photos         = ["photos"]
    trainees       = ["trainees"]
    posture        = ["posture_assessments"]
    prescriptions  = ["prescriptions"]
    bookings       = ["bookings"]
    settings       = ["settings"]
    checkins       = ["checkins"]
    waivers        = ["waivers"]
    waitlist       = ["waitlist"]
    wallet         = ["wallet"]
    transactions   = ["transactions"]
    inbox          = ["inbox"]
    reviews        = ["reviews"]
    referrals      = ["referrals", "referral_settings"]
    memberships    = ["memberships", "membership_packages"]
    recovery-tips  = ["recovery_tips"]
    charts         = ["charts"]
    init           = ["clients", "appointments", "services", "instructors", "locations", "class_packages", "inventory", "emails", "texts", "social_posts", "retention_alerts", "trainees", "checkins", "settings"]
  }

  # Memory tiering: heavy handlers get 256MB, simple CRUD gets 128MB, init gets 512MB
  lambda_memory = {
    clients      = 256
    appointments = 256
    memberships  = 256
    init         = 512
  }
}
