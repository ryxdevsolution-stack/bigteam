import React, { useState, useEffect } from 'react';
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
  MessageCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [areaChartData, setAreaChartData] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [engagementBarData, setEngagementBarData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalPosts: 0,
    engagementRate: 0,
    adRevenue: 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalComments: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch posts for content metrics
      const postsResponse = await api.get('/api/posts');
      const posts = postsResponse.data || [];

      // Calculate metrics from real data
      const videoCount = posts.filter((p: any) => p.media_type === 'video').length;
      const imageCount = posts.filter((p: any) => p.media_type === 'image').length;

      // Set real data or empty arrays
      setBarChartData(
        posts.length > 0
          ? [
              { name: 'Videos', value: videoCount, color: '#f97316' },
              { name: 'Images', value: imageCount, color: '#f7931a' }
            ]
          : []
      );

      // Empty data for charts that need API endpoints
      setAreaChartData([]);
      setPieChartData([]);
      setEngagementBarData([]);
      setTableData([]);

      // Set metrics from real data
      setMetrics({
        totalUsers: 0, // Need users API endpoint
        totalPosts: posts.length,
        engagementRate: 0,
        adRevenue: 0,
        totalViews: posts.reduce((acc: number, p: any) => acc + (p.views_count || 0), 0),
        totalLikes: posts.reduce((acc: number, p: any) => acc + (p.likes_count || 0), 0),
        totalShares: posts.reduce((acc: number, p: any) => acc + (p.shares_count || 0), 0),
        totalComments: 0
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set all to empty on error
      setBarChartData([]);
      setAreaChartData([]);
      setPieChartData([]);
      setEngagementBarData([]);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const tableColumns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A'
    },
    { key: 'user', label: 'User', sortable: true },
    { key: 'content', label: 'Content Type' },
    {
      key: 'engagement',
      label: 'Engagement',
      render: (value: number) => (
        <span className="text-accent-orange dark:text-accent-gold font-medium">
          {value ? value.toLocaleString() : 0}
        </span>
      )
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (value: number) => (
        <span className="text-accent-bitcoin dark:text-accent-gold">
          ${value ? value.toFixed(2) : '0.00'}
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
          {value || 'Inactive'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-bitcoin" />
          <p className="text-dark-600 dark:text-dark-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
          value={metrics.totalUsers}
          change={0}
          trend="up"
          icon={<Users className="w-5 h-5 text-accent-bitcoin" />}
          sparkline={[]}
          delay={0}
        />
        <MetricCard
          title="Total Posts"
          value={metrics.totalPosts}
          change={0}
          trend="up"
          icon={<FileVideo className="w-5 h-5 text-accent-orange" />}
          sparkline={[]}
          delay={0.1}
        />
        <MetricCard
          title="Engagement Rate"
          value={metrics.engagementRate}
          suffix="%"
          change={0}
          trend="up"
          icon={<TrendingUp className="w-5 h-5 text-accent-gold" />}
          sparkline={[]}
          delay={0.2}
        />
        <MetricCard
          title="Ad Revenue"
          value={metrics.adRevenue}
          prefix="$"
          change={0}
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-accent-amber" />}
          sparkline={[]}
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
          {areaChartData.length > 0 ? (
            <AreaChart
              data={areaChartData}
              dataKeys={[
                { key: 'users', color: '#f7931a', name: 'Users' },
                { key: 'engagement', color: '#f97316', name: 'Engagement' },
              ]}
              height={300}
              showGrid={false}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-dark-500">
              No data available
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="User Distribution"
          subtitle="By device type"
          delay={0.5}
        >
          {pieChartData.length > 0 ? (
            <PieChart
              data={pieChartData}
              height={300}
              donut={true}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-dark-500">
              No data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard
          title="Content Performance"
          subtitle="Total content by type"
          delay={0.6}
        >
          {barChartData.length > 0 ? (
            <BarChart
              data={barChartData}
              height={250}
              showGrid={false}
            />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-dark-500">
              No content available
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Weekly Engagement"
          subtitle="User interactions this week"
          delay={0.7}
        >
          {engagementBarData.length > 0 ? (
            <BarChart
              data={engagementBarData}
              height={250}
              gradient={true}
              showGrid={false}
            />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-dark-500">
              No engagement data available
            </div>
          )}
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
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">
                {metrics.totalViews > 0 ? metrics.totalViews.toLocaleString() : '0'}
              </p>
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
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">
                {metrics.totalLikes > 0 ? metrics.totalLikes.toLocaleString() : '0'}
              </p>
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
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">
                {metrics.totalShares > 0 ? metrics.totalShares.toLocaleString() : '0'}
              </p>
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
              <p className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">
                {metrics.totalComments > 0 ? metrics.totalComments.toLocaleString() : '0'}
              </p>
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