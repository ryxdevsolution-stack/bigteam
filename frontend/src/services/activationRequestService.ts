/**
 * Activation Request Service
 *
 * Handles reactivation requests that require admin approval
 */

import api from './api';

export interface ActivationRequest {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  package_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  request_type: 'activation' | 'reactivation';
  requested_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  user_balance_at_request?: number;
  created_at: string;
  updated_at: string;
}

export interface PendingRequestResponse {
  success: boolean;
  has_pending: boolean;
  request: ActivationRequest | null;
}

export interface SubmitRequestResponse {
  success: boolean;
  message: string;
  request_id?: string;
  data?: ActivationRequest;
  existing_request_id?: string;
}

export interface AdminRequestWithUser extends ActivationRequest {
  user: {
    username: string;
    email: string;
    commission_count: number;
    current_balance: number;
  };
}

export interface PendingRequestsResponse {
  success: boolean;
  count: number;
  requests: AdminRequestWithUser[];
}

const activationRequestService = {
  /**
   * Submit a reactivation request (USER)
   */
  submitRequest: async (packageId: string): Promise<SubmitRequestResponse> => {
    const response = await api.post('/api/activation-requests/submit', {
      package_id: packageId
    });
    return response.data;
  },

  /**
   * Get user's pending request (USER)
   */
  getMyPendingRequest: async (): Promise<PendingRequestResponse> => {
    const response = await api.get('/api/activation-requests/my-request');
    return response.data;
  },

  /**
   * Cancel pending request (USER)
   */
  cancelRequest: async (requestId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/activation-requests/${requestId}/cancel`);
    return response.data;
  },

  /**
   * Get all pending requests (ADMIN)
   */
  getAllPendingRequests: async (): Promise<PendingRequestsResponse> => {
    const response = await api.get('/api/activation-requests/pending');
    return response.data;
  },

  /**
   * Approve a request (ADMIN)
   */
  approveRequest: async (requestId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/activation-requests/${requestId}/approve`);
    return response.data;
  },

  /**
   * Reject a request (ADMIN)
   */
  rejectRequest: async (requestId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/activation-requests/${requestId}/reject`, {
      reason: reason || 'No reason provided'
    });
    return response.data;
  },

  /**
   * Get pending request count (ADMIN)
   */
  getPendingCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/api/activation-requests/pending-count');
    return response.data;
  }
};

export default activationRequestService;
