/** Prefix for static assets on GitHub Pages (`/victorgutierrezforecastcontrol` in prod). */
export function getPublicPath(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
