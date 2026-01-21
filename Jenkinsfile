pipeline {
    agent any

    environment {
        PROJECT_NAME = 'tasklist-app'
        DOCKERHUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_HUB_REPO = "${DOCKERHUB_CREDENTIALS_USR}/${PROJECT_NAME}"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Login to Docker Hub') {
            steps {
                sh '''

                    echo "$DOCKERHUB_CREDENTIALS_PSW" | \

                    docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin

                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''

                    docker compose build --no-cache

                '''
            }
        }

        stage('Push Images') {
            steps {
                sh '''

                    docker compose push

                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''

                    docker compose down || true

                    docker compose pull

                    docker compose up -d --remove-orphans

                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''

                    sleep 10

                    docker compose ps

                '''
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }

        success {
            echo '✅ Deployment completed successfully'
        }

        failure {
            echo '❌ Deployment failed'
        }
    }
}
