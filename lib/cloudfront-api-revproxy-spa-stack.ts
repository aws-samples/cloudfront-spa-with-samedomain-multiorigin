import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';


/*
The resources created in the below code are for testing only and do not have any authentication added for the origins.
*/

export class CloudfrontApiRevproxySpaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup');
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED
    });

    const sample_spa_bucket = new s3.Bucket(this, 'sample-spa-bucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      serverAccessLogsBucket: accessLogsBucket
    });

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
      runtime: lambda.Runtime.NODEJS_18_X
    });


    const restApi = new apigw.LambdaRestApi(this, 'dataApi', {
      handler: fn,
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigw.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigw.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: true
        
      }
    });

    restApi.addUsagePlan('UsagePlan', {
      name: 'Easy',
      throttle: {
        rateLimit: 10,
        burstLimit: 2
      }
    });
        

    const s3SpaOrigin = new origins.S3Origin(sample_spa_bucket);
    const ApiSpaOrigin = new origins.RestApiOrigin(restApi);
    const cfDist = new cloudfront.Distribution(this, 'spaDist', {
      defaultBehavior: { origin:  s3SpaOrigin},
      additionalBehaviors: {
        '/api/*': {
          origin: ApiSpaOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        },
      },
      defaultRootObject: "index.html",
      enableLogging: true,
      logBucket: accessLogsBucket,
      logFilePrefix: 'distribution-access-logs/',
      logIncludesCookies: true
    });
  }
}
