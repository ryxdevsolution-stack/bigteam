import React from 'react';
import { Post } from '../types/post';
import { User } from '../types/user';
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
}
export declare const DataProvider: React.FC<{
    children: React.ReactNode;
}>;
export declare const useData: () => DataContextType;
export {};
