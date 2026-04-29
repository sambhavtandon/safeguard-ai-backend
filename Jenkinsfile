pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo 'BUILD STAGE: Creating Docker Image'
                bat 'docker build -t safeguard-ai-app:1.0 .'
                bat 'docker images | findstr safeguard-ai-app'
                echo '✅ BUILD STAGE COMPLETE!'
            }
        }
        
        stage('Test') {
            steps {
                echo 'TEST STAGE: JUnit Framework'
                bat 'npm install'
                bat 'npm run test:ci'
                echo '✅ TEST STAGE COMPLETE!'
            }
            post {
                always {
                    junit 'test-results/junit.xml'
                }
            }
        }
        
        stage('Code Quality') {
            steps {
                echo 'CODE QUALITY STAGE: SonarQube'
                echo 'Analyzing: Code duplication, smells, complexity'
                
                // Use your token directly
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQube') {
                        bat '''
                            sonar-scanner -Dsonar.projectKey=safeguard-code-quality ^
                                          -Dsonar.projectName="SafeGuard+ Code Quality" ^
                                          -Dsonar.sources=src ^
                                          -Dsonar.exclusions=**/node_modules/**, **/tests/**, **/*.test.js ^
                                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info ^
                                          -Dsonar.host.url=http://localhost:9000 ^
                                          -Dsonar.login=%SONAR_TOKEN%
                        '''
                    }
                }
                
                echo '✅ CODE QUALITY STAGE COMPLETE!'
                echo 'Results: http://localhost:9000'
            }
        }
    }
    
    post {
        success {
            echo '🎉 BUILD + TEST + CODE QUALITY SUCCESSFUL!'
        }
        failure {
            echo '❌ PIPELINE FAILED!'
        }
    }
}