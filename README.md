# Slack Auto Away

## IAM User and Policies

Setup and deployment of this app requires an IAM user, with the following policies:

* `AmazonAPIGatewayAdministrator`
* `AmazonEventBridgeFullAccess`
* `AmazonS3FullAccess`
* `AmazonSQSFullAccess`
* `AWSLambda_FullAccess`
* `CloudWatchLogsFullAccess`
* `IAMFullAccess`

Note: The above policies list is very rough, and contains way more permissions than what's actually
      needed. To set up the IAM user properly, one should use more precise policies instead of
      those `*FullAccess` ones.

## Development Workflow

Install dependencies:

```bash
$ yarn install
```

To build from the source files:

```bash
$ yarn build
```

See **Deployment Workflow** below for deployment related concerns.

## Testing Workflow

In order to test some of more intricate S3 data manipulation functions, unit tests actually require
Docker, in order to run LocalStack to simulate a local and ephemeral S3 server.

The orchestration of Docker in the context of running unit tests are all done by Jest's global
setup and teardown script. For more on that, see various files in `test`.

To run tests:

```bash
$ yarn test
```

## Deployment Workflow

Infrastructure setup and deployment is handled entirely by Terraform.

Before deploying, create a `terraform.tfvars` file, and populate it with the following the example
found in `terraform.tfvars.example`.

The purpose of the various variables in `terraform.tfvars` are as follows:

* `aws_access_key`: IAM user's Access Key
* `aws_secret_key`: IAM user's Secret Key
* `slack_app_client_id`: Slack App's "client ID"
* `slack_app_client_secret`: Slack App's "client secret"
* `slack_app_signing_secret`: Slack App's "signing secret"
* `loggable_slack_user_ids`: A list of Slack user IDs whose "user changed" event will be logged in
detail. Leave this as an empty array to not log any user's "user changed" event.

Run the `deploy` NPM script to automate the building and deployment process:

```bash
$ yarn deploy
```

The `yarn deploy` script will automatically apply any pending changes.

To receive a confirmation prompt before applying changes, run the following instead:

```bash
$ yarn deploy:terraform:init
$ yarn deploy:terraform:apply
```

For more information on infrastructure setup, see `main.tf` as well as the various custom
Terraform modules defined in `modules`.

## Slack App Configurations

Go to https://api.slack.com/apps and set up an Slack App, with the following: 

* Bot Token Scopes: `commands`, `users:read`
* User Token Scopes: `users:write`
* Slack commands:
  * Command: `/auto-away`
  * Request URL: <the `slash-command-default` Lambda function URL>
  * Short Description: Handles various slash-commands
  * Usage Hint: [help, auth, schedule, status, logout]
* Interactivity:
  * Request URL: <the `interactivity-default` Lambda function URL>
* Event subscription:
  * Request URL: <the `event-subscription` Lambda function URL>
  * Subscribe to events on behalf of users:
    * `user_change`: Requires the `users:read` scope
