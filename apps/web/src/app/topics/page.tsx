// apps/web/src/app/topics/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, removeToken, isTokenValid } from '../../utils/auth';
import { 
  calculateBadgeProgress, 
  Topic,
  Badge
} from '@unity-voice/types';

interface TopicWithProgress extends Topic {
  progress?: {
    level: number;
    earnedScore: number;
    isCompleted: boolean;
  };
}

export default function TopicsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [nextBadge, setNextBadge] = useState<Badge | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user data
        const userResponse = await fetch('/api/user-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }

        // Fetch topic
        const topicResponse = await fetch('/api/topics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!topicResponse.ok) {
          throw new Error('Failed to fetch topic');
        }

        // Fetch user topic progress
        const progressResponse = await fetch('/api/user-topic-progress', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!progressResponse.ok) {
          throw new Error('Failed to fetch topic progress');
        }

        const userDataResponse = await userResponse.json();
        const topicResponseData = await topicResponse.json();
        const progressResponseData = await progressResponse.json();

        // Add debugging to understand the structure
        console.log('User data structure:', userDataResponse);
        console.log('Topics data structure:', topicResponseData);
        console.log('Progress data structure:', progressResponseData);

        // Extract the actual arrays from the response objects with null checks
        const userData = userDataResponse?.data;
        const topicData = Array.isArray(topicResponseData?.data) ? topicResponseData.data : [];

        if (!topicData || topicData.length === 0) {
          console.warn('No topic data available');
          setTopics([]);
          return;
        }

        // Handle potential different structures for progress data
        let userTopicProgress: Array<{
          topicName?: string;
          currentLevel?: number;
          level?: number;
          earnedScore?: number;
          completed?: boolean;
        }> = [];
        if (progressResponseData.data) {
          // If data is an array, use it directly
          if (Array.isArray(progressResponseData.data)) {
            userTopicProgress = progressResponseData.data;
          } 
          // If data has a topic property that's an array, use that
          else if (progressResponseData.data.topic && Array.isArray(progressResponseData.data.topic)) {
            userTopicProgress = progressResponseData.data.topic;
          }
          // If data itself is an object with topic IDs as keys
          else if (typeof progressResponseData.data === 'object') {
            userTopicProgress = Object.values(progressResponseData.data);
          }
        }

        // Map progress to topic with additional error handling
        const topicWithProgress = topicData.map((topic: Topic) => {
          try {
            // Check if userTopicProgress is an array before using find
            const progress = Array.isArray(userTopicProgress) 
              ? userTopicProgress.find((p) => p.topicName === topic.topicName)
              : null;
              
            return {
              ...topic,
              progress: progress ? {
                level: progress.currentLevel || progress.level || 1,
                earnedScore: progress.earnedScore || 0,
                isCompleted: progress.completed || false
              } : undefined
            };
          } catch (err) {
            console.error('Error mapping progress for topic:', topic.topicName, err);
            return topic; // Return topic without progress if there's an error
          }
        });

        // Add debugging to understand the structure
        console.log('User data after extraction:', userData);
        console.log('Topics data after extraction:', topicData);
        console.log('Progress data after extraction:', userTopicProgress);

        setUserData(userData);
        setTopics(topicWithProgress);

        // Calculate next badge
        if (userData && userData.totalScore !== undefined) {
          const badgeProgress = calculateBadgeProgress(userData.totalScore);
          setNextBadge(badgeProgress.nextBadge);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTopicClick = (topic: TopicWithProgress) => {
    if (topic.progress?.level) {
      router.push(`/topics/${topic.topicName}/tasks/flashcard?level=${topic.progress.level}`);
    } else {
      // Start from level 1 if no progress
      router.push(`/topics/${topic.topicName}/tasks/flashcard?level=1`);
    }
  };

  // If loading, return loading view
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If error, return error view
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      {/* User Badge Card (Top Right) */}
      {userData && (
        <div className="absolute top-20 right-4 bg-white p-4 rounded-2xl shadow-lg w-80">
          <h3 className="text-lg font-semibold mb-2">Your Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Score:</span>
              <span className="font-medium">{userData.totalScore || 0}</span>
            </div>
            {nextBadge && (
              <div className="flex justify-between">
                <span>Next Badge:</span>
                <span className="font-medium">{nextBadge.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* English Level Badge (Top Left) */}
      {userData && (
        <div className="absolute top-20 left-4 bg-white p-2 rounded-2xl shadow-lg">
          <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
            English: {userData.englishLevel.charAt(0).toUpperCase() + userData.englishLevel.slice(1)}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Choose Your Topic
        </h1>

        {/* Gamification Stats Row */}
        {userData && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-blue-600">{userData.totalScore || 0}</div>
              <div className="text-gray-600">Total Score</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-green-600">{userData.badges?.length || 0}</div>
              <div className="text-gray-600">Badges Earned</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-purple-600">{topics.filter(t => t.progress?.isCompleted).length}</div>
              <div className="text-gray-600">Topics Completed</div>
            </div>
          </div>
        )}
        
        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map((topic) => (
            <div
              key={topic.topicName}
              onClick={() => handleTopicClick(topic)}
              className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl">{topic.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">{topic.topicName}</h3>
              <p className="text-gray-600 text-center mb-4">{topic.topicHe}</p>
              {topic.progress && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Level</span>
                    <span>{topic.progress.level}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${(topic.progress.earnedScore / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Home Navigation */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300">
          <span className="text-2xl">🏠</span>
        </Link>
      </div>
    </div>
  );
}