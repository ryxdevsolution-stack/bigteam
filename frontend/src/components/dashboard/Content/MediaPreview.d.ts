import React from 'react';
import { Post } from '../../../types/post';
interface MediaPreviewProps {
    post: Post;
    onClose: () => void;
    onSave: (post: Post) => void;
}
declare const MediaPreview: React.FC<MediaPreviewProps>;
export default MediaPreview;
