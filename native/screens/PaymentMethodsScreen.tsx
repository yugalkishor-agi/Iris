import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { FlashList } from '@shopify/flash-list';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      
      // Mock payment methods - in production, this would come from payment service
      const mockMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
        {
          id: '2',
          type: 'paypal',
          email: 'user@example.com',
          isDefault: false,
        },
        {
          id: '3',
          type: 'apple_pay',
          isDefault: false,
        },
      ];

      setPaymentMethods(mockMethods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'card':
        return 'card';
      case 'paypal':
        return 'logo-paypal';
      case 'apple_pay':
        return 'logo-apple';
      case 'google_pay':
        return 'logo-google';
      default:
        return 'card';
    }
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `${method.brand} •••• ${method.last4}`;
      case 'paypal':
        return `PayPal (${method.email})`;
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return 'Unknown';
    }
  };

  const getPaymentMethodDetails = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `Expires ${method.expiryMonth}/${method.expiryYear}`;
      case 'paypal':
        return 'PayPal account';
      case 'apple_pay':
        return 'Touch ID or Face ID';
      case 'google_pay':
        return 'Google account';
      default:
        return '';
    }
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose a payment method to add',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Credit/Debit Card', onPress: () => handleAddCard() },
        { text: 'PayPal', onPress: () => handleAddPayPal() },
        { text: 'Apple Pay', onPress: () => handleAddApplePay() },
      ]
    );
  };

  const handleAddCard = () => {
    Alert.alert('Add Card', 'Card addition feature coming soon!');
  };

  const handleAddPayPal = () => {
    Alert.alert('Add PayPal', 'PayPal integration coming soon!');
  };

  const handleAddApplePay = () => {
    Alert.alert('Add Apple Pay', 'Apple Pay integration coming soon!');
  };

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      }))
    );
    Alert.alert('Default Updated', 'Default payment method has been updated');
  };

  const handleRemovePaymentMethod = (method: PaymentMethod) => {
    if (method.isDefault && paymentMethods.length > 1) {
      Alert.alert(
        'Cannot Remove',
        'You cannot remove your default payment method. Please set another method as default first.'
      );
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${getPaymentMethodName(method)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(methods => methods.filter(m => m.id !== method.id));
            Alert.alert('Payment Method Removed', 'The payment method has been removed');
          },
        },
      ]
    );
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.paymentMethodItem}>
      <View style={styles.paymentMethodIcon}>
        <Ionicons 
          name={getPaymentMethodIcon(item.type) as any} 
          size={24} 
          color={colors.accent.primary} 
        />
      </View>
      
      <View style={styles.paymentMethodInfo}>
        <View style={styles.paymentMethodHeader}>
          <Text style={styles.paymentMethodName}>
            {getPaymentMethodName(item)}
          </Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.paymentMethodDetails}>
          {getPaymentMethodDetails(item)}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => {
          Alert.alert(
            'Payment Method Options',
            `What would you like to do with ${getPaymentMethodName(item)}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              ...(!item.isDefault ? [{ text: 'Set as Default', onPress: () => handleSetDefault(item.id) }] : []),
              { text: 'Remove', style: 'destructive', onPress: () => handleRemovePaymentMethod(item) },
            ]
          );
        }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddPaymentMethod}>
          <Ionicons name="add" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.accent.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure payments</Text>
            <Text style={styles.infoDescription}>
              Your payment information is encrypted and secure. Add multiple payment methods for convenience.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Payment Methods</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddPaymentMethod}>
              <Ionicons name="add-circle" size={20} color={colors.accent.primary} />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {paymentMethods.length > 0 ? (
            <FlashList estimatedItemSize={100}
              data={paymentMethods}
              renderItem={renderPaymentMethod}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.paymentMethodsList as any}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No payment methods</Text>
              <Text style={styles.emptySubtext}>Add a payment method to get started</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddPaymentMethod}>
                <Text style={styles.emptyButtonText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="location" size={20} color={colors.accent.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Billing Address</Text>
              <Text style={styles.settingDescription}>Manage your billing address</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="receipt" size={20} color={colors.accent.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Purchase History</Text>
              <Text style={styles.settingDescription}>View your transaction history</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-text" size={20} color={colors.accent.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Invoices & Receipts</Text>
              <Text style={styles.settingDescription}>Download invoices and receipts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color={colors.text.secondary} />
          <Text style={styles.noteText}>
            All payments are processed securely. We never store your full payment information on our servers.
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold as any,
  },
  paymentMethodsList: {
    gap: spacing.md,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  paymentMethodName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold as any,
  },
  paymentMethodDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  moreButton: {
    padding: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.secondary,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  emptyButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
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
