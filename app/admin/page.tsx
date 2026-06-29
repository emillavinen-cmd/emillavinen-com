import Link from "next/link";
import { listFiles, getFile } from "@/lib/github";
import matter from "gray-matter";
import LogoutButton from "@/components/admin/LogoutButton";

function normalizeDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().split("T")[0];
  return String(raw ?? "");
}

async function getPosts() {
  const files = await listFiles("content/blog");
  const mdxFiles = files.filter((f) => f.name.endsWith(".mdx"));

  const posts = await Promise.all(
    mdxFiles.map(async (f) => {
      const file = await getFile(f.path);
      if (!file) return null;
      const { data } = matter(file.content);
      return {
        slug: f.name.replace(/\.mdx$/, ""),
        title: data.title ?? f.name,
        date: normalizeDate(data.date),
        published: data.published === true,
      };
    })
  );

  return posts
    .filter(Boolean)
    .sort((a, b) => b!.date.localeCompare(a!.date));
}

export default async function AdminDashboard() {
  let posts: Awaited<ReturnType<typeof getPosts>> = [];
  let configError: string | null = null;

  try {
    posts = await getPosts();
  } catch (err) {
    configError = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium">Posts</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-neutral-800"
          >
            New post
          </Link>
          <LogoutButton />
        </div>
      </div>

      {configError ? (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
          <p className="font-medium mb-1">GitHub not configured</p>
          <p>{configError}</p>
          <p className="mt-2 text-red-500">
            Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in your environment.
          </p>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-neutral-400 text-sm">No posts yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="pb-3 font-medium text-neutral-400 text-xs uppercase tracking-widest">Title</th>
              <th className="pb-3 font-medium text-neutral-400 text-xs uppercase tracking-widest">Date</th>
              <th className="pb-3 font-medium text-neutral-400 text-xs uppercase tracking-widest">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {posts.map((post) => (
              <tr key={post!.slug}>
                <td className="py-3 font-medium">{post!.title}</td>
                <td className="py-3 text-neutral-400">{post!.date}</td>
                <td className="py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      post!.published
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {post!.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/posts/${post!.slug}/edit`}
                    className="text-neutral-400 hover:text-black text-sm"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
