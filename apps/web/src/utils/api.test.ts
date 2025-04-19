import { fetchFlashcards, fetchLearnedWords, saveLearnedWord } from './api';

async function testEndpoints() {
  console.log('🧪 Starting API endpoint tests...');

  try {
    // Test 1: Fetch flashcards
    console.log('\n📝 Test 1: Fetching flashcards for "Holocaust and Revival"...');
    const flashcards = await fetchFlashcards('Holocaust and Revival', 1);
    console.log('Flashcards received:', flashcards.length);
    console.log('Sample flashcard:', flashcards[0]);

    // Test 2: Save a learned word
    console.log('\n📝 Test 2: Saving a learned word...');
    const wordId = flashcards[0]?._id || 'testWordId';
    const topicId = flashcards[0]?.topicId || 'testTopicId';
    const success = await saveLearnedWord(wordId, topicId);
    console.log('Word saved successfully:', success);

    // Test 3: Fetch learned words
    console.log('\n📝 Test 3: Fetching learned words for "Holocaust and Revival"...');
    const learnedWords = await fetchLearnedWords('Holocaust and Revival');
    console.log('Learned words received:', learnedWords.length);
    console.log('Sample learned word:', learnedWords[0]);

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testEndpoints(); 