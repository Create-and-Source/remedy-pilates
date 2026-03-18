# ── CloudFront Distribution (API cache + performance) ────────────────
# Caches read-heavy endpoints (services, locations, instructors, settings)
# and adds edge TLS termination for all API requests

resource "aws_cloudfront_distribution" "api" {
  enabled         = true
  comment         = "${var.project} API CDN"
  price_class     = "PriceClass_100" # US + Europe only (cheapest)
  http_version    = "http2and3"
  is_ipv6_enabled = true

  # Origin: API Gateway
  origin {
    domain_name = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
    origin_id   = "api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default: forward all requests to API Gateway (no caching)
  default_cache_behavior {
    target_origin_id       = "api-gateway"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # No caching by default — mutations and auth-dependent routes
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
  }

  # Cache static reference data: services, locations, instructors, recovery-tips
  # These change rarely and are safe to cache at the edge for 5 minutes
  dynamic "ordered_cache_behavior" {
    for_each = toset(["/api/services", "/api/locations", "/api/instructors", "/api/recovery-tips"])
    content {
      path_pattern           = ordered_cache_behavior.value
      target_origin_id       = "api-gateway"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      # 5-minute TTL for reference data
      min_ttl     = 0
      default_ttl = 300
      max_ttl     = 600

      forwarded_values {
        query_string = false
        headers      = ["Authorization", "Origin"]

        cookies {
          forward = "none"
        }
      }
    }
  }

  # Cache /api/init for 60 seconds (reduces cold starts on high-traffic loads)
  ordered_cache_behavior {
    path_pattern           = "/api/init"
    target_origin_id       = "api-gateway"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    min_ttl     = 0
    default_ttl = 60
    max_ttl     = 120

    forwarded_values {
      query_string = false
      headers      = ["Authorization", "Origin"]

      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # When ready for custom domain, replace with:
    # acm_certificate_arn      = aws_acm_certificate.api.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "${var.project}-api-cdn"
  }
}

output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.api.domain_name}"
  description = "CloudFront distribution URL (use as VITE_API_URL for edge caching)"
}
