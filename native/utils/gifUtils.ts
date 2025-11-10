/**
 * GIF Utilities - Detect and handle GIF URLs
 */

/**
 * Check if text is a Giphy GIF URL
 */
export function isGiphyUrl(text: string): boolean {
  if (!text) return false;
  return (
    text.includes('giphy.com') || 
    text.includes('media.giphy.com') ||
    text.includes('i.giphy.com')
  );
}

/**
 * Check if text is any image URL (including GIFs)
 */
export function isImageUrl(text: string): boolean {
  if (!text) return false;
  const imageExtensions = ['.gif', '.jpg', '.jpeg', '.png', '.webp'];
  const lowerText = text.toLowerCase();
  return (
    imageExtensions.some(ext => lowerText.includes(ext)) ||
    isGiphyUrl(text)
  );
}

/**
 * Extract GIF URL from message text
 */
export function extractGifUrl(text: string): string | null {
  if (!text) return null;
  
  // Check if entire text is a URL
  try {
    const url = new URL(text.trim());
    if (isGiphyUrl(url.href)) {
      return url.href;
    }
  } catch {
    // Not a valid URL
  }
  
  // Check if text contains a Giphy URL
  const giphyPattern = /(https?:\/\/[^\s]*giphy\.com[^\s]*)/gi;
  const match = text.match(giphyPattern);
  return match ? match[0] : null;
}

/**
 * Check if message is ONLY a GIF (no additional text)
 */
export function isGifOnly(text: string): boolean {
  const gifUrl = extractGifUrl(text);
  return gifUrl !== null && text.trim() === gifUrl;
}

/**
 * Get display text for GIF message
 */
export function getGifDisplayText(text: string): { isGif: boolean; gifUrl?: string; displayText?: string } {
  const gifUrl = extractGifUrl(text);
  
  if (!gifUrl) {
    return { isGif: false };
  }
  
  if (isGifOnly(text)) {
    // Message is only GIF
    return { isGif: true, gifUrl };
  }
  
  // Message has GIF + text
  const displayText = text.replace(gifUrl, '').trim();
  return { isGif: true, gifUrl, displayText };
}
