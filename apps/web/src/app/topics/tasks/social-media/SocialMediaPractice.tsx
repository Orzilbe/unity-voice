'use client';

import React, { useState } from 'react';
import { Topic, SocialMediaPost } from '../flashcard/types';
import { generateSocialMediaPost, analyzeSocialMediaResponse } from '../flashcard/flashcardService';

interface SocialMediaPracticeProps {
  topic: Topic;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learnedWords: string[];
  onComplete: (points: number) => void;
}

export default function SocialMediaPractice({
  topic,
  difficulty,
  learnedWords,
  onComplete
}: SocialMediaPracticeProps) {
  const [post, setPost] = useState<SocialMediaPost | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SocialMediaPost['feedback'] | null>(null);

  const generatePost = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newPost = await generateSocialMediaPost(topic, difficulty, learnedWords);
      setPost(newPost);
      setUserResponse('');
      setFeedback(null);
    } catch (error) {
      setError('Failed to generate post. Please try again.');
      console.error('Error generating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!post || !userResponse.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const analyzedPost = await analyzeSocialMediaResponse(post.id, userResponse);
      setFeedback(analyzedPost.feedback || null);
      if (analyzedPost.pointsEarned) {
        onComplete(analyzedPost.pointsEarned);
      }
    } catch (error) {
      setError('Failed to analyze response. Please try again.');
      console.error('Error analyzing response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Social Media Practice</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!post ? (
        <button
          onClick={generatePost}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Generating Post...' : 'Generate New Post'}
        </button>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Post to Respond To:</h3>
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          <div>
            <label htmlFor="response" className="block font-semibold mb-2">
              Your Response:
            </label>
            <textarea
              id="response"
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your response here..."
              disabled={isLoading || !!feedback}
            />
          </div>

          {!feedback ? (
            <button
              onClick={submitResponse}
              disabled={isLoading || !userResponse.trim()}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Analyzing Response...' : 'Submit Response'}
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Feedback:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Content Accuracy</p>
                  <p className="text-xl font-bold">{feedback.contentAccuracy}/10</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Writing Style</p>
                  <p className="text-xl font-bold">{feedback.writingStyle}/10</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Grammar</p>
                  <p className="text-xl font-bold">{feedback.grammar}/10</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Word Usage</p>
                  <p className="text-xl font-bold">{feedback.wordUsage}/10</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Detailed Feedback:</h4>
                <p className="whitespace-pre-wrap">{feedback.detailedFeedback}</p>
              </div>
              <button
                onClick={generatePost}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Another Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 