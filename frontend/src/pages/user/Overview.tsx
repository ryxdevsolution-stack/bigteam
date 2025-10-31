import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Video, Image, Calendar, Network } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import HomeTab from '../../components/user/tabs/HomeTab';
import VideoTab from '../../components/user/tabs/VideoTab';
import PhotoTab from '../../components/user/tabs/PhotoTab';
import MeetingsTab from '../../components/user/tabs/MeetingsTab';
import TreeProfileTab from '../../components/user/tabs/TreeProfileTab';

type TabType = 'home' | 'video' | 'photo' | 'meetings' | 'tree-profile';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const Overview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const { fetchHomeData } = useData();

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const tabs: TabConfig[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'photo', label: 'Photo', icon: Image },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'tree-profile', label: 'Tree & Profile', icon: Network },
  ];

  const handleSeeMoreVideos = () => {
    setActiveTab('video');
  };

  const handleSeeMorePhotos = () => {
    setActiveTab('photo');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab onSeeMoreVideos={handleSeeMoreVideos} onSeeMorePhotos={handleSeeMorePhotos} />;
      case 'video':
        return <VideoTab />;
      case 'photo':
        return <PhotoTab />;
      case 'meetings':
        return <MeetingsTab />;
      case 'tree-profile':
        return <TreeProfileTab />;
      default:
        return <HomeTab onSeeMoreVideos={handleSeeMoreVideos} onSeeMorePhotos={handleSeeMorePhotos} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Tab Navigation - Sticky */}
      <div className="sticky top-0 z-30 bg-white dark:bg-dark-900 shadow-md mb-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-shrink-0 flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold transition-all relative
                    ${isActive
                      ? 'text-accent-bitcoin dark:text-accent-gold'
                      : 'text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-accent-bitcoin dark:text-accent-gold' : ''}`} />
                  <span className="text-sm sm:text-base whitespace-nowrap">{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-accent-bitcoin to-accent-orange"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-full mx-auto px-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Overview;
