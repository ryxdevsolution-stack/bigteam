import React, { useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import HomeTab from '../../components/user/tabs/HomeTab';

const Overview: React.FC = () => {
  const { fetchHomeData } = useData();

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  return (
    <div className="min-h-screen">
      <HomeTab />
    </div>
  );
};

export default Overview;
