# About the project
The project deploys a AWS resources to demonstrate how Amazon Cloudfront same domain policy can be used to improve performance of SPA's accessing backend through Amazon API Gateway.

# Prerequisites
For the deployment, you must have the following:

An AWS account. If you don’t have an AWS account, then sign up here.
AWS CDK installed in your local environment.
An S3 bucket for hosting SPA assets.
CloudFront distribution.
An AWS Lambda function.
An API Gateway REST API with a proxy integration for the Lambda function.
Steps to deploy the package
1. Clone the project
1. Navigate to the repository’s root directory.
`cd cloudfront-api-revproxy-spa`
1. Run npm install to install node package dependencies.
1. If this is your first time deploying stack with AWS CDK in your AWS account, then run the following command to bootstrap your AWS environment.
`cdk bootstrap`
1. Deploy the AWS CDK application.
`cdk deploy`

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
