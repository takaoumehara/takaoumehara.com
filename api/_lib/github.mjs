// GitHub, through the owner's own OAuth token: who they are, and a commit of
// several files in one go through the Git Data API. Zero dependencies.
const API = "https://api.github.com";

async function gh(path, { token, method = "GET", body, fetchImpl = globalThis.fetch } = {}) {
  const response = await fetchImpl(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "takaoumehara.com-studio", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`GitHub ${method} ${path}: ${response.status} ${data.message ?? ""}`.trim());
    error.status = response.status === 401 ? 401 : 502;
    throw error;
  }
  return data;
}

export async function exchangeCode({ code, clientId, clientSecret, redirectUri, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const error = new Error(`GitHub did not issue a token: ${data.error_description ?? data.error ?? response.status}`);
    error.status = 502;
    throw error;
  }
  return data.access_token;
}

export const fetchUser = (token, opts) => gh("/user", { token, ...opts });

/**
 * One commit with the given files (path → text) on top of `branch`. Returns
 * { sha, htmlUrl }. With `pullRequest`, the commit goes to a new branch and a
 * PR is opened instead; the returned object then carries prUrl.
 */
export async function commitFiles({ token, repo, branch = "main", message, files, pullRequest = null, fetchImpl }) {
  const opts = { token, fetchImpl };
  const base = await gh(`/repos/${repo}/git/ref/heads/${branch}`, opts);
  const baseSha = base.object.sha;
  const baseCommit = await gh(`/repos/${repo}/git/commits/${baseSha}`, opts);
  const tree = [];
  for (const [path, content] of Object.entries(files)) {
    const blob = await gh(`/repos/${repo}/git/blobs`, { ...opts, method: "POST", body: { content, encoding: "utf-8" } });
    tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh(`/repos/${repo}/git/trees`, { ...opts, method: "POST", body: { base_tree: baseCommit.tree.sha, tree } });
  const commit = await gh(`/repos/${repo}/git/commits`, { ...opts, method: "POST", body: { message, tree: newTree.sha, parents: [baseSha] } });
  if (pullRequest) {
    const head = pullRequest.branch;
    await gh(`/repos/${repo}/git/refs`, { ...opts, method: "POST", body: { ref: `refs/heads/${head}`, sha: commit.sha } });
    const pr = await gh(`/repos/${repo}/pulls`, { ...opts, method: "POST", body: { title: pullRequest.title, head, base: branch, body: pullRequest.body ?? "", draft: false } });
    return { sha: commit.sha, htmlUrl: commit.html_url, prUrl: pr.html_url, branch: head };
  }
  await gh(`/repos/${repo}/git/refs/heads/${branch}`, { ...opts, method: "PATCH", body: { sha: commit.sha, force: false } });
  return { sha: commit.sha, htmlUrl: commit.html_url, branch };
}
