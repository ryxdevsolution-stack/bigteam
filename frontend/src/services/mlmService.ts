import api from './api';

export interface MLMSettings {
  activation_amount: number;
  commission_rate: number;
  commission_limit: number;
  currency: string;
}

export interface Commission {
  id: string;
  payer_id: string;
  amount: number;
  commission_level: number;
  status: string;
  created_at: string;
  payer_username: string;
  payer_email: string;
}

export interface Referral {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_mlm_active: boolean;
  activation_date: string | null;
  total_earnings: number;
}

export interface TreeData {
  user: any;
  upline: any | null;
  downline: Referral[];
  chain_info: {
    position: number;
    is_active: boolean;
    joined_at: string;
  } | null;
  total_referrals: number;
  active_referrals: number;
}

export interface PurchaseResult {
  purchase_id: string;
  purchase_type: string;
  amount: number;
  position: number;
  commissions_paid: any[];
  total_commission_paid: number;
}

const mlmService = {
  // Get MLM settings (activation amount, commission rate, etc.)
  getSettings: async (): Promise<MLMSettings> => {
    const response = await api.get('/api/user/settings/mlm');
    return response.data.settings;
  },

  // Create purchase for activation/reactivation
  createPurchase: async (userId: string, amount: number, sponsoredBy?: string): Promise<PurchaseResult> => {
    const response = await api.post('/api/mlm/purchase', {
      user_id: userId,
      amount,
      sponsored_by: sponsoredBy
    });
    return response.data.data;
  },

  // Activate user with default activation amount
  activateUser: async (userId: string, sponsoredBy?: string): Promise<PurchaseResult> => {
    const response = await api.post('/api/mlm/activate', {
      user_id: userId,
      sponsored_by: sponsoredBy
    });
    return response.data.data;
  },

  // Get MLM tree for a user
  getTree: async (userId: string): Promise<TreeData> => {
    const response = await api.get(`/api/mlm/tree/${userId}`);
    return response.data.tree;
  },

  // Get MLM chain status
  getChain: async (activeOnly: boolean = false): Promise<any[]> => {
    const response = await api.get('/api/mlm/chain', {
      params: { active_only: activeOnly }
    });
    return response.data.chain;
  },

  // Check if referral code is valid
  checkReferralCode: async (referralCode: string): Promise<any> => {
    const response = await api.get(`/api/mlm/check-referral/${referralCode}`);
    return response.data;
  },

  // Get global MLM statistics
  getGlobalStats: async (): Promise<any> => {
    const response = await api.get('/api/mlm/stats/global');
    return response.data.stats;
  },

  // Get user commissions
  getUserCommissions: async (userId: string, limit: number = 50): Promise<Commission[]> => {
    const response = await api.get('/api/user/commissions', {
      params: { user_id: userId, limit }
    });
    return response.data.commissions;
  }
};

export default mlmService;
