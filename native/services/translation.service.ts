// Google Translate API Integration for React Native
// Docs: https://cloud.google.com/translate/docs

const TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || 'your_google_translate_api_key';
const TRANSLATE_BASE_URL = 'https://translation.googleapis.com/language/translate/v2';

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export interface Language {
  language: string;
  name: string;
}

export interface DetectionResult {
  language: string;
  confidence: number;
}

class TranslationService {
  private apiKey: string;

  constructor() {
    this.apiKey = TRANSLATE_API_KEY;
  }

  /**
   * Make API request to Google Translate
   */
  private async makeRequest(endpoint: string = '', params: Record<string, any> = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        key: this.apiKey,
        ...params,
      });

      const url = `${TRANSLATE_BASE_URL}${endpoint}?${queryParams}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Translation API request failed:', error);
      throw error;
    }
  }

  /**
   * Translate text
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult | null> {
    try {
      const params: Record<string, any> = {
        q: text,
        target: targetLanguage,
      };

      if (sourceLanguage) {
        params.source = sourceLanguage;
      }

      const response = await this.makeRequest('', params);
      
      if (response.translations?.length > 0) {
        const translation = response.translations[0];
        return {
          translatedText: translation.translatedText,
          detectedSourceLanguage: translation.detectedSourceLanguage,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to translate text:', error);
      return null;
    }
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<DetectionResult | null> {
    try {
      const response = await this.makeRequest('/detect', { q: text });
      
      if (response.detections?.length > 0) {
        const detection = response.detections[0][0];
        return {
          language: detection.language,
          confidence: detection.confidence,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to detect language:', error);
      return null;
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(targetLanguage: string = 'en'): Promise<Language[]> {
    try {
      const response = await this.makeRequest('/languages', { target: targetLanguage });
      return response.languages || [];
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      return [];
    }
  }

  /**
   * Translate multiple texts
   */
  async translateMultiple(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult[]> {
    try {
      const promises = texts.map(text => 
        this.translateText(text, targetLanguage, sourceLanguage)
      );
      
      const results = await Promise.all(promises);
      return results.filter(result => result !== null) as TranslationResult[];
    } catch (error) {
      console.error('Failed to translate multiple texts:', error);
      return [];
    }
  }

  /**
   * Get language name from code
   */
  getLanguageName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'ur': 'Urdu',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'te': 'Telugu',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'gu': 'Gujarati',
      'pa': 'Punjabi',
      'mr': 'Marathi',
      'ne': 'Nepali',
      'si': 'Sinhala',
      'my': 'Myanmar',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Filipino',
    };
    
    return languageNames[languageCode] || languageCode.toUpperCase();
  }

  /**
   * Get popular languages for social media
   */
  getPopularLanguages(): Language[] {
    return [
      { language: 'en', name: 'English' },
      { language: 'es', name: 'Spanish' },
      { language: 'fr', name: 'French' },
      { language: 'de', name: 'German' },
      { language: 'it', name: 'Italian' },
      { language: 'pt', name: 'Portuguese' },
      { language: 'ru', name: 'Russian' },
      { language: 'ja', name: 'Japanese' },
      { language: 'ko', name: 'Korean' },
      { language: 'zh', name: 'Chinese' },
      { language: 'ar', name: 'Arabic' },
      { language: 'hi', name: 'Hindi' },
      { language: 'ur', name: 'Urdu' },
      { language: 'bn', name: 'Bengali' },
    ];
  }

  /**
   * Check if translation is needed
   */
  async shouldTranslate(text: string, userLanguage: string): Promise<boolean> {
    try {
      const detection = await this.detectLanguage(text);
      
      if (!detection) return false;
      
      // Don't translate if already in user's language or confidence is low
      return detection.language !== userLanguage && detection.confidence > 0.5;
    } catch (error) {
      console.error('Failed to check if translation needed:', error);
      return false;
    }
  }

  /**
   * Auto-translate content for user
   */
  async autoTranslateContent(
    content: {
      text: string;
      caption?: string;
      comments?: string[];
    },
    userLanguage: string
  ): Promise<{
    text?: string;
    caption?: string;
    comments?: string[];
  }> {
    try {
      const results: any = {};

      // Translate main text
      if (content.text && await this.shouldTranslate(content.text, userLanguage)) {
        const translation = await this.translateText(content.text, userLanguage);
        if (translation) {
          results.text = translation.translatedText;
        }
      }

      // Translate caption
      if (content.caption && await this.shouldTranslate(content.caption, userLanguage)) {
        const translation = await this.translateText(content.caption, userLanguage);
        if (translation) {
          results.caption = translation.translatedText;
        }
      }

      // Translate comments
      if (content.comments?.length) {
        const translatedComments = await this.translateMultiple(
          content.comments,
          userLanguage
        );
        if (translatedComments.length > 0) {
          results.comments = translatedComments.map(t => t.translatedText);
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to auto-translate content:', error);
      return {};
    }
  }
}

// Singleton instance
export const translationService = new TranslationService();

// Export convenience functions
export const translateText = (text: string, targetLang: string, sourceLang?: string) => 
  translationService.translateText(text, targetLang, sourceLang);

export const detectLanguage = (text: string) => 
  translationService.detectLanguage(text);

export const getSupportedLanguages = (targetLang?: string) => 
  translationService.getSupportedLanguages(targetLang);

export const autoTranslateContent = (content: any, userLang: string) => 
  translationService.autoTranslateContent(content, userLang);
