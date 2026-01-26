/**
 * Activation History Service
 * API calls for user activation history and analytics
 */

import api from './api';

export interface ActivationRecord {
  id?: number;
  position_in_chain: number;
  package: {
    id: string | null;
    name: string;
    amount: number;
  };
  timeline: {
    activated_at: string | null;
    deactivated_at: string | null;
    days_active: number;
  };
  performance: {
    commissions_earned: number;
    purchase_type: string;
  };
  sponsor_at_activation: string | null;
  is_current: boolean;
}

export interface ActivationStatistics {
  total_activations: number;
  total_days_active?: number;
  average_days_active?: number;
  favorite_package?: string;
  last_updated?: string;
  current_package?: string;
}

export interface ActivationHistory {
  user: {
    username: string;
    email: string;
    is_active: boolean;
    commission_count: number;
    current_position: number | null;
    total_earnings: number;
    activation_date: string | null;
    sponsored_by: string | null;
  };
  activation_history: ActivationRecord[];
  statistics: ActivationStatistics;
  summary: {
    total_activations: number;
    currently_active: boolean;
    lifetime_earnings: number;
  };
}

export interface ReactivationStats {
  activation_distribution: Array<{
    activation_count: number;
    user_count: number;
  }>;
  top_reactivators: Array<{
    username: string;
    email: string;
    total_activations: number;
    total_earnings: number;
  }>;
  average_stats: {
    avg_days_active: number;
    total_days_active: number;
    total_activation_periods: number;
  };
}

export interface PackagePopularity {
  package_name: string;
  usage_count: number;
  avg_amount: number;
}

export interface ActivationTimelineEntry {
  date: string;
  total_activations: number;
  reactivations: number;
  new_activations: number;
  total_amount: number;
}

const activationHistoryService = {
  /**
   * Get activation history for a specific user
   */
  getUserActivationHistory: async (userId: string): Promise<ActivationHistory> => {
    const response = await api.get(`/api/activation-history/user/${userId}`);
    return response.data.data;
  },

  /**
   * Get activation history for the authenticated user
   */
  getMyActivationHistory: async (): Promise<ActivationHistory> => {
    const response = await api.get('/api/activation-history/my-history');
    return response.data.data;
  },

  /**
   * Get platform-wide reactivation statistics (Admin only)
   */
  getReactivationStats: async (): Promise<ReactivationStats> => {
    const response = await api.get('/api/activation-history/stats/reactivation');
    return response.data.data;
  },

  /**
   * Get package popularity statistics (Admin only)
   */
  getPackagePopularity: async (): Promise<PackagePopularity[]> => {
    const response = await api.get('/api/activation-history/stats/packages');
    return response.data.data;
  },

  /**
   * Get activation timeline (Admin only)
   */
  getActivationTimeline: async (days: number = 30): Promise<ActivationTimelineEntry[]> => {
    const response = await api.get(`/api/activation-history/timeline?days=${days}`);
    return response.data.data;
  }
};

export default activationHistoryService;
