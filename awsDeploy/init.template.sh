# =========================================================================================================
# Check the /var/log/cloud-init-output.log in created instance to show logs and errors of the next commands
# =========================================================================================================

echo "# ----------------------------------------------------------"
echo "# Install Docker"
echo "# ----------------------------------------------------------"
sudo apt-get remove docker docker-engine docker.io containerd runc
sudo apt-get update
sudo apt-get install \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg-agent \
  software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io -y
sudo usermod -aG docker ubuntu
# run the following command to activate the changes to groups
sudo newgrp docker
echo "# ----------------------------------------------------------"
echo "# Install Docker-compose"
echo "# ----------------------------------------------------------"
sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "# ----------------------------------------------------------"
echo "# Clone repository and move to"
echo "# ----------------------------------------------------------"
cd /home/ubuntu
git clone https://{{gitUser}}:{{gitPass}}@github.com/{{gitUser}}/{{gitProject}}.git
cd {{gitProject}}
sudo chown -R $USER:$USER .

echo "# ----------------------------------------------------------"
echo "# Get environment vars"
echo "# ----------------------------------------------------------"
sudo apt  install awscli -y
aws --region {{region}} secretsmanager get-secret-value --secret-id {{projectName}}-{{stage}}-secrets --query SecretString --output text | base64 --decode > .env.{{stage}}
echo "# ----------------------------------------------------------"
echo "# Start project"
echo "# ----------------------------------------------------------"
sudo apt-get install build-essential -y
make up_{{stage}}

echo "# ----------------------------------------------------------"
echo "# Install Cloudformation tools and emit success event"
echo "# ----------------------------------------------------------"
apt-get -y install python-pip
mkdir aws-cfn-bootstrap-latest
pip install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-latest.tar.gz
/usr/local/bin/cfn-signal \
  --success true \
  --stack {{projectName}} \
  --resource AutoScalingGroup \
  --region {{region}}