import React from 'react';
import { CreateUserPayload } from '../../../services/userService';
interface CreateUserFormProps {
    onSubmit: (data: CreateUserPayload) => Promise<any>;
    loading: boolean;
    error: string | null;
    onClearError: () => void;
}
declare const CreateUserForm: React.FC<CreateUserFormProps>;
export default CreateUserForm;
