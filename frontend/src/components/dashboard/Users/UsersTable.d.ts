import React from 'react';
import { User } from '../../../types/user';
interface UsersTableProps {
    users: User[];
    loading: boolean;
    onRefresh: () => void;
}
declare const UsersTable: React.FC<UsersTableProps>;
export default UsersTable;
