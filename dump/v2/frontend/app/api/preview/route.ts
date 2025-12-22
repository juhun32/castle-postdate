import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url) return NextResponse.json({ image: null });

    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "Calple/Preview" },
        });
        const html = await res.text();

        // try to find og:image or twitter:image
        const ogMatch =
            html.match(
                /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i
            ) ||
            html.match(
                /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
            ) ||
            html.match(
                /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i
            );

        let imgUrl = ogMatch ? ogMatch[1] : null;

        // make absolute if relative
        if (imgUrl && imgUrl.startsWith("/")) {
            const base = new URL(url);
            imgUrl = new URL(imgUrl, base.origin).toString();
        }

        return NextResponse.json({ image: imgUrl ?? null });
    } catch (err) {
        console.error("preview fetch error:", err);
        return NextResponse.json({ image: null });
    }
}
