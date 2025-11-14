import { TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../store/store';
export declare const useAppDispatch: () => import("redux-thunk").ThunkDispatch<{
    auth: import("../store/slices/authSlice").AuthState;
    users: import("../store/slices/userSlice").UserState;
    posts: import("../store/slices/postSlice").PostState;
}, undefined, import("redux").UnknownAction> & import("redux").Dispatch<import("redux").UnknownAction>;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;
