import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface ReportScreenProps {
  route: {
    params: {
      contentType: 'post' | 'story' | 'user' | 'comment' | 'message';
      contentId: string;
      authorId?: string;
      authorUsername?: string;
    };
  };
}

const REPORT_REASONS = [
  {
    id: 'spam',
    title: 'Spam',
    description: 'Repetitive or irrelevant content',
    icon: 'ban-outline',
  },
  {
    id: 'harassment',
    title: 'Harassment or Bullying',
    description: 'Targeting someone with harmful content',
    icon: 'warning-outline',
  },
  {
    id: 'hate_speech',
    title: 'Hate Speech',
    description: 'Content that promotes hatred or discrimination',
    icon: 'alert-circle-outline',
  },
  {
    id: 'violence',
    title: 'Violence or Dangerous Organizations',
    description: 'Content that promotes violence or harmful activities',
    icon: 'shield-outline',
  },
  {
    id: 'nudity',
    title: 'Nudity or Sexual Content',
    description: 'Inappropriate sexual content',
    icon: 'eye-off-outline',
  },
  {
    id: 'false_information',
    title: 'False Information',
    description: 'Content that spreads misinformation',
    icon: 'information-circle-outline',
  },
  {
    id: 'intellectual_property',
    title: 'Intellectual Property Violation',
    description: 'Copyright or trademark infringement',
    icon: 'document-text-outline',
  },
  {
    id: 'self_harm',
    title: 'Self-Harm or Suicide',
    description: 'Content promoting self-harm or suicide',
    icon: 'heart-outline',
  },
  {
    id: 'other',
    title: 'Something Else',
    description: 'Other reason not listed above',
    icon: 'ellipsis-horizontal-outline',
  },
];

export default function ReportScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { contentType, contentId, authorId, authorUsername } = (route.params as any) || {};
  
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Please select a reason', 'You must select a reason for reporting this content.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to report content.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create report object
      const reportData = {
        reporterId: user.userId,
        reporterUsername: user.username,
        contentType,
        contentId,
        targetUserId: authorId,
        reason: selectedReason,
        additionalInfo: additionalInfo.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Here you would send to your reporting service
      // await reportService.submitReport(reportData);
      
      console.log('Report submitted:', reportData);

      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review this content and take appropriate action if necessary.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeText = () => {
    switch (contentType) {
      case 'post': return 'post';
      case 'story': return 'story';
      case 'user': return 'user';
      case 'comment': return 'comment';
      case 'message': return 'message';
      default: return 'content';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report {getContentTypeText()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why are you reporting this {getContentTypeText()}?</Text>
          <Text style={styles.infoDescription}>
            Your report is anonymous. If someone is in immediate danger, call local emergency services.
          </Text>
          {authorUsername && (
            <Text style={styles.authorInfo}>
              Reported content by @{authorUsername}
            </Text>
          )}
        </View>

        {/* Reasons List */}
        <View style={styles.reasonsSection}>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonItem,
                selectedReason === reason.id && styles.selectedReasonItem,
              ]}
              onPress={() => handleReasonSelect(reason.id)}
            >
              <View style={styles.reasonContent}>
                <View style={styles.reasonLeft}>
                  <Ionicons
                    name={reason.icon as any}
                    size={24}
                    color={selectedReason === reason.id ? '#007AFF' : '#8E8E93'}
                  />
                  <View style={styles.reasonText}>
                    <Text
                      style={[
                        styles.reasonTitle,
                        selectedReason === reason.id && styles.selectedReasonTitle,
                      ]}
                    >
                      {reason.title}
                    </Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                </View>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedReason === reason.id && styles.selectedRadioButton,
                    ]}
                  >
                    {selectedReason === reason.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Info */}
        {selectedReason && (
          <View style={styles.additionalInfoSection}>
            <Text style={styles.additionalInfoTitle}>
              Additional Information (Optional)
            </Text>
            <TextInput
              style={styles.additionalInfoInput}
              placeholder="Provide any additional details that might help us understand the issue..."
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {additionalInfo.length}/500 characters
            </Text>
          </View>
        )}

        {/* Guidelines */}
        <View style={styles.guidelinesSection}>
          <Text style={styles.guidelinesTitle}>Community Guidelines</Text>
          <Text style={styles.guidelinesText}>
            We're committed to keeping our community safe. Reports help us identify content that violates our community guidelines and take appropriate action.
          </Text>
          <TouchableOpacity style={styles.guidelinesLink}>
            <Text style={styles.guidelinesLinkText}>Learn more about our guidelines</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedReason || isSubmitting) && styles.disabledSubmitButton,
          ]}
          onPress={handleSubmitReport}
          disabled={!selectedReason || isSubmitting}
        >
          <Text
            style={[
              styles.submitButtonText,
              (!selectedReason || isSubmitting) && styles.disabledSubmitButtonText,
            ]}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  authorInfo: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  reasonsSection: {
    paddingVertical: 8,
  },
  reasonItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  selectedReasonItem: {
    backgroundColor: '#F0F8FF',
  },
  reasonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reasonText: {
    marginLeft: 12,
    flex: 1,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  selectedReasonTitle: {
    color: '#007AFF',
  },
  reasonDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  additionalInfoSection: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  additionalInfoInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    minHeight: 100,
    backgroundColor: '#F8F9FA',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  guidelinesSection: {
    padding: 20,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  guidelinesLink: {
    alignSelf: 'flex-start',
  },
  guidelinesLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledSubmitButton: {
    backgroundColor: '#F0F0F0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledSubmitButtonText: {
    color: '#8E8E93',
  },
});
