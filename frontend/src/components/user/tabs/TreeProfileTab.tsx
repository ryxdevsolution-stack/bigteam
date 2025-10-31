import React, { useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import MLMTree from '../../../pages/user/MLMTree';
import UserProfile from '../../../pages/user/Profile';

const TreeProfileTab: React.FC = () => {
  const {
    fetchMlmTree,
    fetchUserProfile
  } = useData();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
      fetchMlmTree(user.id);
      fetchUserProfile(user.id);
    }
  }, [user.id, fetchMlmTree, fetchUserProfile]);

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <UserProfile />

      {/* MLM Tree Section */}
      <MLMTree />
    </div>
  );
};

export default TreeProfileTab;
