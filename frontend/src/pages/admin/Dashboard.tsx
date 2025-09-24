import React from 'react';
import MetricCard from '../../components/dashboard/Cards/MetricCard';
import ChartCard from '../../components/dashboard/Cards/ChartCard';
import AreaChart from '../../components/dashboard/Charts/AreaChart';
import BarChart from '../../components/dashboard/Charts/BarChart';
import PieChart from '../../components/dashboard/Charts/PieChart';
import DataTable from '../../components/dashboard/Tables/DataTable';
import {
  Users,
  FileVideo,
  TrendingUp,
  DollarSign,
  Eye,
  Heart,
  Share2,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  // Sample data - replace with real API data
  const areaChartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString(),
      users: Math.floor(Math.random() * 5000) + 20000,
      engagement: Math.floor(Math.random() * 3000) + 15000,
      posts: Math.floor(Math.random() * 1000) + 5000,
      revenue: Math.floor(Math.random() * 2000) + 8000,
    };
  });

  const barChartData = [
    { name: 'Videos', value: 234879, color: '#f97316' },
    { name: 'Images', value: 142356, color: '#f7931a' },
    { name: 'Stories', value: 98234, color: '#fbbf24' },
    { name: 'Reels', value: 187654, color: '#f59e0b' },
    { name: 'Live', value: 54321, color: '#fb923c' },
  ];

  const pieChartData = [
    { name: 'Mobile', value: 45234, color: '#f97316' },
    { name: 'Desktop', value: 32156, color: '#f7931a' },
    { name: 'Tablet', value: 12890, color: '#fbbf24' },
    { name: 'Smart TV', value: 8720, color: '#f59e0b' },
  ];

  const engagementBarData = [
    { name: 'Mon', value: 4500, color: '#f97316' },
    { name: 'Tue', value: 5200, color: '#f97316' },
    { name: 'Wed', value: 4800, color: '#f7931a' },
    { name: 'Thu', value: 6100, color: '#f7931a' },
    { name: 'Fri', value: 7200, color: '#fbbf24' },
    { name: 'Sat', value: 8500, color: '#f59e0b' },
    { name: 'Sun', value: 9200, color: '#f59e0b' },
  ];

  const tableColumns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy')
    },
    { key: 'user', label: 'User', sortable: true },
    { key: 'content', label: 'Content Type' },
    {
      key: 'engagement',
      label: 'Engagement',
      render: (value: number) => (
        <span className="text-accent-orange dark:text-accent-gold font-medium">
          {value.toLocaleString()}
        </span>
      )
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (value: number) => (
        <span className="text-accent-bitcoin dark:text-accent-gold">
          ${value.toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'Active'
            ? 'bg-accent-bitcoin/20 text-accent-orange dark:text-accent-gold'
            : 'bg-dark-200 dark:bg-dark-700 text-dark-600 dark:text-dark-400'
        }`}>
          {value}
        </span>
      )
    }
  ];

  const tableData = Array.from({ length: 50 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString(),
    user: `User${Math.floor(Math.random() * 1000)}`,
    content: ['Video', 'Image', 'Story', 'Reel'][Math.floor(Math.random() * 4)],
    engagement: Math.floor(Math.random() * 10000),
    revenue: Math.random() * 1000,
    status: Math.random() > 0.3 ? 'Active' : 'Inactive'
  }));

  const sparklineData = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white mb-2">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-dark-600 dark:text-dark-400">Welcome back! Here's what's happening with BigTeam today.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Total Users"
          value={234879}
          change={24.78}
          trend="up"
          icon={<Users className="w-5 h-5 text-accent-bitcoin" />}
          sparkline={sparklineData}
          delay={0}
        />
        <MetricCard
          title="Total Posts"
          value={142356}
          change={12.5}
          trend="up"
          icon={<FileVideo className="w-5 h-5 text-accent-orange" />}
          sparkline={sparklineData.map(v => v * 0.8)}
          delay={0.1}
        />
        <MetricCard
          title="Engagement Rate"
          value={68.5}
          suffix="%"
          change={-5.2}
          trend="down"
          icon={<TrendingUp className="w-5 h-5 text-accent-gold" />}
          sparkline={sparklineData.map(v => v * 1.2)}
          delay={0.2}
        />
        <MetricCard
          title="Ad Revenue"
          value={54879}
          prefix="$"
          change={32.1}
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-accent-amber" />}
          sparkline={sparklineData.map(v => v * 0.6)}
          delay={0.3}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <ChartCard
          title="User Growth & Engagement"
          subtitle="Last 30 days performance"
          className="lg:col-span-2"
          delay={0.4}
        >
          <AreaChart
            data={areaChartData}
            dataKeys={[
              { key: 'users', color: '#f7931a', name: 'Users' },
              { key: 'engagement', color: '#f97316', name: 'Engagement' },
            ]}
            height={300}
            showGrid={false}
          />
        </ChartCard>

        <ChartCard
          title="User Distribution"
          subtitle="By device type"
          delay={0.5}
        >
          <PieChart
            data={pieChartData}
            height={300}
            donut={true}
          />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard
          title="Content Performance"
          subtitle="Total content by type"
          delay={0.6}
        >
          <BarChart
            data={barChartData}
            height={250}
            showGrid={false}
          />
        </ChartCard>

        <ChartCard
          title="Weekly Engagement"
          subtitle="User interactions this week"
          delay={0.7}
        >
          <BarChart
            data={engagementBarData}
            height={250}
            gradient={true}
            showGrid={false}
          />
        </ChartCard>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-glass-light backdrop-blur-xl border border-light-300 dark:border-dark-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 rounded-lg bg-accent-bitcoin/20">
              <Eye className="w-4 sm:w-5 h-4 sm:h-5 text-accent-bitcoin" />
            </div>
            <div>
              <p className="text-xs text-dark-600 dark:text-dark-400">Total Views</p>
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">1.2M</p>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-glass-light backdrop-blur-xl border border-light-300 dark:border-dark-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 rounded-lg bg-accent-orange/20">
              <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-accent-orange" />
            </div>
            <div>
              <p className="text-xs text-dark-600 dark:text-dark-400">Total Likes</p>
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">542K</p>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-glass-light backdrop-blur-xl border border-light-300 dark:border-dark-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 rounded-lg bg-accent-gold/20">
              <Share2 className="w-4 sm:w-5 h-4 sm:h-5 text-accent-gold" />
            </div>
            <div>
              <p className="text-xs text-dark-600 dark:text-dark-400">Total Shares</p>
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">234K</p>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-glass-light backdrop-blur-xl border border-light-300 dark:border-dark-800 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-2 rounded-lg bg-accent-amber/20">
              <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5 text-accent-amber" />
            </div>
            <div>
              <p className="text-xs text-dark-600 dark:text-dark-400">Comments</p>
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">89.2K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        title="Recent Activity"
        columns={tableColumns}
        data={tableData}
        itemsPerPage={10}
      />
    </div>
  );
};

export default Dashboard;