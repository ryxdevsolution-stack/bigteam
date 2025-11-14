export declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    auth: import("./slices/authSlice").AuthState;
    users: import("./slices/userSlice").UserState;
    posts: import("./slices/postSlice").PostState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        auth: import("./slices/authSlice").AuthState;
        users: import("./slices/userSlice").UserState;
        posts: import("./slices/postSlice").PostState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
