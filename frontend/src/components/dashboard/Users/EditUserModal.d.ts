import React from 'react';
import { User } from '../../../types/user';
interface EditUserModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSave: (userId: string, data: Partial<User>) => Promise<void>;
    loading?: boolean;
}
declare const EditUserModal: React.FC<EditUserModalProps>;
export default EditUserModal;
