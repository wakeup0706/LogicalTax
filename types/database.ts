export interface User {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    stripe_customer_id: string | null;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    created_at: string;
}

export interface QA {
    id: string;
    question_title: string;
    question_content: string;
    answer_content: string;
    category_id: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    // Joins
    categories?: Category;
}

export interface Subscription {
    id: string;
    user_id: string;
    status: string;
    price_id: string | null;
    cancel_at_period_end: boolean;
    current_period_end: string | null;
    created_at: string;
}
