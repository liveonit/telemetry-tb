#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TelemetryTbServer } from '../lib/instance';
import { config } from '../config'


const app = new cdk.App();
new TelemetryTbServer(app, config.projectName, config, { env: { region: config.region, account: config.account } });