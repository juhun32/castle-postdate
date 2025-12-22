export interface Idea {
    id: string;
    title: string;
    description: string;
    author: string;
    created_at: string;
    updated_at: string;
    likes: number;
    tags: string[];
    comments: Comment[];
    image_url?: string;
    author_avatar_url?: string;
}

export interface NewIdeaData {
    title: string;
    description: string;
    tags?: string[];
    image_url?: string;
}

export interface UpdateIdeaData {
    id: string;
    title?: string;
    description?: string;
    tags?: string[];
    image_url?: string;
}

export interface Comment {
    id: string;
    author: string;
    created_at: string;
    content: string;
}
