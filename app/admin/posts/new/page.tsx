import Link from "next/link";
import PostForm from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium">New post</h1>
        <Link href="/admin" className="text-sm text-neutral-400 hover:text-black">
          ← All posts
        </Link>
      </div>
      <PostForm isNew />
    </div>
  );
}
