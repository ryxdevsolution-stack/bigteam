import React from 'react';
import { Post } from '../types/post';
import { User } from '../types/user';
import { DashboardStats } from '../services/userService';
import { TreeData, Commission } from '../services/mlmService';
export interface HomeData {
    videos: Post[];
    photos: Post[];
    ads: Advertisement[];
    meetings: any[];
}
export interface Advertisement {
    id: string;
    title: string;
    description: string;
    media_type: string;
    media_url: string;
    link_url?: string;
    start_date?: string;
    end_date?: string;
}
interface DataContextType {
    posts: Post[];
    postsLoading: boolean;
    postsError: string | null;
    lastPostsFetch: number | null;
    fetchPosts: (force?: boolean) => Promise<void>;
    addPost: (post: Post) => void;
    updatePost: (postId: string, updates: Partial<Post>) => void;
    deletePost: (postId: string) => void;
    users: User[];
    usersLoading: boolean;
    usersError: string | null;
    lastUsersFetch: number | null;
    fetchUsers: (force?: boolean) => Promise<void>;
    dashboardStats: DashboardStats | null;
    dashboardStatsLoading: boolean;
    dashboardStatsError: string | null;
    lastDashboardStatsFetch: number | null;
    fetchDashboardStats: (userId: string, force?: boolean) => Promise<void>;
    mlmTree: TreeData | null;
    mlmTreeLoading: boolean;
    mlmTreeError: string | null;
    lastMlmTreeFetch: number | null;
    fetchMlmTree: (userId: string, force?: boolean) => Promise<void>;
    commissions: Commission[];
    commissionsLoading: boolean;
    commissionsError: string | null;
    lastCommissionsFetch: number | null;
    fetchCommissions: (userId: string, force?: boolean) => Promise<void>;
    userProfile: User | null;
    userProfileLoading: boolean;
    userProfileError: string | null;
    lastUserProfileFetch: number | null;
    fetchUserProfile: (userId: string, force?: boolean) => Promise<void>;
    homeData: HomeData | null;
    homeDataLoading: boolean;
    homeDataError: string | null;
    lastHomeDataFetch: number | null;
    fetchHomeData: (force?: boolean) => Promise<void>;
}
export declare const DataProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useData: () => DataContextType;
export {};
