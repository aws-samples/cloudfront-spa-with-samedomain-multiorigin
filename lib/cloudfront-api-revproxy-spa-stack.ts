import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class CloudfrontApiRevproxySpaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Create S3 bucket
    const sample_spa_bucket = new s3.Bucket(this, 'sample-spa-bucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    //Create Lambda Func
    const inlinecoode = `console.log('Loading function');

    exports.handler = async (event, context) => {
      console.log(event);
         const responseBody = {
            "data": "Test data"
        };
        const response = {
            "statusCode": 200,
            "headers": {
                "my_header": "my_value"
            },
            "body": JSON.stringify(responseBody),
            "isBase64Encoded": false
        };
        return response;
    };`
    const fn = new lambda.Function(this, 'spa-backend', {
      code: lambda.Code.fromInline(inlinecoode),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    //Create API GW
    const restApi = new apigw.LambdaRestApi(this, 'dataApi', {
      handler: fn,
    });


    //Create CF Dist with origin and behaviours
    const s3SpaOrigin = new origins.S3Origin(sample_spa_bucket);
    const ApiSpaOrigin = new origins.RestApiOrigin(restApi);
    new cloudfront.Distribution(this, 'spaDist', {
      defaultBehavior: { origin:  s3SpaOrigin},
      additionalBehaviors: {
        '/api/*': {
          origin: ApiSpaOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER
        },
      }
    });
  }
}
