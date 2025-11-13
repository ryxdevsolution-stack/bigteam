import React from 'react';
interface CustomerDetailModalProps {
    customer: {
        id: string;
        full_name: string;
        username?: string;
        email: string;
        role: string;
        is_active: boolean;
        created_at: string;
        updated_at?: string;
        sponsored_by?: string;
        is_mlm_active: boolean;
        total_earnings: number;
        referral_code?: string;
        activation_date?: string;
        amount: number;
    };
    onClose: () => void;
    onRefresh: () => void;
}
declare const CustomerDetailModal: React.FC<CustomerDetailModalProps>;
export default CustomerDetailModal;
