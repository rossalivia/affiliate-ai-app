/**
 * Utility functions for parsing media and resource URLs
 * for embedded preview and YouTube player completion detection.
 */

/**
 * Extracts the YouTube Video ID from regular YouTube links and Shorts.
 *
 * Supported formats:
 * - https://youtu.be/TeqwBYSSLGQ
 * - https://youtube.com/shorts/Amb9TTTSOfo
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    // 1. Check youtu.be shortlinks
    const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (youtuBeMatch && youtuBeMatch[1]) {
      return youtuBeMatch[1].split('?')[0];
    }

    // 2. Check youtube.com/shorts/
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch && shortsMatch[1]) {
      return shortsMatch[1].split('?')[0];
    }

    // 3. Check youtube.com/watch?v=
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
      return watchMatch[1];
    }

    // 4. Check youtube.com/embed/
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch && embedMatch[1]) {
      return embedMatch[1].split('?')[0];
    }
  } catch (err) {
    console.error('Error parsing YouTube video ID:', err);
  }

  return null;
}

/**
 * Transforms Google Drive share links into embeddable /preview links.
 */
export function getGoogleDriveEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return null;
}

/**
 * Transforms Google Docs links into embeddable /preview links.
 */
export function getGoogleDocsEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/document/d/${match[1]}/preview`;
  }
  return null;
}
