/**
 * Extract @mentions from text
 * Returns array of usernames (without @)
 */
export function extractMentions(text?: string): string[] {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_\.]+)/g;
  const matches = text.matchAll(mentionRegex);
  const mentions = new Set<string>();
  
  for (const match of matches) {
    mentions.add(match[1]); // Add username without @
  }
  
  return Array.from(mentions);
}

/**
 * Extract mentions from multiple text sources
 */
export function extractAllMentions(...texts: (string | undefined)[]): string[] {
  const allMentions = new Set<string>();
  
  texts.forEach(text => {
    const mentions = extractMentions(text);
    mentions.forEach(mention => allMentions.add(mention));
  });
  
  return Array.from(allMentions);
}
