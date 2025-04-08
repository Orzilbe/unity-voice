'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Topic, Conversation } from '../flashcard/types';
import { startConversation, continueConversation, endConversation } from '../flashcard/flashcardService';

interface InteractiveConversationProps {
  topic: Topic;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  onComplete: (points: number) => void;
}

export default function InteractiveConversation({
  topic,
  difficulty,
  onComplete
}: InteractiveConversationProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Conversation['feedback'] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.transcript]);

  const startNewConversation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newConversation = await startConversation(topic, difficulty);
      setConversation(newConversation);
      setFeedback(null);
    } catch (error) {
      setError('Failed to start conversation. Please try again.');
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!conversation || !userMessage.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const updatedConversation = await continueConversation(conversation.id, userMessage);
      setConversation(updatedConversation);
      setUserMessage('');
    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const endCurrentConversation = async () => {
    if (!conversation) return;

    setIsLoading(true);
    setError(null);
    try {
      const finalConversation = await endConversation(conversation.id);
      setConversation(finalConversation);
      setFeedback(finalConversation.feedback || null);
      if (finalConversation.pointsEarned) {
        onComplete(finalConversation.pointsEarned);
      }
    } catch (error) {
      setError('Failed to end conversation. Please try again.');
      console.error('Error ending conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Interactive Conversation</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!conversation ? (
        <button
          onClick={startNewConversation}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Starting Conversation...' : 'Start Conversation'}
        </button>
      ) : (
        <div className="space-y-6">
          <div className="h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {conversation.transcript.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {!feedback ? (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !userMessage.trim()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <button
                onClick={endCurrentConversation}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                End Conversation
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Conversation Feedback:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pronunciation</p>
                  <p className="text-xl font-bold">{feedback.pronunciation}/10</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Grammar</p>
                  <p className="text-xl font-bold">{feedback.grammar}/10</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Content Accuracy</p>
                  <p className="text-xl font-bold">{feedback.contentAccuracy}/10</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Fluency</p>
                  <p className="text-xl font-bold">{feedback.fluency}/10</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Detailed Feedback:</h4>
                <p className="whitespace-pre-wrap">{feedback.detailedFeedback}</p>
              </div>
              <button
                onClick={startNewConversation}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 