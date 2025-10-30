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
declare const mlmService: {
    getSettings: () => Promise<MLMSettings>;
    createPurchase: (userId: string, amount: number, sponsoredBy?: string) => Promise<PurchaseResult>;
    activateUser: (userId: string, sponsoredBy?: string) => Promise<PurchaseResult>;
    getTree: (userId: string) => Promise<TreeData>;
    getChain: (activeOnly?: boolean) => Promise<any[]>;
    checkReferralCode: (referralCode: string) => Promise<any>;
    getGlobalStats: () => Promise<any>;
    getUserCommissions: (userId: string, limit?: number) => Promise<Commission[]>;
};
export default mlmService;
