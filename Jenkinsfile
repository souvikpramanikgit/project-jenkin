pipeline {
    agent any
    
    environment {
        SONAR_HOME = tool "sonar"
        PROJECT_NAME = 'tasklist-app'
        DOCKERHUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_HUB_REPO = "${DOCKERHUB_CREDENTIALS_USR}/${PROJECT_NAME}"
        IMAGE_TAG = "${BUILD_NUMBER}"
        
        // Kubernetes Configuration
        K8S_NAMESPACE = 'task-management'
        DEPLOYMENT_NAME = 'task-management-app'
        BACKEND_IMAGE = "${DOCKER_HUB_REPO}-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_REPO}-frontend"
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
                    sh "$SONAR_HOME/bin/sonar-scanner -Dsonar.projectName=TaskManagementApp -Dsonar.projectKey=TaskManagementApp -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/target/**,**/*.log,**/dependency-check-report.*,**/trivy-*.html"
                }
            }
        }

        stage("OWASP Dependency Check"){
            steps{
                script {
                    try {
                        echo '🔍 Running OWASP Dependency Check...'
                        withCredentials([string(credentialsId: 'nvd_owasp', variable: 'NVD_API_KEY')]) {
                            dependencyCheck(
                                additionalArguments: "--scan ./ --nvdApiKey ${NVD_API_KEY} --format HTML --format XML",
                                odcInstallation: 'owasp'
                            )
                            dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
                        }
                        echo '✅ OWASP scan completed'
                    } catch (Exception e) {
                        echo "⚠️ OWASP scan had issues: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
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
                    waitForQualityGate abortPipeline: false
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
                script {
                    try {
                        echo '🔍 Running Trivy image scan...'
                        sh """
                            trivy image --severity HIGH,CRITICAL \
                                --format table \
                                --output trivy-backend-report.txt \
                                --no-progress \
                                ${BACKEND_IMAGE}:${IMAGE_TAG}
                            
                            trivy image --severity HIGH,CRITICAL \
                                --format table \
                                --output trivy-frontend-report.txt \
                                --no-progress \
                                ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        """
                        archiveArtifacts artifacts: 'trivy-*-report.txt', allowEmptyArchive: true
                        echo '✅ Trivy image scan completed'
                    } catch (Exception e) {
                        echo "⚠️ Trivy image scan found vulnerabilities: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
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
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    try {
                        echo '☸️ Deploying to Kubernetes...'
                        
                        withCredentials([
                            file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')
                        ]) {
                            sh """
                                export KUBECONFIG=\${KUBECONFIG}
                                
                                # Verify cluster connection
                                echo "🔗 Verifying cluster connection..."
                                kubectl cluster-info
                                kubectl get nodes
                                
                                # Apply namespace
                                echo "📋 Applying namespace..."
                                kubectl apply -f k8s/namespace.yaml
                                
                                # Apply or create service
                                echo "📋 Applying service..."
                                kubectl apply -f k8s/service.yaml
                                
                                # Apply or create deployment
                                echo "📋 Applying deployment..."
                                kubectl apply -f k8s/deployment.yaml
                                
                                # Update deployment with new image tags
                                echo "🔄 Updating deployment images..."
                                kubectl set image deployment/${DEPLOYMENT_NAME} \
                                    backend=${BACKEND_IMAGE}:${IMAGE_TAG} \
                                    frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} \
                                    -n ${K8S_NAMESPACE} \
                                    --record
                                
                                # Wait for rollout to complete
                                echo "⏳ Waiting for deployment rollout..."
                                kubectl rollout status deployment/${DEPLOYMENT_NAME} \
                                    -n ${K8S_NAMESPACE} \
                                    --timeout=5m
                                
                                # Display deployment status
                                echo "📊 Deployment Status:"
                                kubectl get pods -n ${K8S_NAMESPACE} -o wide
                                kubectl get svc -n ${K8S_NAMESPACE}
                            """
                        }
                        
                        echo '✅ Kubernetes deployment completed successfully!'
                    } catch (Exception e) {
                        echo "❌ Kubernetes deployment failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
        }

        stage('Verification') {
            when {
                expression { 
                    return currentBuild.result == null || currentBuild.result == 'SUCCESS' 
                }
            }
            steps {
                script {
                    try {
                        echo '🔍 Verifying deployment...'
                        
                        // Wait a moment for pods to stabilize
                        sleep(time: 10, unit: 'SECONDS')
                        
                        withCredentials([
                            file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')
                        ]) {
                            sh """
                                export KUBECONFIG=\${KUBECONFIG}
                                
                                # Check pod status
                                echo "📊 Pod Status:"
                                kubectl get pods -n ${K8S_NAMESPACE}
                                
                                # Check if all pods are ready
                                echo "🔍 Waiting for all pods to be ready..."
                                kubectl wait --for=condition=ready pod \
                                    -l app=${DEPLOYMENT_NAME} \
                                    -n ${K8S_NAMESPACE} \
                                    --timeout=300s
                                
                                # Get service details
                                echo "🌐 Service Details:"
                                kubectl get svc -n ${K8S_NAMESPACE}
                                
                                # Get deployment details
                                echo "📦 Deployment Details:"
                                kubectl get deployment ${DEPLOYMENT_NAME} -n ${K8S_NAMESPACE}
                                
                                # Show recent events
                                echo "📋 Recent Events:"
                                kubectl get events -n ${K8S_NAMESPACE} --sort-by='.lastTimestamp' | tail -10
                                
                                # Get pod logs (last 20 lines)
                                echo "📝 Recent Backend Logs:"
                                kubectl logs -n ${K8S_NAMESPACE} \
                                    -l app=${DEPLOYMENT_NAME} \
                                    -c backend \
                                    --tail=20 || echo "No backend logs available"
                                
                                echo "📝 Recent Frontend Logs:"
                                kubectl logs -n ${K8S_NAMESPACE} \
                                    -l app=${DEPLOYMENT_NAME} \
                                    -c frontend \
                                    --tail=20 || echo "No frontend logs available"
                            """
                        }
                        
                        echo '✅ Deployment verification passed!'
                    } catch (Exception e) {
                        echo "⚠️ Deployment verification had issues: ${e.getMessage()}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
    }
    

    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            cleanWs()

            echo '❌ Pipeline failed. Check logs.'
        }
        always {
            sh 'docker logout || true'
            echo 'Cleanup done.'
        }
    }
}
