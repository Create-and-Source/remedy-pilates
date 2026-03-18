# ── API Gateway HTTP API ─────────────────────────────────────────────
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  # Access logging for debugging and cost attribution
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      method         = "$context.httpMethod"
      path           = "$context.path"
      status         = "$context.status"
      latency        = "$context.responseLatency"
      integrationErr = "$context.integrationErrorMessage"
    })
  }
}

# CloudWatch log group for API Gateway access logs
resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/aws/apigateway/${var.project}-api"
  retention_in_days = 30
}

# Cognito JWT Authorizer — validates tokens on protected routes
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project}-cognito-jwt"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
  }
}

# ── Route definitions ───────────────────────────────────────────────
locals {
  routes = {
    # Clients
    "GET /api/clients"              = "clients"
    "GET /api/clients/{id}"         = "clients"
    "POST /api/clients"             = "clients"
    "PUT /api/clients/{id}"         = "clients"
    "DELETE /api/clients/{id}"      = "clients"
    # Appointments
    "GET /api/appointments"         = "appointments"
    "GET /api/appointments/{id}"    = "appointments"
    "POST /api/appointments"        = "appointments"
    "PUT /api/appointments/{id}"    = "appointments"
    "DELETE /api/appointments/{id}" = "appointments"
    # Services
    "GET /api/services"             = "services"
    "GET /api/services/{id}"        = "services"
    "POST /api/services"            = "services"
    "PUT /api/services/{id}"        = "services"
    "DELETE /api/services/{id}"     = "services"
    # Instructors
    "GET /api/instructors"          = "instructors"
    "GET /api/instructors/{id}"     = "instructors"
    "POST /api/instructors"         = "instructors"
    "PUT /api/instructors/{id}"     = "instructors"
    # Locations
    "GET /api/locations"            = "locations"
    "POST /api/locations"           = "locations"
    # Class Packages
    "GET /api/packages"             = "packages"
    "GET /api/packages/{id}"        = "packages"
    "POST /api/packages"            = "packages"
    "PUT /api/packages/{id}"        = "packages"
    "DELETE /api/packages/{id}"     = "packages"
    # Inventory
    "GET /api/inventory"            = "inventory"
    "POST /api/inventory"           = "inventory"
    "PUT /api/inventory/{id}"       = "inventory"
    "POST /api/inventory/adjust"    = "inventory"
    # Emails
    "GET /api/emails"               = "emails"
    "POST /api/emails"              = "emails"
    # Texts
    "GET /api/texts"                = "texts"
    "POST /api/texts"               = "texts"
    # Social Posts
    "GET /api/social-posts"         = "social-posts"
    "POST /api/social-posts"        = "social-posts"
    "PUT /api/social-posts/{id}"    = "social-posts"
    "DELETE /api/social-posts/{id}" = "social-posts"
    # Retention
    "GET /api/retention"            = "retention"
    "PUT /api/retention/{id}"       = "retention"
    # Photos
    "GET /api/photos"               = "photos"
    "POST /api/photos"              = "photos"
    "DELETE /api/photos/{id}"       = "photos"
    # Trainees
    "GET /api/trainees"             = "trainees"
    "POST /api/trainees"            = "trainees"
    "PUT /api/trainees/{id}"        = "trainees"
    "DELETE /api/trainees/{id}"     = "trainees"
    # Posture
    "GET /api/posture"              = "posture"
    "POST /api/posture"             = "posture"
    "DELETE /api/posture/{id}"      = "posture"
    # Prescriptions
    "GET /api/prescriptions"        = "prescriptions"
    "POST /api/prescriptions"       = "prescriptions"
    "DELETE /api/prescriptions/{id}" = "prescriptions"
    # Bookings
    "GET /api/bookings"             = "bookings"
    "POST /api/bookings"            = "bookings"
    "DELETE /api/bookings/{id}"     = "bookings"
    # Settings
    "GET /api/settings"             = "settings"
    "PUT /api/settings"             = "settings"
    # Check-ins
    "GET /api/checkins"             = "checkins"
    "POST /api/checkins"            = "checkins"
    # Waivers
    "GET /api/waivers"              = "waivers"
    "POST /api/waivers"             = "waivers"
    "PUT /api/waivers/{id}"         = "waivers"
    # Waitlist
    "GET /api/waitlist"             = "waitlist"
    "POST /api/waitlist"            = "waitlist"
    "DELETE /api/waitlist/{id}"     = "waitlist"
    # Wallet
    "GET /api/wallet"               = "wallet"
    "POST /api/wallet"              = "wallet"
    "PUT /api/wallet/{id}"          = "wallet"
    # Transactions
    "GET /api/transactions"         = "transactions"
    "POST /api/transactions"        = "transactions"
    # Inbox
    "GET /api/inbox"                = "inbox"
    "POST /api/inbox"               = "inbox"
    "PUT /api/inbox/{id}"           = "inbox"
    # Reviews
    "GET /api/reviews"              = "reviews"
    "POST /api/reviews"             = "reviews"
    "PUT /api/reviews/{id}"         = "reviews"
    # Referrals
    "GET /api/referrals"            = "referrals"
    "POST /api/referrals"           = "referrals"
    "PUT /api/referrals/{id}"       = "referrals"
    "GET /api/referral-settings"    = "referrals"
    "PUT /api/referral-settings"    = "referrals"
    # Memberships
    "GET /api/memberships"              = "memberships"
    "POST /api/memberships"             = "memberships"
    "PUT /api/memberships/{id}"         = "memberships"
    "DELETE /api/memberships/{id}"      = "memberships"
    "GET /api/membership-packages"      = "memberships"
    "POST /api/membership-packages"     = "memberships"
    "PUT /api/membership-packages/{id}" = "memberships"
    # Recovery Tips
    "GET /api/recovery-tips"        = "recovery-tips"
    "POST /api/recovery-tips"       = "recovery-tips"
    "PUT /api/recovery-tips/{id}"   = "recovery-tips"
    # Charts
    "GET /api/charts"               = "charts"
    "POST /api/charts"              = "charts"
    "PUT /api/charts/{id}"          = "charts"
    # Init (single request loads all data for app startup)
    "GET /api/init"                 = "init"
  }
}

# ── Integrations (one per Lambda function) ──────────────────────────
resource "aws_apigatewayv2_integration" "lambda" {
  for_each = local.lambda_handlers

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.handlers[each.key].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# ── Routes (95+) — all protected by Cognito JWT ───────────────────
resource "aws_apigatewayv2_route" "routes" {
  for_each = local.routes

  api_id    = aws_apigatewayv2_api.main.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.lambda[each.value].id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# ── Lambda invoke permissions for API Gateway ──────────────────────
resource "aws_lambda_permission" "apigw" {
  for_each = local.lambda_handlers

  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.handlers[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
