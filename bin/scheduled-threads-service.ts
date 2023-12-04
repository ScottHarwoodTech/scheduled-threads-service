#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ScheduledThreadsServiceStack } from '../lib/scheduled-threads-service-stack';

const channelID = process.env.CHANNELID

if (!channelID) {
  throw new Error("Channel id not defined, please use CHANNELID envvar")
}

const app = new cdk.App();
new ScheduledThreadsServiceStack(app, 'ScheduledThreadsServiceStack', {
  channelID
});