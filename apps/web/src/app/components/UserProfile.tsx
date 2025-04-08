'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  fullName: string;
  email: string;
  phoneNumber: string;
  englishLevel: string;
}

interface UserProfileProps {
  isVisible?: boolean;
  onClose?: () => void;
  showIcon?: boolean;
}

const UserProfile = ({ isVisible = false, onClose, showIcon = true }: UserProfileProps) => {
  const [showProfile, setShowProfile] = useState(isVisible);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // עדכון מצב showProfile כאשר isVisible משתנה
  useEffect(() => {
    setShowProfile(isVisible);
  }, [isVisible]);

  // טעינת נתוני משתמש - בפרויקט אמיתי יטען מה-API
  useEffect(() => {
    const fetchUserData = () => {
      setIsLoading(true);
      
      // בהמשך, כאן תהיה קריאה אמיתית לשרת
      // לצורך דוגמה, משתמשים בנתונים סטטיים עם השהייה מלאכותית
      setTimeout(() => {
        const mockUser: User = {
          fullName: "John Doe",
          email: "johndoe@example.com",
          phoneNumber: "123-456-7890",
          englishLevel: "Intermediate"
        };
        
        setUserData(mockUser);
        setIsLoading(false);
      }, 300);
    };
    
    if (showProfile) {
      fetchUserData();
    }
  }, [showProfile]);

  const toggleProfile = () => {
    const newState = !showProfile;
    setShowProfile(newState);
    
    // אם סוגרים וקיים פונקציית onClose, נקרא לה
    if (!newState && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* אייקון פרופיל משתמש - מוצג רק אם showIcon הוא true */}
      {showIcon && (
        <div className="absolute top-4 right-4">
          <div 
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            onClick={toggleProfile}
          >
            <span className="text-2xl">👤</span>
          </div>
        </div>
      )}

      {/* חלונית פרופיל */}
      {showProfile && (
        <div className="absolute top-20 right-4 bg-white p-6 shadow-2xl rounded-2xl w-80 z-50 border border-gray-100 transform transition-all duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Profile</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : userData ? (
            <div className="space-y-3 text-gray-800">
              <p><strong>Name:</strong> {userData.fullName}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Phone:</strong> {userData.phoneNumber}</p>
              <p><strong>English Level:</strong> {userData.englishLevel}</p>
            </div>
          ) : (
            <p className="text-red-500">Failed to load user data</p>
          )}
          
          <div className="mt-6 space-y-2">
            <button
              className="w-full py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              onClick={() => router.push('/edit-profile')}
            >
              Edit Profile
            </button>
            <button
              className="w-full py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              onClick={toggleProfile}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;