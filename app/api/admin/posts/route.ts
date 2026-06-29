import { NextResponse } from "next/server";
import matter from "gray-matter";
import { listFiles, getFile, putFile } from "@/lib/github";

function normalizeDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().split("T")[0];
  return String(raw ?? "");
}

export async function GET() {
  try {
    const files = await listFiles("content/blog");
    const mdxFiles = files.filter((f) => f.name.endsWith(".mdx"));

    const posts = await Promise.all(
      mdxFiles.map(async (f) => {
        const file = await getFile(f.path);
        if (!file) return null;
        const { data } = matter(file.content);
        return {
          slug: f.name.replace(/\.mdx$/, ""),
          title: data.title ?? "",
          date: normalizeDate(data.date),
          description: data.description ?? "",
          published: data.published === true,
          sha: file.sha,
        };
      })
    );

    const sorted = posts
      .filter(Boolean)
      .sort((a, b) => b!.date.localeCompare(a!.date));

    return NextResponse.json(sorted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { slug, title, date, description, content, published, sha } =
      await request.json();

    if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

    const frontmatter = { title, date, description, published: published ?? false };
    const fileContent = matter.stringify(content?.trim() ?? "", frontmatter);
    const verb = published ? "Publish" : "Draft";

    await putFile(`content/blog/${slug}.mdx`, fileContent, `${verb}: ${title}`, sha);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
