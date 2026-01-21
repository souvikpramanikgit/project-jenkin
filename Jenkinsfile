pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE = 'docker compose'
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
        
        stage('Build with Docker Compose') {
            steps {
                echo 'Building images with docker-compose...'
                sh '''
                    docker compose build --no-cache
                '''
            }
        }
        
        stage('Tag Images for Docker Hub') {
            steps {
                echo 'Tagging images for Docker Hub...'
                sh '''
                    docker tag be:latest ${DOCKER_HUB_REPO}-backend:${BUILD_NUMBER}
                    docker tag be:latest ${DOCKER_HUB_REPO}-backend:latest
                    docker tag fe:latest ${DOCKER_HUB_REPO}-frontend:${BUILD_NUMBER}
                    docker tag fe:latest ${DOCKER_HUB_REPO}-frontend:latest
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
        
        stage('Push Images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'
                sh '''
                    docker push ${DOCKER_HUB_REPO}-backend:${BUILD_NUMBER}
                    docker push ${DOCKER_HUB_REPO}-backend:latest
                    docker push ${DOCKER_HUB_REPO}-frontend:${BUILD_NUMBER}
                    docker push ${DOCKER_HUB_REPO}-frontend:latest
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
