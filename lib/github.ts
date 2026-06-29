const API = "https://api.github.com";

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub env vars: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO");
  }
  return { token, owner, repo, branch: process.env.GITHUB_BRANCH ?? "main" };
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export interface GithubFile {
  path: string;
  name: string;
  sha: string;
  content: string;
}

export async function listFiles(dir: string): Promise<GithubFile[]> {
  const { token, owner, repo, branch } = cfg();
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`,
    { headers: headers(token), cache: "no-store" }
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub list error: ${res.status}`);
  const data = await res.json();
  return (data as Array<{ type: string; path: string; name: string; sha: string }>)
    .filter((f) => f.type === "file")
    .map((f) => ({ path: f.path, name: f.name, sha: f.sha, content: "" }));
}

export async function getFile(path: string): Promise<GithubFile | null> {
  const { token, owner, repo, branch } = cfg();
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: headers(token), cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub get error: ${res.status}`);
  const data = await res.json();
  return {
    path: data.path,
    name: data.name,
    sha: data.sha,
    content: Buffer.from(data.content, "base64").toString("utf8"),
  };
}

export async function putFile(
  filePath: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const { token, owner, repo, branch } = cfg();
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${filePath}`,
    { method: "PUT", headers: headers(token), body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub put error: ${res.status} — ${JSON.stringify(err)}`);
  }
}

export async function deleteFile(
  filePath: string,
  message: string,
  sha: string
): Promise<void> {
  const { token, owner, repo, branch } = cfg();
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: "DELETE",
      headers: headers(token),
      body: JSON.stringify({ message, sha, branch }),
    }
  );
  if (!res.ok) throw new Error(`GitHub delete error: ${res.status}`);
}
