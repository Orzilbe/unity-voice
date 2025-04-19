// apps/web/src/pages/test-api-simple.tsx
import { useEffect, useState } from 'react';
import { fetchFlashcards, fetchLearnedWords } from '../utils/api';

export default function TestAPISimple() {
  const [flashcards, setFlashcards] = useState([]);
  const [learnedWords, setLearnedWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runTests() {
    setLoading(true);
    setError(null);
    
    try {
      // Test flashcards
      const cards = await fetchFlashcards('Holocaust and Revival', 1);
      setFlashcards(cards);
      
      // Test learned words
      const words = await fetchLearnedWords('Holocaust and Revival');
      setLearnedWords(words);
    } catch (err) {
      setError(err.message);
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple API Test</h1>
      <button 
        onClick={runTests}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Run Tests'}
      </button>
      
      {error && (
        <div style={{ margin: '20px 0', padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <h2>Flashcards ({flashcards.length})</h2>
        {flashcards.length > 0 ? (
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(flashcards.slice(0, 2), null, 2)}
          </pre>
        ) : (
          <p>No flashcards found</p>
        )}
        
        <h2>Learned Words ({learnedWords.length})</h2>
        {learnedWords.length > 0 ? (
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(learnedWords.slice(0, 2), null, 2)}
          </pre>
        ) : (
          <p>No learned words found</p>
        )}
      </div>
    </div>
  );
}