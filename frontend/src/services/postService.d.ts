import { Post } from '../types/post';
export declare const postService: {
    getAllPosts: () => Promise<import("axios").AxiosResponse<Post[], any, {}>>;
    getPost: (id: string) => Promise<import("axios").AxiosResponse<Post, any, {}>>;
    createPost: (data: FormData) => Promise<import("axios").AxiosResponse<Post, any, {}>>;
    updatePost: (id: string, data: Partial<Post>) => Promise<import("axios").AxiosResponse<Post, any, {}>>;
    deletePost: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    interactWithPost: (id: string, type: "like" | "share" | "view") => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
