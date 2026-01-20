pipeline {

    agent any

    environment {

        DOCKER_COMPOSE = 'docker-compose'

        PROJECT_NAME = 'tasklist-app'

        DOCKERHUB_CREDENTIALS = credentials('docker-hub-credentials')

        DOCKER_HUB_REPO = "${DOCKERHUB_CREDENTIALS_USR}/${PROJECT_NAME}"

    }

    

    stages {

        stage('Checkout') {

            steps {

                echo 'Checking out code from repository...'

                checkout scm

            }

        }

        

        stage('Build Backend Image') {

            steps {

                echo "Building backend Docker image for ${DOCKER_HUB_REPO}..."

                sh '''

                    docker build -t ${DOCKER_HUB_REPO}-backend:${BUILD_NUMBER} -t ${DOCKER_HUB_REPO}-backend:latest ./Backend

                '''

            }

        }

        

        stage('Build Frontend Image') {

            steps {

                echo "Building frontend Docker image for ${DOCKER_HUB_REPO}..."

                sh '''

                    docker build -t ${DOCKER_HUB_REPO}-frontend:${BUILD_NUMBER} -t ${DOCKER_HUB_REPO}-frontend:latest ./Frontend

                '''

            }

        }

        

        stage('Build with Docker Compose') {

            steps {

                echo 'Building images with docker-compose...'

                sh '''

                    docker-compose build --no-cache

                '''

            }

        }

        

        stage('Login to Docker Hub') {

            steps {

                echo "Logging in to Docker Hub as ${DOCKERHUB_CREDENTIALS_USR}..."

                sh '''

                    echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin

                '''

            }

        }

        

        stage('Push Backend Image to Docker Hub') {

            steps {

                echo 'Pushing backend image to Docker Hub...'

                sh '''

                    docker push ${DOCKER_HUB_REPO}-backend:${BUILD_NUMBER}

                    docker push ${DOCKER_HUB_REPO}-backend:latest

                '''

            }

        }

        

        stage('Push Frontend Image to Docker Hub') {

            steps {

                echo 'Pushing frontend image to Docker Hub...'

                sh '''

                    docker push ${DOCKER_HUB_REPO}-frontend:${BUILD_NUMBER}

                    docker push ${DOCKER_HUB_REPO}-frontend:latest

                '''

            }

        }

        

        stage('Stop Existing Containers') {

            steps {

                echo 'Stopping existing containers...'

                sh '''

                    docker-compose down || true

                '''

            }

        }

        

        stage('Start Containers') {

            steps {

                echo 'Starting containers with docker-compose...'

                sh '''

                    docker-compose up -d

                '''

            }

        }

        

        stage('Health Check') {

            steps {

                echo 'Waiting for services to be ready...'

                sh '''

                    sleep 10

                    docker-compose ps

                '''

            }

        }

    }

    

    post {

        success {

            echo 'Pipeline succeeded! Images built and containers started.'

        }

        failure {

            echo 'Pipeline failed! Check logs for details.'

        }

        always {

            sh 'docker logout || true'

            echo 'Cleaning up...'

            // Optional: Remove old images to save space

            // sh 'docker image prune -f'

        }

    }

}