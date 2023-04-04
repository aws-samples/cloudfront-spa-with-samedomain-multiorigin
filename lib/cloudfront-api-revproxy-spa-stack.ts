import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
//import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
// import * as triggers from 'aws-cdk-lib/triggers';
// import * as codebuild from 'aws-cdk-lib/aws-codebuild';
// import * as codecommit from 'aws-cdk-lib/aws-codecommit';

/*
The resources created in the below code are for testing only and do not have any authentication added for the origins.
*/

export class CloudfrontApiRevproxySpaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sample_spa_bucket = new s3.Bucket(this, 'sample-spa-bucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    });

    // const s3Deployment = new s3Deploy.BucketDeployment(this, 'DeployWebsite', {
    //   sources: [s3Deploy.Source.asset('sample-spa/dist/sample-spa')],
    //   destinationBucket: sample_spa_bucket
    // });

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
      runtime: lambda.Runtime.NODEJS_16_X
    });


    const restApi = new apigw.LambdaRestApi(this, 'dataApi', {
      handler: fn,
    });

    const s3SpaOrigin = new origins.S3Origin(sample_spa_bucket);
    const ApiSpaOrigin = new origins.RestApiOrigin(restApi);
    const cfDist = new cloudfront.Distribution(this, 'spaDist', {
      defaultBehavior: { origin:  s3SpaOrigin},
      additionalBehaviors: {
        '/api/*': {
          origin: ApiSpaOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        },
      },
      defaultRootObject: "index.html"
    });

    // const repo = new codecommit.Repository(this, 'Repository', {
    //   repositoryName: 'Spa-repo',
    //   code: codecommit.Code.fromDirectory('sample-spa')
    // });

    // new codebuild.Project(this, 'SpaProject', {
    //   buildSpec: codebuild.BuildSpec.fromObject({
    //     version: '0.2',
    //     phases: {
    //       build: {
    //         commands: [
    //           'echo "Hello, CodeBuild!"',
    //         ],
    //       },
    //     },
    //   }),
    // });

    // const configTrigger = new triggers.TriggerFunction(this, 'SampleTrigger', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromAsset('triggers'),
    //   environment: {
    //     'CFDistEndpoint': cfDist.distributionDomainName,
    //     'CFDomainNameProp': cfDist.distributionDomainName,
    //     'APIGW': restApi.url,
    //     'S3Bucket': sample_spa_bucket.bucketName

    //   }
    // });
    
    // sample_spa_bucket.grantReadWrite(configTrigger);

    // configTrigger.executeAfter(restApi, cfDist, s3Deployment);
  }
}
