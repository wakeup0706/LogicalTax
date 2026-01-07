import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const category = searchParams.get('cat');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 });
        }

        const searchTerm = query.trim();

        // Try using the search function first, fallback to direct query
        let data;
        let error;

        // Direct search with ILIKE for reliability (works even before migration)
        let searchQuery = supabaseAdmin
            .from('qa')
            .select('id, question_title, question_content, answer_content, category_id, is_published, is_free, sort_order, created_at, categories(name)')
            .eq('is_published', true)
            .or(`question_title.ilike.%${searchTerm}%,question_content.ilike.%${searchTerm}%,answer_content.ilike.%${searchTerm}%`);

        if (category) {
            searchQuery = searchQuery.eq('category_id', category);
        }

        const result = await searchQuery.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
        data = result.data;
        error = result.error;

        if (error) {
            console.error("Search error:", error);
            return NextResponse.json({ error: "Search failed" }, { status: 500 });
        }

        return NextResponse.json({ data, query: searchTerm });
    } catch (e: any) {
        console.error("Search exception:", e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

