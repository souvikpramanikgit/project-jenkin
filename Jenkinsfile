pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE = 'docker compose'
        PROJECT_NAME = 'tasklist-app'
        DOCKERHUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_HUB_REPO = "${DOCKERHUB_CREDENTIALS_USR}/${PROJECT_NAME}"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
            }
        }
        
        stage('Build with Docker Compose') {
            steps {
                echo 'Building images with docker-compose...'
                sh '''
                    docker compose build
                '''
            }
        }
        
        stage('Tag Images as latest') {
            steps {
                echo 'Tagging build images as latest...'
                sh '''
                    docker tag ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG} ${DOCKER_HUB_REPO}-backend:latest
                    docker tag ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG} ${DOCKER_HUB_REPO}-frontend:latest
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
        // docker push ${DOCKER_HUB_REPO}-backend:latest
        // docker push ${DOCKER_HUB_REPO}-frontend:latest
        stage('Push Images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                sh '''
                    docker push ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG}
                    
                    docker push ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG}
                    
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
            sh '''docker rmi -f $(docker images "souvik5/tasklist*" -q)'''
        }
    }
}
