import { User } from '../types/user';
export interface CreateUserPayload {
    full_name: string;
    email: string;
    username: string;
    password: string;
    role?: 'customer' | 'admin';
    referred_by?: string;
    amount?: number;
}
export interface DashboardStats {
    user: User;
    total_referrals: number;
    active_referrals: number;
    inactive_referrals: number;
    total_earnings: number;
    available_balance: number;
    pending_balance: number;
    total_commissions: number;
    commission_received_count: number;
    is_mlm_active: boolean;
    referral_code: string;
    recent_commissions: Array<{
        amount: number;
        created_at: string;
        from_user: string;
    }>;
}
export declare const userService: {
    getAllUsers: () => Promise<import("axios").AxiosResponse<User[], any, {}>>;
    getUser: (id: string) => Promise<import("axios").AxiosResponse<User, any, {}>>;
    createUser: (data: CreateUserPayload) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateUser: (id: string, data: Partial<User>) => Promise<import("axios").AxiosResponse<User, any, {}>>;
    deleteUser: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getUserProfile: (userId: string) => Promise<import("axios").AxiosResponse<{
        user: User;
    }, any, {}>>;
    updateUserProfile: (userId: string, data: Partial<User>) => Promise<import("axios").AxiosResponse<{
        user: User;
    }, any, {}>>;
    getDashboardStats: (userId: string) => Promise<DashboardStats>;
    getReferrals: (userId: string) => Promise<any>;
    checkEmailExists: (email: string) => Promise<boolean>;
    checkUsernameExists: (username: string) => Promise<boolean>;
};
