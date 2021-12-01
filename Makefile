ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: deploy destroy synth get_secret
deploy:
	cd  awsDeploy && cdk deploy
	make get_secret
destroy:
	cd  awsDeploy && cdk destroy
synth:
	cd  awsDeploy && cdk synth
get_secret:
	aws secretsmanager get-secret-value \
    --secret-id ec2-ssh-key/${PROJECT_NAME}-ec2key/private \
    --query SecretString \
    --output text > secret.pem
	chmod 600 secret.pem

.PHONY: up_staging down_staging tear_down_staging
up_staging:
	docker-compose up -d
down_staging:
	docker-compose down
tear_down_staging:
	docker-compose down -v