import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { KeyPair } from 'cdk-ec2-key-pair'
import { EbsDeviceVolumeType, InstanceClass, InstanceSize, InstanceType, MachineImage, SecurityGroup, UserData } from '@aws-cdk/aws-ec2';
import { PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import * as path from 'path'
import { readFileSync } from 'fs';
import Handlebars = require('handlebars');
import { config } from '../config'
export class TelemetryTbServer extends cdk.Stack {
  public readonly instance: ec2.Instance;
  public readonly key: KeyPair;
  public readonly role: Role;
  public readonly sg: SecurityGroup;


  constructor(scope: cdk.Construct, id: string, conf: typeof config, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- CREATE ROLE
    this.role = new Role(this, `${id}-role`, {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com")
    });
    this.role.addToPolicy(new PolicyStatement({
      resources: ['*'],
      actions: [
        "rds:*",
        "logs:*",
        "xray:*",
        "ec2:*",
        "cloudwatch:*",
        "ecr:*",
        "secretsmanager:GetSecretValue",
        "ses:SendEmail",
        "ses:SendTemplatedEmail",
        "ses:SendRawEmail",
        "ses:SendBulkTemplatedEmail",
        "sns:*"
      ]
    }));

    // --- CREATE KEY
    this.key = new KeyPair(this, `${id}-ec2key`, {
      name: `${id}-ec2key`
    });

    // --- GET DEFAULT VPC INFO AND CREATE SG
    const existingVpc = ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true });

    this.sg = new SecurityGroup(this, `${id}-sg`, {
      vpc: existingVpc,
      allowAllOutbound: true,
      securityGroupName: `${id}-sg`
    })

    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH frm anywhere')
    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(1883), 'Mqtt frm anywhere')
    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Web frm anywhere')
    this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Secure web frm anywhere')


    // --- CREATE USER DATA - SERVER INITIALIZATION
    const userData = UserData.forLinux();
    var source = readFileSync(path.resolve(__dirname, '../init.template.sh'))
    const template = Handlebars.compile(source.toString());
    const cmd1 = template(conf);
    userData.addCommands(cmd1)

    // --- CREATE SERVER
    this.instance = new ec2.Instance(this, `${id}-instance`, {
      machineImage: MachineImage.genericLinux({ [conf.region]: conf.amiId }),
      instanceType: InstanceType.of(config.instanceClass, config.instanceSize),
      keyName: this.key.keyPairName,
      vpc: existingVpc,
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: {
            ebsDevice: {
              volumeSize: config.ebsVolumeSize,
              volumeType: EbsDeviceVolumeType.GP2
            }
          },
          mappingEnabled: true
        }
      ],
      role: this.role,
      securityGroup: this.sg,
      userData
    });
  }
}
