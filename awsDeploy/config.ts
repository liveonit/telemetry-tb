import * as dotenv from "dotenv";
import * as path from 'path';
import { InstanceClass, InstanceSize } from '@aws-cdk/aws-ec2';

dotenv.config({ path: path.resolve(__dirname, '../.env' )});

export const config = {
  projectName: process.env.PROJECT_NAME as string,
  stage: process.env.STAGE as string,
  gitUser: process.env.GIT_USER as string,
  gitPass: process.env.GIT_PASS as string,
  gitProject: process.env.GIT_PROJECT as string,
  region: process.env.REGION as string,
  account: process.env.ACCOUNT as string,
  amiId: process.env.AMI_ID as string,
  instanceClass: process.env.INSANCE_CLASS as InstanceClass,
  instanceSize: process.env.INSTANCE_SIZE as InstanceSize,
  ebsVolumeSize: parseInt(process.env.EBS_VOLUME_SIZE || "8"),
}