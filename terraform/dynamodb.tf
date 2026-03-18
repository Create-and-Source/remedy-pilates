# ── DynamoDB Tables (30) ─────────────────────────────────────────────
resource "aws_dynamodb_table" "tables" {
  for_each = local.tables

  name         = "${var.table_prefix}${each.key}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = each.value.pk

  attribute {
    name = each.value.pk
    type = "S"
  }

  # GSI partition key attributes
  dynamic "attribute" {
    for_each = { for gsi in each.value.gsi : gsi.name => gsi if !contains([each.value.pk], gsi.pk) }
    content {
      name = attribute.value.pk
      type = "S"
    }
  }

  # GSI sort key attributes
  dynamic "attribute" {
    for_each = {
      for gsi in each.value.gsi : "${gsi.name}-sk" => gsi
      if gsi.sk != null && gsi.sk != each.value.pk && gsi.sk != gsi.pk
    }
    content {
      name = attribute.value.sk
      type = "S"
    }
  }

  dynamic "global_secondary_index" {
    for_each = { for gsi in each.value.gsi : gsi.name => gsi }
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.pk
      range_key       = global_secondary_index.value.sk
      projection_type = "ALL"
    }
  }

  # TTL for transient tables (auto-expire old checkins, waitlist entries, inbox messages)
  dynamic "ttl" {
    for_each = contains(["checkins", "waitlist", "inbox"], each.key) ? [1] : []
    content {
      attribute_name = "expiresAt"
      enabled        = true
    }
  }

  # Point-in-time recovery for critical data tables
  dynamic "point_in_time_recovery" {
    for_each = contains(["clients", "appointments", "transactions", "memberships"], each.key) ? [1] : []
    content {
      enabled = true
    }
  }

  lifecycle {
    prevent_destroy = false
  }
}
