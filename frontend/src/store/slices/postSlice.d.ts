import { Post } from '../../types/post';
export interface PostState {
    posts: Post[];
    selectedPost: Post | null;
    loading: boolean;
    error: string | null;
}
export declare const fetchPosts: import("@reduxjs/toolkit").AsyncThunk<Post[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createPost: import("@reduxjs/toolkit").AsyncThunk<Post, FormData, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const updatePost: import("@reduxjs/toolkit").AsyncThunk<Post, {
    id: string;
    data: Partial<Post>;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const deletePost: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const setSelectedPost: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "posts/setSelectedPost">;
declare const _default: import("redux").Reducer<PostState>;
export default _default;
