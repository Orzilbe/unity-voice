// apps/web/src/pages/direct-test.tsx
import { useEffect, useState } from 'react';
import { getToken } from '../utils/auth';

interface Flashcard {
  _id: string;
  word: string;
  translation: string;
  level: number;
  topicId: string;
}

interface LearnedWord {
  wordId: string;
  topicId: string;
  timestamp: string;
}

export default function DirectTest() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    setAuthToken(token);
  }, []);

  async function createTestData() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const token = getToken();
      if (!token) {
        setError('No authentication token found. Please log in first.');
        return;
      }

      // First, try to create a test flashcard
      console.log('Creating test flashcard...');
      const createFlashcardResponse = await fetch(
        'http://localhost:5000/api/flashcards',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            topic: 'Holocaust and Revival',
            word: 'שלום',
            translation: 'hello',
            level: 1
          })
        }
      );

      const flashcardData = await createFlashcardResponse.json();
      console.log('Create flashcard response:', flashcardData);

      if (flashcardData.success && flashcardData.data) {
        // Now try to save it as a learned word
        console.log('Saving as learned word...');
        const saveLearnedResponse = await fetch(
          'http://localhost:5000/api/learned-words',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              wordId: flashcardData.data._id,
              topicId: flashcardData.data.topicId,
              timestamp: new Date().toISOString()
            })
          }
        );

        const learnedData = await saveLearnedResponse.json();
        console.log('Save learned word response:', learnedData);

        if (learnedData.success) {
          setMessage('Test data created successfully!');
          // Refresh the data
          await runTests();
        } else {
          setError('Failed to save learned word: ' + (learnedData.error || 'Unknown error'));
        }
      } else {
        setError('Failed to create flashcard: ' + (flashcardData.error || 'Unknown error'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Test data creation error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runTests() {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const token = getToken();
      if (!token) {
        setError('No authentication token found. Please log in first.');
        return;
      }

      // Test direct backend call to flashcards
      console.log('Testing direct backend call to flashcards');
      console.log('Auth token present:', !!token);
      
      const flashcardsResponse = await fetch(
        'http://localhost:5000/api/flashcards?topic=Holocaust%20and%20Revival&level=1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Flashcards status:', flashcardsResponse.status);
      const flashcardsData = await flashcardsResponse.json();
      console.log('Flashcards response:', flashcardsData);
      setFlashcards(flashcardsData.data || []);
      
      // Test direct backend call to learned words
      console.log('Testing direct backend call to learned words');
      const learnedWordsResponse = await fetch(
        'http://localhost:5000/api/learned-words?topic=Holocaust%20and%20Revival',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Learned words status:', learnedWordsResponse.status);
      const learnedWordsData = await learnedWordsResponse.json();
      console.log('Learned words response:', learnedWordsData);
      setLearnedWords(learnedWordsData.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Direct Backend API Test</h1>
      <p className="mb-4 text-gray-600">
        This test bypasses Next.js API routes and calls the backend API directly.
      </p>

      <div className="mb-4 p-4 bg-gray-100 rounded-md">
        <h2 className="font-semibold mb-2">Authentication Status</h2>
        <p className={authToken ? 'text-green-600' : 'text-red-600'}>
          {authToken ? '✅ Authenticated' : '❌ Not authenticated'}
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <button 
          onClick={runTests}
          disabled={loading || !authToken}
          className={`px-4 py-2 rounded-md text-white ${
            loading || !authToken
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
          }`}
        >
          {loading ? 'Testing...' : !authToken ? 'Please Log In First' : 'Run Tests'}
        </button>

        <button 
          onClick={createTestData}
          disabled={loading || !authToken}
          className={`px-4 py-2 rounded-md text-white ${
            loading || !authToken
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 cursor-pointer'
          }`}
        >
          {loading ? 'Creating...' : 'Create Test Data'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {message && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      <div className="mt-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Flashcards ({flashcards.length})</h2>
          {flashcards.length > 0 ? (
            <pre className="p-4 bg-gray-100 rounded-md overflow-auto">
              {JSON.stringify(flashcards.slice(0, 2), null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No flashcards found</p>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Learned Words ({learnedWords.length})</h2>
          {learnedWords.length > 0 ? (
            <pre className="p-4 bg-gray-100 rounded-md overflow-auto">
              {JSON.stringify(learnedWords.slice(0, 2), null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No learned words found</p>
          )}
        </div>
      </div>
    </div>
  );
} 