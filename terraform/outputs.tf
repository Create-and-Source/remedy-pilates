output "api_url" {
  value       = aws_apigatewayv2_api.main.api_endpoint
  description = "API Gateway endpoint URL"
}

output "user_pool_id" {
  value       = aws_cognito_user_pool.main.id
  description = "Cognito User Pool ID"
}

output "user_pool_client_id" {
  value       = aws_cognito_user_pool_client.web.id
  description = "Cognito User Pool Client ID"
}

output "uploads_bucket" {
  value       = aws_s3_bucket.uploads.id
  description = "S3 uploads bucket name"
}

output "account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS Account ID"
}
