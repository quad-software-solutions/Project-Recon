export function getYouTubeEmbedUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    const parts = url.pathname.split('/').filter(Boolean);
    const videoId = host === 'youtu.be'
      ? parts[0]
      : ['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)
        ? url.searchParams.get('v') || (['embed', 'live', 'shorts'].includes(parts[0]) ? parts[1] : null)
        : null;
    if (!videoId || !/^[a-zA-Z0-9_-]+$/.test(videoId)) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`;
  } catch {
    return null;
  }
}
