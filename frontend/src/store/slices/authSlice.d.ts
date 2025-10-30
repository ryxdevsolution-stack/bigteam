import { User } from '../../types/user';
interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}
export declare const login: import("@reduxjs/toolkit").AsyncThunk<any, {
    email: string;
    password: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const logout: import("@reduxjs/toolkit").AsyncThunk<void, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/clearError">;
declare const _default: import("redux").Reducer<AuthState>;
export default _default;
