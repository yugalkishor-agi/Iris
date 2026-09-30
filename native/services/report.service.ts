import { db, storage } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export interface ReportData {
  reportType: 'post' | 'comment' | 'user' | 'glimpse' | 'story' | 'message';
  targetId: string;
  targetAuthorId: string;
  reporterId: string;
  reporterUsername: string;
  category: string;
  subcategory?: string;
  customReason?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  notes?: string;
}

export interface SupportTicketAttachment {
  url: string;
  path: string;
  mimeType: string;
  fileName: string;
  sizeBytes?: number;
}

export interface SupportTicketData {
  ticketType: 'problem' | 'support';
  userId: string;
  username: string;
  category: string;
  message: string;
  subject?: string;
  contactEmail?: string;
  attachments?: SupportTicketAttachment[];
  platform: 'android' | 'ios' | 'web' | 'unknown';
  status: 'open' | 'in_review' | 'resolved';
  createdAt: any;
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
  private async uploadProblemAttachment(
    userId: string,
    attachment: {
      uri: string;
      mimeType?: string;
      fileName?: string;
      sizeBytes?: number;
    },
    index: number
  ): Promise<SupportTicketAttachment> {
    const sourceUri = attachment.uri;
    if (!sourceUri) {
      throw new Error('Attachment URI missing');
    }

    const mimeType = attachment.mimeType || 'image/jpeg';
    const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const safeFileName = (attachment.fileName || `screenshot_${index + 1}.${extension}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `support-reports/${userId}/${Date.now()}_${index}_${safeFileName}`;

    const blob = await fetch(sourceUri).then((response) => response.blob());
    const fileRef = ref(storage, storagePath);

    await uploadBytes(fileRef, blob, {
      contentType: mimeType,
    });

    const url = await getDownloadURL(fileRef);
    return {
      url,
      path: storagePath,
      mimeType,
      fileName: safeFileName,
      sizeBytes: attachment.sizeBytes,
    };
  }

  async submitReport(reportData: Omit<ReportData, 'status' | 'createdAt'>): Promise<string> {
    try {
      const reportsRef = collection(db, 'reports');

      const report: ReportData = {
        ...reportData,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(reportsRef, report);

      console.log('Report submitted:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw new Error('Failed to submit report');
    }
  }

  async submitSupportTicket(ticketData: Omit<SupportTicketData, 'status' | 'createdAt'>): Promise<string> {
    try {
      const ticketsRef = collection(db, 'supportTickets');
      const ticket: SupportTicketData = {
        ...ticketData,
        status: 'open',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(ticketsRef, ticket);
      console.log('Support ticket submitted:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      throw new Error('Failed to submit support ticket');
    }
  }

  async submitProblemReport(
    userId: string,
    username: string,
    category: string,
    message: string,
    platform: SupportTicketData['platform'] = 'unknown',
    attachments?: Array<{
      uri: string;
      mimeType?: string;
      fileName?: string;
      sizeBytes?: number;
    }>
  ): Promise<string> {
    const uploadedAttachments: SupportTicketAttachment[] = [];
    if (attachments && attachments.length > 0) {
      const safeAttachments = attachments.slice(0, 4);
      for (let i = 0; i < safeAttachments.length; i += 1) {
        try {
          const uploaded = await this.uploadProblemAttachment(userId, safeAttachments[i], i);
          uploadedAttachments.push(uploaded);
        } catch (error) {
          console.warn('[ReportService] Failed to upload attachment:', error);
        }
      }
    }

    return this.submitSupportTicket({
      ticketType: 'problem',
      userId,
      username,
      category,
      message,
      attachments: uploadedAttachments,
      platform,
    });
  }

  async submitSupportMessage(
    userId: string,
    username: string,
    subject: string,
    message: string,
    contactEmail?: string,
    platform: SupportTicketData['platform'] = 'unknown'
  ): Promise<string> {
    return this.submitSupportTicket({
      ticketType: 'support',
      userId,
      username,
      category: 'support',
      subject,
      message,
      contactEmail,
      platform,
    });
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
