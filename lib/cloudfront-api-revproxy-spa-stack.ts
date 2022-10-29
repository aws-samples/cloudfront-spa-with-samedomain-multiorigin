import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigwv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

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
        console.log('Received event:', JSON.stringify(event, null, 2));
        console.log("blah")
        return "whatever data 1";
    };`
    const fn = new lambda.Function(this, 'spa-backend', {
      code: lambda.Code.fromInline(inlinecoode),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    //Create API GW
    const spaDataIntegration = new HttpLambdaIntegration('SpaDataIntegration', fn);
    const httpApi = new apigwv2.HttpApi(this, 'HttpApi');
    httpApi.addRoutes({
      path: '/helloData',
      methods: [ apigwv2.HttpMethod.ANY ],
      integration: spaDataIntegration
    });


    //Create CF Dist with origin and behaviours
    const s3SpaOrigin = new origins.S3Origin(sample_spa_bucket)
    const apiUrl = cdk.Fn.select(2, cdk.Fn.split('/', httpApi.apiEndpoint))
    const ApiSpaOrigin = new origins.HttpOrigin(apiUrl);
    new cloudfront.Distribution(this, 'spaDist', {
      defaultBehavior: { origin:  s3SpaOrigin},
      additionalBehaviors: {
        '/helloData': {
          origin: ApiSpaOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    });
  }
}
