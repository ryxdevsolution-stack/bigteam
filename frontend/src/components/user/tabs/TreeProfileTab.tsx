import React, { useEffect } from 'react';
import { useData } from '../../../contexts/DataContext';
import TeamStructure from '../../../pages/user/TeamStructure';
import UserProfile from '../../../pages/user/Profile';

const TreeProfileTab: React.FC = () => {
  const {
    fetchTeamTree,
    fetchUserProfile
  } = useData();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
      fetchTeamTree(user.id);
      fetchUserProfile(user.id);
    }
  }, [user.id, fetchTeamTree, fetchUserProfile]);

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <UserProfile />

      {/* Team Structure Section */}
      <TeamStructure />
    </div>
  );
};

export default TreeProfileTab;
