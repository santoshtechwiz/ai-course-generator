/**
 * Test Script for Quiz Attempts Reset Functionality
 * 
 * This script can be run in the browser console to test the reset functionality
 * without going through the UI.
 */

async function testQuizAttemptsReset() {
  console.log('🧪 Testing Quiz Attempts Reset Functionality...\n');
  
  try {
    // 1. First, get current attempts
    console.log('📊 Fetching current quiz attempts...');
    const getResponse = await fetch('/api/user/quiz-attempts?limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!getResponse.ok) {
      throw new Error(`GET request failed: ${getResponse.status}`);
    }
    
    const currentData = await getResponse.json();
    console.log(`✅ Found ${currentData.attempts.length} attempts (Total: ${currentData.total})`);
    
    if (currentData.attempts.length > 0) {
      console.log('📝 Sample attempt:', {
        id: currentData.attempts[0].id,
        score: currentData.attempts[0].score,
        quiz: currentData.attempts[0].userQuiz?.title,
        date: currentData.attempts[0].createdAt
      });
    }
    
    // 2. Ask for confirmation
    const shouldReset = confirm(`Found ${currentData.total} quiz attempts. Do you want to reset them all? This cannot be undone!`);
    
    if (!shouldReset) {
      console.log('❌ Reset cancelled by user');
      return;
    }
    
    // 3. Perform reset
    console.log('🔄 Resetting all quiz attempts...');
    const deleteResponse = await fetch('/api/user/quiz-attempts', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!deleteResponse.ok) {
      throw new Error(`DELETE request failed: ${deleteResponse.status}`);
    }
    
    const resetResult = await deleteResponse.json();
    console.log('✅ Reset successful:', resetResult.message);
    
    // 4. Verify reset worked
    console.log('🔍 Verifying reset...');
    const verifyResponse = await fetch('/api/user/quiz-attempts?limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Verification failed: ${verifyResponse.status}`);
    }
    
    const verifyData = await verifyResponse.json();
    console.log(`✅ Verification complete: ${verifyData.attempts.length} attempts remaining (Total: ${verifyData.total})`);
    
    if (verifyData.total === 0) {
      console.log('🎉 Reset successful! All quiz attempts have been cleared.');
    } else {
      console.log('⚠️  Warning: Some attempts may still exist.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

async function testQuizAttemptsAPI() {
  console.log('🧪 Testing Quiz Attempts API Endpoints...\n');
  
  try {
    // Test GET endpoint
    console.log('📊 Testing GET /api/user/quiz-attempts...');
    const response = await fetch('/api/user/quiz-attempts?limit=3&offset=0');
    
    if (!response.ok) {
      throw new Error(`GET failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ GET request successful');
    console.log(`📈 Total attempts: ${data.total}`);
    console.log(`📝 Returned attempts: ${data.attempts.length}`);
    
    if (data.attempts.length > 0) {
      const sample = data.attempts[0];
      console.log('📋 Sample attempt structure:', {
        id: sample.id,
        score: sample.score,
        accuracy: sample.accuracy,
        timeSpent: sample.timeSpent,
        totalQuestions: sample.totalQuestions,
        correctAnswers: sample.correctAnswers,
        quiz: sample.userQuiz?.title,
        quizType: sample.userQuiz?.quizType,
        hasQuestions: sample.attemptQuestions?.length > 0,
        questionCount: sample.attemptQuestions?.length || 0
      });
    }
    
    console.log('🎉 API test completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.testQuizAttemptsReset = testQuizAttemptsReset;
  window.testQuizAttemptsAPI = testQuizAttemptsAPI;
  
  console.log('🔧 Quiz Attempts Test Functions Loaded!');
  console.log('📝 Available functions:');
  console.log('  - testQuizAttemptsAPI() - Test the GET endpoint');
  console.log('  - testQuizAttemptsReset() - Test the reset functionality');
  console.log('');
  console.log('💡 Usage: Just call testQuizAttemptsAPI() or testQuizAttemptsReset() in the console');
}
