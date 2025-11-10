import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ReportData {
  reportType: 'post' | 'comment' | 'user' | 'glimpse' | 'story' | 'message';
  targetId: string; // ID of reported item
  targetAuthorId: string; // ID of the person who created the content
  reporterId: string; // ID of person reporting
  reporterUsername: string;
  category: string; // Main category
  subcategory?: string; // Subcategory if applicable
  customReason?: string; // Custom message if "Other" selected
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  notes?: string;
}

export const REPORT_CATEGORIES = {
  spam: {
    label: 'Spam',
    subcategories: [
      'Repetitive content',
      'Commercial spam',
      'Fake engagement',
      'Misleading links'
    ]
  },
  harassment: {
    label: 'Harassment or Bullying',
    subcategories: [
      'Targeted harassment',
      'Threatening language',
      'Hate speech',
      'Doxxing'
    ]
  },
  violence: {
    label: 'Violence or Dangerous Organizations',
    subcategories: [
      'Graphic violence',
      'Threats of violence',
      'Dangerous organizations',
      'Terrorism'
    ]
  },
  nudity: {
    label: 'Nudity or Sexual Content',
    subcategories: [
      'Adult nudity',
      'Sexual activity',
      'Sexual exploitation',
      'Child safety concern'
    ]
  },
  hateSpeech: {
    label: 'Hate Speech or Symbols',
    subcategories: [
      'Racist content',
      'Religious intolerance',
      'Sexist content',
      'Homophobic content'
    ]
  },
  falseInfo: {
    label: 'False Information',
    subcategories: [
      'Health misinformation',
      'Political misinformation',
      'Manipulated media',
      'Impersonation'
    ]
  },
  selfHarm: {
    label: 'Self-Harm or Suicide',
    subcategories: [
      'Self-injury',
      'Suicide or suicidal thoughts',
      'Eating disorders',
      'Dangerous challenges'
    ]
  },
  scam: {
    label: 'Scam or Fraud',
    subcategories: [
      'Financial scam',
      'Fake products',
      'Phishing',
      'Identity theft'
    ]
  },
  intellectual: {
    label: 'Intellectual Property Violation',
    subcategories: [
      'Copyright infringement',
      'Trademark violation',
      'Counterfeit goods',
      'Plagiarism'
    ]
  },
  other: {
    label: 'Other',
    subcategories: [
      'Inappropriate content',
      'Privacy violation',
      'Underage user',
      'Something else'
    ]
  }
};

class ReportService {
  async submitReport(reportData: Omit<ReportData, 'status' | 'createdAt'>): Promise<string> {
    try {
      const reportsRef = collection(db, 'reports');
      
      const report: ReportData = {
        ...reportData,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(reportsRef, report);
      
      console.log('✅ Report submitted:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Failed to submit report:', error);
      throw new Error('Failed to submit report');
    }
  }

  async reportPost(
    postId: string,
    postAuthorId: string,
    reporterId: string,
    reporterUsername: string,
    category: string,
    subcategory?: string,
    customReason?: string
  ): Promise<string> {
    return this.submitReport({
      reportType: 'post',
      targetId: postId,
      targetAuthorId: postAuthorId,
      reporterId,
      reporterUsername,
      category,
      subcategory,
      customReason,
    });
  }

  async reportComment(
    commentId: string,
    commentAuthorId: string,
    reporterId: string,
    reporterUsername: string,
    category: string,
    subcategory?: string,
    customReason?: string
  ): Promise<string> {
    return this.submitReport({
      reportType: 'comment',
      targetId: commentId,
      targetAuthorId: commentAuthorId,
      reporterId,
      reporterUsername,
      category,
      subcategory,
      customReason,
    });
  }

  async reportUser(
    userId: string,
    reporterId: string,
    reporterUsername: string,
    category: string,
    subcategory?: string,
    customReason?: string
  ): Promise<string> {
    return this.submitReport({
      reportType: 'user',
      targetId: userId,
      targetAuthorId: userId,
      reporterId,
      reporterUsername,
      category,
      subcategory,
      customReason,
    });
  }

  async reportGlimpse(
    glimpseId: string,
    glimpseAuthorId: string,
    reporterId: string,
    reporterUsername: string,
    category: string,
    subcategory?: string,
    customReason?: string
  ): Promise<string> {
    return this.submitReport({
      reportType: 'glimpse',
      targetId: glimpseId,
      targetAuthorId: glimpseAuthorId,
      reporterId,
      reporterUsername,
      category,
      subcategory,
      customReason,
    });
  }

  async reportStory(
    storyId: string,
    storyAuthorId: string,
    reporterId: string,
    reporterUsername: string,
    category: string,
    subcategory?: string,
    customReason?: string
  ): Promise<string> {
    return this.submitReport({
      reportType: 'story',
      targetId: storyId,
      targetAuthorId: storyAuthorId,
      reporterId,
      reporterUsername,
      category,
      subcategory,
      customReason,
    });
  }

  async reportMessage(
    messageId: string,
    messageAuthorId: string,
    reporterId: string,
    reporterUsername: string,
    category: string,
    subcategory?: string,
    customReason?: string
  ): Promise<string> {
    return this.submitReport({
      reportType: 'message',
      targetId: messageId,
      targetAuthorId: messageAuthorId,
      reporterId,
      reporterUsername,
      category,
      subcategory,
      customReason,
    });
  }
}

export const reportService = new ReportService();
