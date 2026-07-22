export function normalizeRepositoryUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    return url.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

export const siteConfig = {
  repositoryUrl: normalizeRepositoryUrl(import.meta.env.VITE_REPOSITORY_URL),
} as const;
