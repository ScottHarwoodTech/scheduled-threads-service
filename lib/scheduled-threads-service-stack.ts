import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from "path";
import { Secret } from "aws-cdk-lib/aws-secretsmanager"
import { Rule, Schedule } from "aws-cdk-lib/aws-events"
import { LambdaFunction, addLambdaPermission } from 'aws-cdk-lib/aws-events-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { CfnSchedule } from "aws-cdk-lib/aws-scheduler"
import { Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export interface SchedueldThreadsServiceProps extends cdk.StackProps {
  channelID: string
}
export class ScheduledThreadsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedueldThreadsServiceProps) {
    super(scope, id, props);

    const bot_token_parameter = new Secret(this, 'bot_token', {
      description: "STS Bot Token"
    })

    const thread_channel_parameter = new StringParameter(this, "weekly-thread", {
      stringValue: "intial"
    })

    const create_thread_lambda = new NodejsFunction(this, "create-thread", {
      entry: path.join(__dirname, "../lambdas/create-thread.ts"),
      handler: "main",
      environment: {
        CHANNEL: props.channelID,
        BOT_TOKEN_SECRET_ID: bot_token_parameter.secretArn,
        THREAD_CHANNEL_PARAMETER: thread_channel_parameter.parameterName

      }
    })

    const schedulerRole = new Role(this, "scheduler-role", {
      assumedBy: new ServicePrincipal('scheduler.amazonaws.com')
    });



    const friday_rule = new CfnSchedule(this, "friday-rule", {
      scheduleExpression: "cron(0 12 ? * fri *)",
      scheduleExpressionTimezone: "GMT",
      flexibleTimeWindow: {
        mode: "OFF"
      },
      target: {
        arn: create_thread_lambda.functionArn,
        roleArn: schedulerRole.roleArn,
      }
    })

    bot_token_parameter.grantRead(create_thread_lambda)
    thread_channel_parameter.grantWrite(create_thread_lambda)


    const close_thread_lambda = new NodejsFunction(this, "close-thread", {
      entry: path.join(__dirname, "../lambdas/close-thread.ts"),
      handler: "main",
      environment: {
        CHANNEL: props.channelID,
        BOT_TOKEN_SECRET_ID: bot_token_parameter.secretArn,
        THREAD_CHANNEL_PARAMETER: thread_channel_parameter.parameterName
      }
    })

    const sunday_rule = new CfnSchedule(this, "sunday-rule", {
      scheduleExpression: "cron(30 18 ? * sun *)",
      scheduleExpressionTimezone: "GMT",
      flexibleTimeWindow: {
        mode: "OFF"
      },
      target: {
        arn: close_thread_lambda.functionArn,
        roleArn: schedulerRole.roleArn,
      }
    })

    bot_token_parameter.grantRead(close_thread_lambda)
    thread_channel_parameter.grantRead(close_thread_lambda)


    const allowInvokeLambdasPolicy = new Policy(this, "allowSchedulerInvokeLambda");

    const allowInvokelambdasStatement = new PolicyStatement()
    allowInvokelambdasStatement.addResources(create_thread_lambda.functionArn, close_thread_lambda.functionArn)
    allowInvokelambdasStatement.addActions("lambda:InvokeFunction")
    allowInvokeLambdasPolicy.addStatements(
      allowInvokelambdasStatement
    )

    schedulerRole.attachInlinePolicy(allowInvokeLambdasPolicy)

  }
}
