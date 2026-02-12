function getR2BaseUrl() {
  const value = process.env.R2_PUBLIC_BASE_URL;
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

export function toR2Url(pathOrUrl: string) {
  if (!pathOrUrl) return pathOrUrl;

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const baseUrl = getR2BaseUrl();
  if (!baseUrl) {
    return pathOrUrl;
  }

  const cleanedPath = pathOrUrl.replace(/^\/+/, "");
  return `${baseUrl}/${cleanedPath}`;
}
