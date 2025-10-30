import { User } from '../../types/user';
interface UserState {
    users: User[];
    selectedUser: User | null;
    loading: boolean;
    error: string | null;
}
export declare const fetchUsers: import("@reduxjs/toolkit").AsyncThunk<User[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createUser: import("@reduxjs/toolkit").AsyncThunk<any, Partial<User>, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const updateUser: import("@reduxjs/toolkit").AsyncThunk<User, {
    id: string;
    data: Partial<User>;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const deleteUser: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const setSelectedUser: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "users/setSelectedUser">;
declare const _default: import("redux").Reducer<UserState>;
export default _default;
