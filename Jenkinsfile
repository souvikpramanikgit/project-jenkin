pipeline {
    agent any
    
    environment {
        SONAR_HOME = tool "sonar"
        PROJECT_NAME = 'tasklist-app'
        DOCKERHUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_HUB_REPO = "${DOCKERHUB_CREDENTIALS_USR}/${PROJECT_NAME}"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage("SonarQube Quality Analysis"){
            steps{
                withSonarQubeEnv("sonar"){
                    sh "$SONAR_HOME/bin/sonar-scanner -Dsonar.projectName=TaskManagementApp -Dsonar.projectKey=TaskManagementApp -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/target/**,**/*.log"
                }
            }
        }

        stage("OWASP Dependency Check"){
            when {
                expression {
                    return fileExists('pom.xml') ||
                           fileExists('package.json') ||
                           fileExists('requirements.txt') ||
                           fileExists('build.gradle')
                }
            }
            steps{
                script {
                    withCredentials([string(credentialsId: 'nvd_owasp', variable: 'NVD_API_KEY')]) {
                        dependencyCheck additionalArguments: "--scan ./ --nvdApiKey ${NVD_API_KEY}", odcInstallation: 'owasp'
                        dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
                    }
                }
            }
        }

        // stage("OWASP Dependency Check"){
        //     steps{
        //         script {
        //             try {
        //                 echo '🔍 Starting OWASP Dependency Check...'
        //                 withCredentials([string(credentialsId: 'nvd_owasp', variable: 'NVD_API_KEY')]) {
        //                     echo 'API Key loaded successfully'
        //                     dependencyCheck(
        //                         additionalArguments: "--scan ./ --nvdApiKey ${NVD_API_KEY} --format HTML --format XML --enableExperimental",
        //                         odcInstallation: 'owasp'
        //                     )
        //                 }
        //                 echo '📊 Publishing dependency check report...'
        //                 dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
        //                 echo '✅ OWASP Dependency Check completed'
        //             } catch (Exception e) {
        //                 echo "❌ OWASP Failed with error: ${e.toString()}"
        //                 echo "Error message: ${e.getMessage()}"
        //                 echo "Stack trace: ${e.getStackTrace()}"
        //                 throw e
        //             }
        //         }
        //     }
        // }

        stage('SonarQube Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Trivy File System Scan') {
            steps {
                sh '''
                    trivy fs --severity HIGH,CRITICAL \
                    --format table \
                    -o trivy-fs-report.html .
                '''
            }
        }

        stage('Docker Build (Docker Compose)') {
            steps {
                echo 'Building Docker images...'
                sh '''
                    docker compose build
                '''
            }
        }

        stage('Tag Docker Images') {
            steps {
                sh '''
                    docker tag ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG} ${DOCKER_HUB_REPO}-backend:latest
                    docker tag ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG} ${DOCKER_HUB_REPO}-frontend:latest
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG}
                    trivy image ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG}
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                sh '''
                    echo $DOCKERHUB_CREDENTIALS_PSW | docker login \
                    -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
                '''
            }
        }
        // docker push ${DOCKER_HUB_REPO}-backend:latest
        // docker push ${DOCKER_HUB_REPO}-frontend:latest
        stage('Push Images to Docker Hub') {
            steps {
                sh '''
                    docker push ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG}

                    docker push ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG}
                    
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check logs.'
        }
        always {
            sh 'docker logout || true'
            echo 'Cleanup done.'
        }
    }
}
