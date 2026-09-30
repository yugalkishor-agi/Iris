// Content Filtering Service for React Native
// Handles content moderation, profanity filtering, and safety checks

interface FilterResult {
  isAllowed: boolean;
  confidence: number;
  reasons: string[];
  filteredContent?: string;
}

interface ContentFilterOptions {
  checkProfanity?: boolean;
  checkSpam?: boolean;
  checkToxicity?: boolean;
  checkSensitiveContent?: boolean;
  strictMode?: boolean;
}

// Common profanity words (basic list - in production use a comprehensive database)
const PROFANITY_WORDS = [
  // Basic profanity - add more comprehensive list in production
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'dumb',
  // Add more words as needed
];

// Spam indicators
const SPAM_INDICATORS = [
  'click here', 'free money', 'make money fast', 'get rich quick',
  'limited time offer', 'act now', 'urgent', 'congratulations you won',
  'claim your prize', 'no strings attached', 'risk free',
];

// Toxic language patterns
const TOXIC_PATTERNS = [
  /\b(hate|kill|die|stupid|idiot|moron)\s+(you|him|her|them)\b/gi,
  /\b(go\s+die|kill\s+yourself|kys)\b/gi,
  /\b(i\s+hate\s+you|you\s+suck|you\s+are\s+stupid)\b/gi,
];

// Sensitive content keywords
const SENSITIVE_KEYWORDS = [
  'suicide', 'self harm', 'cutting', 'depression', 'anxiety',
  'eating disorder', 'anorexia', 'bulimia', 'drug abuse',
  'alcohol abuse', 'domestic violence', 'sexual assault',
];

class ContentFilterService {
  private blockedWords: Set<string>;
  private allowedDomains: Set<string>;
  private blockedDomains: Set<string>;

  constructor() {
    this.blockedWords = new Set(PROFANITY_WORDS.map(word => word.toLowerCase()));
    this.allowedDomains = new Set([
      'youtube.com', 'youtu.be', 'instagram.com', 'twitter.com',
      'tiktok.com', 'spotify.com', 'soundcloud.com', 'imgur.com',
    ]);
    this.blockedDomains = new Set([
      'malicious-site.com', 'spam-site.com', // Add known bad domains
    ]);
  }

  /**
   * Filter text content for profanity, spam, and toxicity
   */
  async filterText(
    text: string,
    options: ContentFilterOptions = {}
  ): Promise<FilterResult> {
    const {
      checkProfanity = true,
      checkSpam = true,
      checkToxicity = true,
      checkSensitiveContent = true,
      strictMode = false,
    } = options;

    const reasons: string[] = [];
    let confidence = 1.0;
    let filteredContent = text;

    // Check profanity
    if (checkProfanity) {
      const profanityResult = this.checkProfanity(text, strictMode);
      if (!profanityResult.isClean) {
        reasons.push('Contains profanity');
        confidence *= 0.7;
        filteredContent = profanityResult.filteredText;
      }
    }

    // Check spam
    if (checkSpam) {
      const spamResult = this.checkSpam(text);
      if (spamResult.isSpam) {
        reasons.push('Detected as spam');
        confidence *= 0.5;
      }
    }

    // Check toxicity
    if (checkToxicity) {
      const toxicityResult = this.checkToxicity(text);
      if (toxicityResult.isToxic) {
        reasons.push('Contains toxic language');
        confidence *= 0.3;
      }
    }

    // Check sensitive content
    if (checkSensitiveContent) {
      const sensitiveResult = this.checkSensitiveContent(text);
      if (sensitiveResult.isSensitive) {
        reasons.push('Contains sensitive content');
        confidence *= 0.6;
      }
    }

    const isAllowed = strictMode ? reasons.length === 0 : confidence > 0.5;

    return {
      isAllowed,
      confidence,
      reasons,
      filteredContent: isAllowed ? filteredContent : undefined,
    };
  }

  /**
   * Check for profanity in text
   */
  private checkProfanity(text: string, strict: boolean = false): {
    isClean: boolean;
    filteredText: string;
    detectedWords: string[];
  } {
    const words = text.toLowerCase().split(/\s+/);
    const detectedWords: string[] = [];
    let filteredText = text;

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.blockedWords.has(cleanWord)) {
        detectedWords.push(word);
        // Replace with asterisks
        const replacement = '*'.repeat(word.length);
        filteredText = filteredText.replace(new RegExp(word, 'gi'), replacement);
      }
    }

    // Check for leetspeak and character substitution
    if (strict) {
      const leetPatterns = {
        '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's',
        '@': 'a', '$': 's', '!': 'i', '7': 't',
      };
      
      let normalizedText = text.toLowerCase();
      for (const [leet, normal] of Object.entries(leetPatterns)) {
        normalizedText = normalizedText.replace(new RegExp(leet, 'g'), normal);
      }
      
      const normalizedWords = normalizedText.split(/\s+/);
      for (const word of normalizedWords) {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (this.blockedWords.has(cleanWord)) {
          detectedWords.push(word);
        }
      }
    }

    return {
      isClean: detectedWords.length === 0,
      filteredText,
      detectedWords,
    };
  }

  /**
   * Check for spam indicators
   */
  private checkSpam(text: string): { isSpam: boolean; indicators: string[] } {
    const lowerText = text.toLowerCase();
    const detectedIndicators: string[] = [];

    for (const indicator of SPAM_INDICATORS) {
      if (lowerText.includes(indicator.toLowerCase())) {
        detectedIndicators.push(indicator);
      }
    }

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 10) {
      detectedIndicators.push('Excessive capitalization');
    }

    // Check for excessive punctuation
    const punctRatio = (text.match(/[!?]{2,}/g) || []).length;
    if (punctRatio > 2) {
      detectedIndicators.push('Excessive punctuation');
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(text)) {
      detectedIndicators.push('Repeated characters');
    }

    return {
      isSpam: detectedIndicators.length >= 2,
      indicators: detectedIndicators,
    };
  }

  /**
   * Check for toxic language patterns
   */
  private checkToxicity(text: string): { isToxic: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];

    for (const pattern of TOXIC_PATTERNS) {
      if (pattern.test(text)) {
        detectedPatterns.push(pattern.source);
      }
    }

    return {
      isToxic: detectedPatterns.length > 0,
      patterns: detectedPatterns,
    };
  }

  /**
   * Check for sensitive content
   */
  private checkSensitiveContent(text: string): {
    isSensitive: boolean;
    keywords: string[];
  } {
    const lowerText = text.toLowerCase();
    const detectedKeywords: string[] = [];

    for (const keyword of SENSITIVE_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
      }
    }

    return {
      isSensitive: detectedKeywords.length > 0,
      keywords: detectedKeywords,
    };
  }

  /**
   * Filter URLs and check for malicious links
   */
  async filterUrls(text: string): Promise<{
    isAllowed: boolean;
    filteredText: string;
    blockedUrls: string[];
  }> {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    const blockedUrls: string[] = [];
    let filteredText = text;

    for (const url of urls) {
      try {
        const domain = new URL(url).hostname.toLowerCase();
        
        if (this.blockedDomains.has(domain)) {
          blockedUrls.push(url);
          filteredText = filteredText.replace(url, '[BLOCKED LINK]');
        } else if (!this.allowedDomains.has(domain)) {
          // Unknown domain - could be suspicious
          console.warn('Unknown domain detected:', domain);
        }
      } catch (error) {
        // Invalid URL
        blockedUrls.push(url);
        filteredText = filteredText.replace(url, '[INVALID LINK]');
      }
    }

    return {
      isAllowed: blockedUrls.length === 0,
      filteredText,
      blockedUrls,
    };
  }

  /**
   * Filter image content (basic checks)
   */
  async filterImage(imageUri: string): Promise<FilterResult> {
    // Basic image filtering - in production, use ML models or external APIs
    // For now, just check file size and format
    
    try {
      const response = await fetch(imageUri, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      const reasons: string[] = [];

      // Check file type
      if (!contentType?.startsWith('image/')) {
        reasons.push('Invalid image format');
      }

      // Check file size (max 10MB)
      if (contentLength > 10 * 1024 * 1024) {
        reasons.push('Image too large');
      }

      return {
        isAllowed: reasons.length === 0,
        confidence: reasons.length === 0 ? 1.0 : 0.0,
        reasons,
      };
    } catch (error) {
      return {
        isAllowed: false,
        confidence: 0.0,
        reasons: ['Failed to validate image'],
      };
    }
  }

  /**
   * Add words to block list
   */
  addBlockedWords(words: string[]): void {
    words.forEach(word => this.blockedWords.add(word.toLowerCase()));
  }

  /**
   * Remove words from block list
   */
  removeBlockedWords(words: string[]): void {
    words.forEach(word => this.blockedWords.delete(word.toLowerCase()));
  }

  /**
   * Add allowed domains
   */
  addAllowedDomains(domains: string[]): void {
    domains.forEach(domain => this.allowedDomains.add(domain.toLowerCase()));
  }

  /**
   * Add blocked domains
   */
  addBlockedDomains(domains: string[]): void {
    domains.forEach(domain => this.blockedDomains.add(domain.toLowerCase()));
  }

  /**
   * Get content safety score (0-1, higher is safer)
   */
  async getContentSafetyScore(content: string): Promise<number> {
    const result = await this.filterText(content);
    return result.confidence;
  }

  /**
   * Check if user is posting too frequently (spam prevention)
   */
  checkPostingFrequency(userId: string, timeWindow: number = 60000): boolean {
    // In production, this would check against a database
    // For now, just return true (allowed)
    return true;
  }
}

// Singleton instance
export const contentFilterService = new ContentFilterService();

// Export types
export type { FilterResult, ContentFilterOptions };
