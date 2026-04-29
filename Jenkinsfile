pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo '========================================='
                echo 'BUILD STAGE: Creating Docker Image'
                echo '========================================='
                
                // Build Docker image
                bat 'docker build -t safeguard-ai-app:1.0 .'
                
                // Tag as latest
                bat 'docker tag safeguard-ai-app:1.0 safeguard-ai-app:latest'
                
                // Verify image was created
                bat 'docker images | findstr safeguard-ai-app'
                
                // Save image as artifact (for Jenkins to archive)
                bat 'docker save safeguard-ai-app:1.0 -o safeguard-ai-app.tar'
                
                // Archive the artifact in Jenkins
                archiveArtifacts artifacts: 'safeguard-ai-app.tar', allowEmptyArchive: true
                
                echo '========================================='
                echo '✅ BUILD STAGE COMPLETE!'
                echo 'Artifact: safeguard-ai-app:1.0 (Docker image)'
                echo '========================================='
            }
        }
    }
    
    post {
        success {
            echo '🎉 Build stage completed successfully!'
        }
        failure {
            echo '❌ Build stage failed! Check logs above.'
        }
    }
}