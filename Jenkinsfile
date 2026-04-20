pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo '========================================='
                echo 'BUILD STAGE: Creating Docker Image'
                echo '========================================='
                
                // Build Docker image
                sh '''
                    echo "Building Docker image..."
                    docker build -t safeguard-ai-app:1.0 .
                    docker tag safeguard-ai-app:1.0 safeguard-ai-app:latest
                '''
                
                // Verify image was created
                sh '''
                    echo ""
                    echo "Build artifact created:"
                    docker images | grep safeguard-ai-app
                '''
                
                // Save image as artifact (optional)
                sh '''
                    docker save safeguard-ai-app:1.0 -o safeguard-ai-app.tar
                    echo "Artifact saved: safeguard-ai-app.tar"
                '''
                
                // Archive the artifact in Jenkins
                archiveArtifacts artifacts: 'safeguard-ai-app.tar', allowEmptyArchive: true
                
                echo '========================================='
                echo ' BUILD STAGE COMPLETE!'
                echo 'Artifact: safeguard-ai-app:1.0 (Docker image)'
                echo '========================================='
            }
        }
    }
    
    post {
        always {
            echo 'Build stage finished.'
        }
        success {
            echo ' Build succeeded! Docker image is ready.'
        }
        failure {
            echo ' Build failed! Check the logs above.'
        }
    }
}