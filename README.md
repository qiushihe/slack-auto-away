# Slack Auto Away

IAM Policies
* AmazonAPIGatewayAdministrator
* AmazonEventBridgeFullAccess
* AmazonS3FullAccess
* AmazonSQSFullAccess
* AWSLambda_FullAccess
* CloudWatchLogsFullAccess
* IAMFullAccess

Slack Apps
* https://api.slack.com/apps
* Bot Token Scopes: `commands`, `users:read`
* User Token Scopes: `users:write`
* Slack commands:
  * Command: `/auto-away`
  * Request URL: <the `slash-command-default` Lambda function URL>
  * Short Description: Configure auto-away
  * Usage Hint: [help][from 9am to 5pm]
* Event subscription:
  * Request URL: <the `event-subscription` Lambda function URL>
  * Subscribe to events on behalf of users:
    * `user_change`: Requires the `users:read` scope
