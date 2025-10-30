import React from 'react';
import { Post } from '../../../types/post';
interface ContentListProps {
    posts: Post[];
    viewMode: 'grid' | 'list';
    onTogglePublish: (postId: string) => void;
    onDelete: (postId: string) => void;
    onEdit: (post: Post) => void;
    isLoading?: boolean;
}
declare const ContentList: React.FC<ContentListProps>;
export default ContentList;
