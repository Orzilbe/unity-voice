'use client';

import { Topic } from '../types/topic';

interface TopicCardProps {
  topic: Topic;
  onSelect: () => void;
}

export default function TopicCard({ topic, onSelect }: TopicCardProps) {
  const progress = topic.lessons > 0 
    ? Math.round((topic.completedLessons / topic.lessons) * 100) 
    : 0;

  return (
    <div 
      onClick={onSelect}
      className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
          {topic.icon}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{topic.title.en}</h3>
          <p className="text-lg text-gray-600">{topic.title.he}</p>
        </div>

        <div className="w-full">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between w-full text-sm text-gray-600">
          <span className="capitalize">{topic.difficulty}</span>
          <span>{topic.completedLessons}/{topic.lessons} lessons</span>
        </div>
      </div>
    </div>
  );
} 