import React from 'react';
import { Post } from '../../../types/post';
interface MediaUploadProps {
    onUploadComplete: (post: Post) => void;
    onCancel: () => void;
}
declare const MediaUpload: React.FC<MediaUploadProps>;
export default MediaUpload;
