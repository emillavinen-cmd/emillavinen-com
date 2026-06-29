import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { getFile, putFile, deleteFile } from "@/lib/github";

interface Ctx {
  params: Promise<{ slug: string }>;
}

function normalizeDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().split("T")[0];
  return String(raw ?? "");
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const file = await getFile(`content/blog/${slug}.mdx`);
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data, content } = matter(file.content);
    return NextResponse.json({
      slug,
      sha: file.sha,
      title: data.title ?? "",
      date: normalizeDate(data.date),
      description: data.description ?? "",
      published: data.published === true,
      content: content.trim(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const { title, date, description, content, published, sha } = await request.json();

    const frontmatter = { title, date, description, published: published ?? false };
    const fileContent = matter.stringify(content?.trim() ?? "", frontmatter);
    const verb = published ? "Publish" : "Update";

    await putFile(`content/blog/${slug}.mdx`, fileContent, `${verb}: ${title}`, sha);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const file = await getFile(`content/blog/${slug}.mdx`);
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await deleteFile(`content/blog/${slug}.mdx`, `Delete: ${slug}`, file.sha);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
