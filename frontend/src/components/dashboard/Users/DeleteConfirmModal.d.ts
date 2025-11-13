import React from 'react';
import { User } from '../../../types/user';
interface DeleteConfirmModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}
declare const DeleteConfirmModal: React.FC<DeleteConfirmModalProps>;
export default DeleteConfirmModal;
