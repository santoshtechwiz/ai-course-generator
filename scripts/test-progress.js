const { validateCourseProgress } = require('../schema/progress-schema.ts');

// Test data
const testProgressData = {
  currentChapterId: "1",
  videoId: "test-video-123",
  progress: 75,
  completedChapters: [1, 2],
  isCompleted: false,
  playedSeconds: 300,
  duration: 600
};

console.log('Testing progress validation...');

try {
  const validated = validateCourseProgress(testProgressData);
  console.log('✅ Validation passed:', validated);
} catch (error) {
  console.error('❌ Validation failed:', error.message);
}

// Test invalid data
const invalidData = {
  currentChapterId: "invalid",
  progress: 150, // Invalid: should be 0-100
  playedSeconds: -10 // Invalid: should be >= 0
};

console.log('\nTesting invalid data...');

try {
  const validated = validateCourseProgress(invalidData);
  console.log('❌ Should have failed but passed:', validated);
} catch (error) {
  console.log('✅ Correctly caught validation error:', error.message);
}

console.log('\nProgress validation tests completed!');