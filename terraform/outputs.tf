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

output "api_log_group" {
  value       = aws_cloudwatch_log_group.apigw.name
  description = "API Gateway access log group"
}

output "lambda_function_names" {
  value       = { for k, v in aws_lambda_function.handlers : k => v.function_name }
  description = "Map of handler key to Lambda function name"
}

output "dynamodb_table_names" {
  value       = { for k, v in aws_dynamodb_table.tables : k => v.name }
  description = "Map of table key to DynamoDB table name"
}
