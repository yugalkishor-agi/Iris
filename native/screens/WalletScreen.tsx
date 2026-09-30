import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../styles/theme';
import { FlashList } from '@shopify/flash-list';

interface Transaction {
  id: string;
  type: 'received' | 'sent' | 'purchase' | 'refund' | 'tip' | 'earning';
  amount: number;
  currency: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  from?: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
  };
  to?: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
  };
  metadata?: {
    postId?: string;
    productId?: string;
    eventId?: string;
  };
}

interface WalletData {
  balance: number;
  currency: string;
  totalEarnings: number;
  totalSpent: number;
  pendingAmount: number;
}

export default function WalletScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'sent'>('all');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Mock wallet data
      const mockWallet: WalletData = {
        balance: 1247.50,
        currency: 'USD',
        totalEarnings: 3456.78,
        totalSpent: 2209.28,
        pendingAmount: 125.00,
      };
      
      // Mock transactions
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'received',
          amount: 25.00,
          currency: 'USD',
          description: 'Tip for your amazing post',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'completed',
          from: {
            userId: 'user1',
            username: 'john_doe',
            displayName: 'John Doe',
            avatarURL: 'https://via.placeholder.com/100',
          },
          metadata: { postId: 'post123' },
        },
        {
          id: '2',
          type: 'purchase',
          amount: -15.99,
          currency: 'USD',
          description: 'Premium subscription',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          status: 'completed',
        },
        {
          id: '3',
          type: 'earning',
          amount: 50.00,
          currency: 'USD',
          description: 'Creator fund payout',
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          status: 'completed',
        },
        {
          id: '4',
          type: 'sent',
          amount: -10.00,
          currency: 'USD',
          description: 'Tip to @artist_jane',
          timestamp: new Date(Date.now() - 259200000), // 3 days ago
          status: 'completed',
          to: {
            userId: 'user2',
            username: 'artist_jane',
            displayName: 'Jane Artist',
            avatarURL: 'https://via.placeholder.com/100',
          },
          metadata: { postId: 'post456' },
        },
        {
          id: '5',
          type: 'purchase',
          amount: -89.99,
          currency: 'USD',
          description: 'Vintage Leather Jacket',
          timestamp: new Date(Date.now() - 345600000), // 4 days ago
          status: 'completed',
          metadata: { productId: 'prod789' },
        },
        {
          id: '6',
          type: 'received',
          amount: 75.00,
          currency: 'USD',
          description: 'Payment pending verification',
          timestamp: new Date(Date.now() - 432000000), // 5 days ago
          status: 'pending',
          from: {
            userId: 'user3',
            username: 'buyer123',
            displayName: 'Buyer User',
            avatarURL: 'https://via.placeholder.com/100',
          },
        },
      ];
      
      setWallet(mockWallet);
      
      // Filter transactions based on active tab
      let filteredTransactions = mockTransactions;
      switch (activeTab) {
        case 'received':
          filteredTransactions = mockTransactions.filter(t => 
            ['received', 'earning', 'refund'].includes(t.type)
          );
          break;
        case 'sent':
          filteredTransactions = mockTransactions.filter(t => 
            ['sent', 'purchase'].includes(t.type)
          );
          break;
      }
      
      setTransactions(filteredTransactions);
      console.log('💰 Loaded wallet data');
      
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleAddMoney = () => {
    (navigation as any).navigate('AddMoney');
  };

  const handleSendMoney = () => {
    (navigation as any).navigate('SendMoney');
  };

  const handleWithdraw = () => {
    if (!wallet || wallet.balance < 10) {
      Alert.alert('Insufficient Balance', 'Minimum withdrawal amount is $10');
      return;
    }
    (navigation as any).navigate('Withdraw');
  };

  const handleTransactionPress = (transaction: Transaction) => {
    (navigation as any).navigate('TransactionDetails', { transactionId: transaction.id });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'received': return 'arrow-down-circle';
      case 'sent': return 'arrow-up-circle';
      case 'purchase': return 'bag';
      case 'refund': return 'refresh-circle';
      case 'tip': return 'heart-circle';
      case 'earning': return 'trophy';
      default: return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return '#10b981'; // Green for positive
    return '#ef4444'; // Red for negative
  };

  const formatAmount = (amount: number, currency: string) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => handleTransactionPress(item)}
    >
      <View style={[
        styles.transactionIcon,
        { backgroundColor: getTransactionColor(item.type, item.amount) + '20' }
      ]}>
        <Ionicons 
          name={getTransactionIcon(item.type) as any} 
          size={24} 
          color={getTransactionColor(item.type, item.amount)} 
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionTime}>{formatDate(item.timestamp)}</Text>
          {item.status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
          {item.status === 'failed' && (
            <View style={styles.failedBadge}>
              <Text style={styles.failedText}>Failed</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { color: getTransactionColor(item.type, item.amount) }
        ]}>
          {formatAmount(item.amount, item.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('WalletSettings')}>
          <Ionicons name="settings-outline" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity>
              <Ionicons name="eye-outline" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.balanceAmount}>
            ${wallet?.balance.toFixed(2)}
          </Text>
          
          {wallet && wallet.pendingAmount > 0 && (
            <Text style={styles.pendingAmount}>
              ${wallet.pendingAmount.toFixed(2)} pending
            </Text>
          )}
          
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddMoney}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add Money</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSendMoney}>
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleWithdraw}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValue}>
              ${wallet?.totalEarnings.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>
              ${wallet?.totalSpent.toFixed(2)}
            </Text>
          </View>
        </View>
        
        {/* Transaction Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'received', label: 'Received' },
            { key: 'sent', label: 'Sent' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab.key as any);
                loadWalletData();
              }}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptySubtitle}>
                Your transaction history will appear here
              </Text>
            </View>
          ) : (
            <FlashList estimatedItemSize={100}
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.transactionsList as any}
            />
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  balanceCard: {
    backgroundColor: colors.accent.primary,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceLabel: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold as any,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  pendingAmount: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    gap: spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: 16,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.accent.primary,
  },
  transactionsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  transactionsList: {
    gap: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  transactionTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
    fontWeight: typography.fontWeight.medium as any,
  },
  failedBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  failedText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
    fontWeight: typography.fontWeight.medium as any,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
