import api from './api';

export interface TeamSettings {
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

export interface TeamMember {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active_member: boolean;
  activation_date: string | null;
  total_earnings: number;
}

export interface TreeData {
  user: any;
  upline: any | null;
  downline: TeamMember[];
  chain_info: {
    position: number;
    is_active: boolean;
    joined_at: string;
  } | null;
  total_team_members: number;
  active_team_members: number;
}

export interface PurchaseResult {
  purchase_id: string;
  purchase_type: string;
  amount: number;
  position: number;
  commissions_paid: any[];
  total_commission_paid: number;
}

const teamService = {
  // Get team settings (activation amount, commission rate, etc.)
  getSettings: async (): Promise<TeamSettings> => {
    const response = await api.get('/api/user/settings/team');
    return response.data.settings;
  },

  // Create purchase for activation/reactivation
  createPurchase: async (userId: string, amount: number, invitedBy?: string): Promise<PurchaseResult> => {
    const response = await api.post('/api/team/purchase', {
      user_id: userId,
      amount,
      invited_by: invitedBy
    });
    return response.data.data;
  },

  // Activate user with default activation amount
  activateUser: async (userId: string, invitedBy?: string): Promise<PurchaseResult> => {
    const response = await api.post('/api/team/activate', {
      user_id: userId,
      invited_by: invitedBy
    });
    return response.data.data;
  },

  // Get team tree for a user
  getTree: async (userId: string): Promise<TreeData> => {
    const response = await api.get(`/api/team/tree/${userId}`);
    return response.data.tree;
  },

  // Get team chain status
  getChain: async (activeOnly: boolean = false): Promise<any[]> => {
    const response = await api.get('/api/team/chain', {
      params: { active_only: activeOnly }
    });
    return response.data.chain;
  },

  // Get global team statistics
  getGlobalStats: async (): Promise<any> => {
    const response = await api.get('/api/team/stats/global');
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

export default teamService;
