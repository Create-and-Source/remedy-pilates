# ── Cognito User Pool ────────────────────────────────────────────────
resource "aws_cognito_user_pool" "main" {
  name = "${var.project}-users"

  auto_verified_attributes = ["email"]
  username_attributes       = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project}-web"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  callback_urls = ["http://localhost:5173/auth/callback", "https://pilatesstudio.com/auth/callback"]
  logout_urls   = ["http://localhost:5173", "https://pilatesstudio.com"]

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true
  supported_identity_providers         = ["COGNITO"]
}

# Studio roles
resource "aws_cognito_user_group" "roles" {
  for_each = toset(["owner", "instructor", "front_desk", "trainee", "client"])

  name         = each.key
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "${each.key} role"
}
