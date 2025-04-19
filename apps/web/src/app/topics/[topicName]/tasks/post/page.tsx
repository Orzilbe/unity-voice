// apps/web/src/app/topics/[topicName]/tasks/post/page.tsx

'use client';

import React from 'react';
import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { FaHeart, FaComment, FaShare, FaInfoCircle } from 'react-icons/fa';

interface Message {
  id: number;
  role: string;
  content: string;
}

const Page: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const topicName = params?.topicName as string;
  
  const [post, setPost] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [metrics, setMetrics] = useState({
    likes: 500,
    shares: 25,
  });
  const [isLiked, setIsLiked] = useState(false);
  const [requiredWords, setRequiredWords] = useState<string[]>([]);

  const userProfile = {
    fullName: 'John Doe',
    email: 'johndoe@example.com',
    phoneNumber: '123-456-7890',
    birthDate: '1990-01-01',
    englishLevel: 'Intermediate',
  };

  // Dynamically define context checks based on requiredWords
  const generateContextChecks = (words: string[]) => {
    return words.map(word => ({
      word,
      patterns: [
        `${word.toLowerCase()}.*(?:is|are|was|were|has|have|had)`,
        `(?:use|using|used).*${word.toLowerCase()}`
      ]
    }));
  };

  const [contextChecks, setContextChecks] = useState<any[]>([]);

  const fetchDynamicPost = async () => {
    try {
      const response = await fetch(`/api/create-post/${encodeURIComponent(topicName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // You can add any additional data here if needed
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.text) {
        setPost(data.text);
      } else {
        throw new Error('No text in response');
      }
      
      // Set required words from the API response if available
      if (data.requiredWords && Array.isArray(data.requiredWords) && data.requiredWords.length > 0) {
        setRequiredWords(data.requiredWords);
        setContextChecks(generateContextChecks(data.requiredWords));
      }
    } catch (error) {
      console.error('Error:', error);
      setPost('Failed to load post. Please refresh to try again.');
      
      // Fallback required words if the API fails
      const fallbackWords = ['Israel', 'Culture', 'History', 'Innovation', 'Development'];
      setRequiredWords(fallbackWords);
      setContextChecks(generateContextChecks(fallbackWords));
    }
  };

  useEffect(() => {
    fetchDynamicPost();
    
    // Choose a relevant image based on the topic name
    const topicImages: Record<string, string> = {
      'diplomacy': 'https://cdn.pixabay.com/photo/2018/08/14/13/25/flag-3605386_1280.jpg',
      'economy': 'https://cdn.pixabay.com/photo/2017/09/07/08/54/money-2724241_1280.jpg',
      'innovation': 'https://cdn.pixabay.com/photo/2018/04/06/10/59/team-3295405_1280.jpg',
      'history': 'https://cdn.pixabay.com/photo/2014/12/15/13/40/jerusalem-569525_1280.jpg',
      'holocaust': 'https://cdn.pixabay.com/photo/2018/08/16/11/19/star-of-david-3610129_1280.jpg',
      'iron': 'https://www.economist.com/cdn-cgi/image/width=834,quality=80,format=auto/content-assets/images/20231021_FBP501.jpg',
      'society': 'https://cdn.pixabay.com/photo/2016/11/14/03/35/tel-aviv-1822624_1280.jpg'
    };
    
    // Find a matching image or use default
    const lowerTopicName = topicName.toLowerCase();
    let matchedImage = null;
    
    for (const [key, url] of Object.entries(topicImages)) {
      if (lowerTopicName.includes(key)) {
        matchedImage = url;
        break;
      }
    }
    
    setImageUrl(matchedImage || 'https://cdn.pixabay.com/photo/2016/11/14/03/35/tel-aviv-1822624_1280.jpg');
    
    setMetrics({
      likes: Math.floor(Math.random() * 1000 + 100),
      shares: Math.floor(Math.random() * 50 + 5),
    });
  }, [topicName]);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    let totalScore = 0;
    const feedback: string[] = [];
    
    // 1. בהירות המסר (0-50 נקודות)
    let clarityScore = 0;
    const sentences = input.split(/[.!?]+/).filter(s => s.trim());
    const wordCount = input.split(/\s+/).length;
    
    // בדיקת אורך התשובה
    if (wordCount >= 50) clarityScore += 20;
    else if (wordCount >= 30) clarityScore += 15;
    else if (wordCount >= 20) clarityScore += 10;
    else clarityScore += 5;
    
    // בדיקת מבנה המשפטים
    const avgSentenceLength = wordCount / sentences.length;
    if (avgSentenceLength >= 8 && avgSentenceLength <= 15) clarityScore += 20;
    else if (avgSentenceLength >= 5) clarityScore += 10;
    
    // בדיקת קוהרנטיות
    const hasIntroduction = sentences[0]?.length > 20;
    const hasConclusion = sentences[sentences.length - 1]?.length > 20;
    if (hasIntroduction) clarityScore += 5;
    if (hasConclusion) clarityScore += 5;

    totalScore += clarityScore;
    feedback.push(`Clarity of the message: ${clarityScore}/50 Points
${clarityScore >= 40 ? "✨" : clarityScore >= 30 ? "👍" : "💡"} ${
      clarityScore >= 40 ? "Excellent! The message is clear and well organized" :
      clarityScore >= 30 ? "Good! The message is clear, but there is room for improvement in the structure." :
      "It is worth working on the organization of ideas and the structure of sentences."
    }`);

    // 2. דיוק דקדוקי (0-50 נקודות)
    let grammarScore = 0;
    const hebrewLetters = /[\u0590-\u05FF]/;
    const englishLetters = /[a-zA-Z]/;
    const numbers = /\d/;
    
    // בדיקת שימוש נכון בשפה
    const hasProperLanguageMix = !sentences.some(s => 
      hebrewLetters.test(s) && englishLetters.test(s)
    );
    if (hasProperLanguageMix) grammarScore += 20;

    // בדיקת סימני פיסוק
    const properPunctuation = input.match(/[.!?][\s\n]+[A-Z\u0590-\u05FF]/g)?.length || 0;
    grammarScore += Math.min(20, properPunctuation * 5);

    // בדיקת רווחים
    const properSpacing = !input.match(/[\u0590-\u05FF]{1,}[a-zA-Z]{1,}/);
    if (properSpacing) grammarScore += 10;

    totalScore += grammarScore;
    feedback.push(`Grammatical accuracy: ${grammarScore}/50 Points
${grammarScore >= 40 ? "✨" : grammarScore >= 30 ? "👍" : "💡"} ${
  grammarScore >= 40 ? "Excellent! The grammar is very accurate" :
  grammarScore >= 30 ? "Good! There are a few small points for improvement" :
  "You should pay more attention to grammar and punctuation rules"
    }`);

    // 3. שימוש במילים שנלמדו (0-50 נקודות)
    let vocabularyScore = 0;
    const usedWords: string[] = [];

    requiredWords.forEach((word) => {
      const wordRegex = new RegExp(word, 'i');
      if (input.match(wordRegex)) {
        const contextCheck = contextChecks.find(check => check.word === word);
        const hasGoodContext = contextCheck?.patterns.some((pattern: string) => 
          new RegExp(pattern, 'i').test(input)
        );
        
        if (hasGoodContext) {
          vocabularyScore += 10;
          usedWords.push(`✨ The word "${word}" was included in a great context!`);
        } else {
          vocabularyScore += 5;
          usedWords.push(`✓ The word "${word}" appeared, but the context should be improved`);
        }
      } else {
        usedWords.push(`❌ The word "${word}" was not included in the answer`);
      }
    });
          
    totalScore += vocabularyScore;
    feedback.push(`Usage of learned words: ${vocabularyScore}/50 points
${usedWords.join('\n')}`);

    // חישוב ציון סופי והצגת משוב
    const finalScore = Math.min(150, Math.round(totalScore));
    const getFeedbackMessage = (score: number) => {
      if (score >= 120) return "Excellent work! Your answer is very comprehensive and precise! 🌟";
      if (score >= 90) return "Well done! Very good answer! ✨";
      if (score >= 60) return "Good! There are a few points for improvement 👍";
      return "Keep practicing and improving! 💪";
    };

    setMessages(prev => [
      ...prev,
      { 
        id: prev.length + 1, 
        role: 'user', 
        content: input 
      },
      {
        id: prev.length + 2,
        role: 'assistant',
        content: `Your Score: ${finalScore}/150\n\n${feedback.join('\n\n')}\n\n${getFeedbackMessage(finalScore)}`
      }
    ]);

    setCommentCount(prev => prev + 1);
    setInput('');
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    setMetrics(prev => ({
      ...prev,
      likes: prev.likes + (isLiked ? -1 : 1)
    }));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Profile Button */}
      <div className="absolute top-4 right-4">
        <button
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          onClick={() => setShowProfile(!showProfile)}
        >
          👤
        </button>
      </div>

      {/* Home Link */}
      <div className="absolute top-4 left-4">
        <Link
          href="/topics"
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="text-2xl">🏠</span>
        </Link>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="absolute top-20 right-4 bg-white p-6 shadow-2xl rounded-2xl w-80 z-50 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Profile</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{userProfile.fullName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{userProfile.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium text-gray-900">{userProfile.phoneNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">English Level:</span>
              <span className="font-medium text-orange-600">{userProfile.englishLevel}</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300"
            >
              Logout
            </button>
            <button
              className="w-full py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all duration-300"
              onClick={() => setShowProfile(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto mt-16">
        {/* Post Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">
              👤
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Israel Expert</h2>
              <p className="text-gray-600 text-sm font-medium">2 hours ago • 🌍</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="prose text-gray-800 md:w-3/5">
              {post || 'Loading post...'}
            </div>
            <div className="md:w-2/5">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Post Image"
                  className="w-full rounded-lg object-cover h-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Israeli+Culture';
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-12 text-gray-600">
            <button 
              onClick={handleLikeClick}
              className="flex items-center space-x-2 hover:text-red-500 transition-colors"
            >
              <FaHeart className={isLiked ? 'text-red-500' : ''} />
              <span>{metrics.likes}</span>
            </button>
            <div className="flex items-center space-x-2">
              <FaComment />
              <span>{commentCount}</span>
            </div>
            <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
              <FaShare />
              <span>{metrics.shares}</span>
            </button>
          </div>
        </div>

        {/* Required Words Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaInfoCircle className="text-orange-500 mr-3 text-xl" />
            <h3 className="text-xl font-bold text-gray-800">Required Words:</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {requiredWords.map(word => (
              <span key={word} className="px-6 py-3 bg-orange-500 text-white rounded-full text-base font-medium shadow-sm">
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleReplySubmit} className="mb-8">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Write your response about ${topicName} using the required words...`}
              className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-32 text-gray-900"
            />
            <button
              type="submit"
              className="mt-4 w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Submit Response
            </button>
          </form>

          <div className="space-y-6">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`p-6 rounded-lg ${
                  message.role === 'user' ? 'bg-gray-50' : 'bg-orange-50'
                }`}
              >
                <p className="font-semibold text-gray-900 mb-3">
                  {message.role === 'user' ? 'Your Response:' : 'Feedback:'}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Challenge Button */}
        {messages.length > 0 && (
          <div className="mt-4 text-center">
            <Link href={`/topics/${topicName}/conversation`}>
              <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                Next Challenge →
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;