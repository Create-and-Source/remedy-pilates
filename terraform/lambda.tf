# ── Lambda Shared Layer ──────────────────────────────────────────────
data "archive_file" "shared_layer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda/shared"
  output_path = "${path.module}/.build/shared-layer.zip"
}

resource "aws_lambda_layer_version" "shared" {
  layer_name          = "${var.project}-shared"
  filename            = data.archive_file.shared_layer.output_path
  source_code_hash    = data.archive_file.shared_layer.output_base64sha256
  compatible_runtimes = ["nodejs20.x"]
  description         = "Shared DynamoDB helpers and response utilities"
}

# ── Lambda IAM Role ─────────────────────────────────────────────────
resource "aws_iam_role" "lambda" {
  name = "${var.project}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDB least-privilege: CRUD only (no CreateTable, DeleteTable, admin ops)
resource "aws_iam_role_policy" "lambda_dynamo" {
  name = "${var.project}-lambda-dynamo"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem",
        "dynamodb:BatchGetItem",
      ]
      Resource = [
        "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.table_prefix}*",
        "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.table_prefix}*/index/*",
      ]
    }]
  })
}

# S3 access for uploads bucket
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${var.project}-lambda-s3"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
      Resource = "${aws_s3_bucket.uploads.arn}/*"
    }]
  })
}

# ── Lambda Functions (29 — 28 CRUD + init) ────────────────────────
data "archive_file" "handlers" {
  for_each = local.lambda_handlers

  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda/${each.key}"
  output_path = "${path.module}/.build/${each.key}.zip"
}

resource "aws_lambda_function" "handlers" {
  for_each = local.lambda_handlers

  function_name    = "${var.project}-${each.key}"
  filename         = data.archive_file.handlers[each.key].output_path
  source_code_hash = data.archive_file.handlers[each.key].output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda.arn
  memory_size      = lookup(local.lambda_memory, each.key, 128)
  timeout          = each.key == "init" ? 15 : 10
  layers           = [aws_lambda_layer_version.shared.arn]

  environment {
    variables = {
      TABLE_PREFIX   = var.table_prefix
      UPLOADS_BUCKET = aws_s3_bucket.uploads.id
      USER_POOL_ID   = aws_cognito_user_pool.main.id
    }
  }
}
