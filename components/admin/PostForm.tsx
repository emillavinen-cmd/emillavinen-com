"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface PostData {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
  published: boolean;
  sha?: string;
}

interface PostFormProps {
  initialData?: PostData;
  isNew?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const EMPTY: PostData = {
  slug: "",
  title: "",
  date: today(),
  description: "",
  content: "",
  published: false,
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function PostForm({ initialData, isNew = false }: PostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PostData>(initialData ?? EMPTY);
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-generate slug from title for new posts until user edits it manually
  useEffect(() => {
    if (isNew && !slugEdited) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [form.title, isNew, slugEdited]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    if (name === "slug") setSlugEdited(true);
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  const save = useCallback(
    async (publish: boolean) => {
      setStatus("saving");
      setErrorMsg("");

      try {
        const body: PostData = { ...form, published: publish };
        const url = isNew
          ? "/api/admin/posts"
          : `/api/admin/posts/${form.slug}`;
        const method = isNew ? "POST" : "PUT";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        if (publish) {
          await fetch("/api/admin/deploy", { method: "POST" });
        }

        setForm((prev) => ({ ...prev, published: publish }));
        setStatus("saved");

        if (isNew) {
          router.push(`/admin/posts/${form.slug}/edit`);
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Save failed");
      }
    },
    [form, isNew, router]
  );

  async function handleDelete() {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/posts/${form.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Title
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Post title"
          className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Slug
        </label>
        <input
          type="text"
          name="slug"
          value={form.slug}
          onChange={handleChange}
          disabled={!isNew}
          placeholder="post-slug"
          className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-neutral-400 mt-1">
          emillavinen.com/blog/{form.slug || "…"}
        </p>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Publish Date
        </label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
        />
      </div>

      {/* Meta description */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Meta Description{" "}
          <span
            className={`normal-case font-normal ${
              form.description.length > 160 ? "text-red-500" : "text-neutral-400"
            }`}
          >
            ({form.description.length}/160)
          </span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Brief description for search engines…"
          className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
          Content (Markdown)
        </label>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          rows={24}
          placeholder="Write in markdown…"
          className="w-full border border-neutral-300 rounded px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:border-black resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-4">
          {/* Status */}
          <span className="text-sm text-neutral-400">
            {status === "saving" && "Saving…"}
            {status === "saved" && (
              <span className="text-green-600">Saved</span>
            )}
            {status === "error" && (
              <span className="text-red-500">{errorMsg}</span>
            )}
          </span>
          {form.published && status !== "saving" && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Published
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={() => save(false)}
            disabled={status === "saving"}
            className="px-4 py-2 text-sm border border-neutral-300 rounded bg-white hover:bg-neutral-50 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            onClick={() => save(true)}
            disabled={status === "saving"}
            className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50"
          >
            {form.published ? "Update & deploy" : "Publish & deploy"}
          </button>
        </div>
      </div>
    </div>
  );
}
