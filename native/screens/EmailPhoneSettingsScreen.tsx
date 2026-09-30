import { InlineLoadingSkeleton, ButtonLoadingSkeleton } from '../components/ui/LoadingSkeleton';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

export default function EmailPhoneSettingsScreen() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    if (!user) return;
    
    try {
      // Load user's current email and phone
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setIsEmailVerified((user as any).emailVerified || false);
      setIsPhoneVerified((user as any).phoneVerified || false);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleEmailUpdate = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // In production, this would update the user's email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      
      setEditingEmail(false);
      setIsEmailVerified(false); // Email needs to be verified again
      
      Alert.alert(
        'Email Updated',
        'A verification email has been sent to your new email address. Please check your inbox and click the verification link.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update email:', error);
      Alert.alert('Error', 'Failed to update email address');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneUpdate = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      
      // In production, this would update the user's phone
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      
      setEditingPhone(false);
      setIsPhoneVerified(false); // Phone needs to be verified again
      
      Alert.alert(
        'Phone Updated',
        'A verification code has been sent to your new phone number. Please enter the code to verify.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Now', onPress: () => handlePhoneVerification() },
        ]
      );
    } catch (error) {
      console.error('Failed to update phone:', error);
      Alert.alert('Error', 'Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = () => {
    Alert.alert(
      'Verify Email',
      'A verification email will be sent to your email address. Please check your inbox and click the verification link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: async () => {
            try {
              setLoading(true);
              // In production, this would send verification email
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Verification Email Sent', 'Please check your inbox for the verification email.');
            } catch (error) {
              Alert.alert('Error', 'Failed to send verification email');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePhoneVerification = () => {
    Alert.alert(
      'Verify Phone',
      'A verification code will be sent to your phone number via SMS.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Code',
          onPress: async () => {
            try {
              setLoading(true);
              // In production, this would send SMS verification code
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Verification Code Sent', 'Please check your messages for the verification code.');
            } catch (error) {
              Alert.alert('Error', 'Failed to send verification code');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveEmail = () => {
    Alert.alert(
      'Remove Email',
      'Are you sure you want to remove your email address? This may affect your ability to recover your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setEmail('');
            setIsEmailVerified(false);
            Alert.alert('Email Removed', 'Your email address has been removed from your account.');
          },
        },
      ]
    );
  };

  const handleRemovePhone = () => {
    Alert.alert(
      'Remove Phone',
      'Are you sure you want to remove your phone number? This may affect your ability to recover your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhone('');
            setIsPhoneVerified(false);
            Alert.alert('Phone Removed', 'Your phone number has been removed from your account.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email & Phone</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.accent.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure your account</Text>
            <Text style={styles.infoDescription}>
              Add and verify your email and phone number to help secure your account and recover it if needed.
            </Text>
          </View>
        </View>

        {/* Email Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Address</Text>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail" size={20} color={colors.accent.primary} />
            </View>
            
            <View style={styles.contactInfo}>
              {editingEmail ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email address"
                    placeholderTextColor={colors.text.secondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setEditingEmail(false);
                        loadUserInfo(); // Reset to original value
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleEmailUpdate}
                      disabled={loading}
                    >
                      {loading ? (
                        <InlineLoadingSkeleton />
                      ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.contactHeader}>
                    <Text style={styles.contactValue}>
                      {email || 'No email added'}
                    </Text>
                    {email && (
                      <View style={[
                        styles.verificationBadge,
                        isEmailVerified ? styles.verifiedBadge : styles.unverifiedBadge
                      ]}>
                        <Text style={[
                          styles.verificationText,
                          isEmailVerified ? styles.verifiedText : styles.unverifiedText
                        ]}>
                          {isEmailVerified ? 'Verified' : 'Unverified'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setEditingEmail(true)}
                    >
                      <Text style={styles.actionButtonText}>
                        {email ? 'Change' : 'Add Email'}
                      </Text>
                    </TouchableOpacity>
                    
                    {email && !isEmailVerified && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleEmailVerification}
                      >
                        <Text style={styles.actionButtonText}>Verify</Text>
                      </TouchableOpacity>
                    )}
                    
                    {email && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={handleRemoveEmail}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Phone Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone Number</Text>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIcon}>
              <Ionicons name="call" size={20} color={colors.accent.primary} />
            </View>
            
            <View style={styles.contactInfo}>
              {editingPhone ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.text.secondary}
                    keyboardType="phone-pad"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setEditingPhone(false);
                        loadUserInfo(); // Reset to original value
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handlePhoneUpdate}
                      disabled={loading}
                    >
                      {loading ? (
                        <InlineLoadingSkeleton />
                      ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.contactHeader}>
                    <Text style={styles.contactValue}>
                      {phone || 'No phone number added'}
                    </Text>
                    {phone && (
                      <View style={[
                        styles.verificationBadge,
                        isPhoneVerified ? styles.verifiedBadge : styles.unverifiedBadge
                      ]}>
                        <Text style={[
                          styles.verificationText,
                          isPhoneVerified ? styles.verifiedText : styles.unverifiedText
                        ]}>
                          {isPhoneVerified ? 'Verified' : 'Unverified'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setEditingPhone(true)}
                    >
                      <Text style={styles.actionButtonText}>
                        {phone ? 'Change' : 'Add Phone'}
                      </Text>
                    </TouchableOpacity>
                    
                    {phone && !isPhoneVerified && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handlePhoneVerification}
                      >
                        <Text style={styles.actionButtonText}>Verify</Text>
                      </TouchableOpacity>
                    )}
                    
                    {phone && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={handleRemovePhone}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.noteText}>
            We recommend verifying both your email and phone number to ensure you can always access your account. This information is kept private and secure.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  contactValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  verificationBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
  },
  unverifiedBadge: {
    backgroundColor: '#F59E0B',
  },
  verificationText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as any,
  },
  verifiedText: {
    color: 'white',
  },
  unverifiedText: {
    color: 'white',
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  removeButtonText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  editContainer: {
    gap: spacing.md,
  },
  editInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as any,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

