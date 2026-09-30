import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, TextInput, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography } from '../styles/theme';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const { width } = Dimensions.get('window');
const PRODUCT_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  category: string;
  seller: {
    userId: string;
    username: string;
    displayName: string;
    avatarURL?: string;
    verified?: boolean;
    rating: number;
  };
  stats: {
    views: number;
    likes: number;
    sold: number;
  };
  tags: string[];
  condition: 'new' | 'like-new' | 'good' | 'fair';
  shipping: {
    free: boolean;
    cost?: number;
    estimatedDays: number;
  };
  createdAt: Date;
  isLiked?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  productCount: number;
}

export default function ShopScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'popular'>('recent');

  useEffect(() => {
    loadShopData();
  }, [selectedCategory, sortBy]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      
      // Mock categories
      const mockCategories: Category[] = [
        { id: 'all', name: 'All', icon: 'grid-outline', color: colors.accent.primary, productCount: 1247 },
        { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline', color: '#3b82f6', productCount: 324 },
        { id: 'fashion', name: 'Fashion', icon: 'shirt-outline', color: '#ec4899', productCount: 189 },
        { id: 'home', name: 'Home & Garden', icon: 'home-outline', color: '#10b981', productCount: 156 },
        { id: 'sports', name: 'Sports', icon: 'fitness-outline', color: '#f59e0b', productCount: 98 },
        { id: 'books', name: 'Books', icon: 'book-outline', color: '#8b5cf6', productCount: 234 },
        { id: 'art', name: 'Art & Crafts', icon: 'brush-outline', color: '#ef4444', productCount: 67 },
        { id: 'music', name: 'Music', icon: 'musical-notes-outline', color: '#06b6d4', productCount: 89 },
      ];
      
      // Mock products
      const mockProducts: Product[] = [
        {
          id: '1',
          title: 'iPhone 15 Pro Max - Space Black',
          description: 'Brand new iPhone 15 Pro Max 256GB in Space Black. Unopened box with all accessories.',
          price: 1199,
          originalPrice: 1299,
          currency: 'USD',
          images: [
            'https://via.placeholder.com/400x400',
            'https://via.placeholder.com/400x400',
          ],
          category: 'electronics',
          seller: {
            userId: 'seller1',
            username: 'techdealer',
            displayName: 'Tech Dealer Pro',
            avatarURL: 'https://via.placeholder.com/100',
            verified: true,
            rating: 4.8,
          },
          stats: { views: 1247, likes: 89, sold: 12 },
          tags: ['iphone', 'apple', 'smartphone', 'new'],
          condition: 'new',
          shipping: { free: true, estimatedDays: 2 },
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Vintage Leather Jacket',
          description: 'Authentic vintage leather jacket from the 80s. Perfect condition, size M.',
          price: 89,
          currency: 'USD',
          images: ['https://via.placeholder.com/400x400'],
          category: 'fashion',
          seller: {
            userId: 'seller2',
            username: 'vintage_finds',
            displayName: 'Vintage Finds',
            avatarURL: 'https://via.placeholder.com/100',
            verified: false,
            rating: 4.5,
          },
          stats: { views: 456, likes: 34, sold: 3 },
          tags: ['vintage', 'leather', 'jacket', 'fashion'],
          condition: 'good',
          shipping: { free: false, cost: 15, estimatedDays: 5 },
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          id: '3',
          title: 'Handmade Ceramic Vase',
          description: 'Beautiful handmade ceramic vase, perfect for home decoration. Unique piece.',
          price: 45,
          currency: 'USD',
          images: ['https://via.placeholder.com/400x400'],
          category: 'art',
          seller: {
            userId: 'seller3',
            username: 'ceramic_artist',
            displayName: 'Ceramic Artist',
            avatarURL: 'https://via.placeholder.com/100',
            verified: true,
            rating: 4.9,
          },
          stats: { views: 234, likes: 18, sold: 1 },
          tags: ['handmade', 'ceramic', 'vase', 'art'],
          condition: 'new',
          shipping: { free: false, cost: 8, estimatedDays: 7 },
          createdAt: new Date(Date.now() - 172800000),
        },
      ];
      
      setCategories(mockCategories);
      
      // Filter and sort products
      let filteredProducts = selectedCategory === 'all' 
        ? mockProducts 
        : mockProducts.filter(p => p.category === selectedCategory);
      
      // Sort products
      switch (sortBy) {
        case 'price-low':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'popular':
          filteredProducts.sort((a, b) => (b.stats.views + b.stats.likes) - (a.stats.views + a.stats.likes));
          break;
        default:
          filteredProducts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      
      setProducts(filteredProducts);
      console.log('🛍️ Loaded shop products:', filteredProducts.length);
      
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShopData();
    setRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    (navigation as any).navigate('ProductDetails', { productId: product.id });
  };

  const handleSellerPress = (seller: any) => {
    (navigation as any).navigate('UserProfile', { userId: seller.userId });
  };

  const handleLikeProduct = (productId: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { 
            ...p, 
            isLiked: !p.isLiked,
            stats: { 
              ...p.stats, 
              likes: p.isLiked ? p.stats.likes - 1 : p.stats.likes + 1 
            }
          }
        : p
    ));
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategory,
        { borderColor: item.color }
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={24} color="#fff" />
      </View>
      <Text style={[
        styles.categoryName,
        selectedCategory === item.id && styles.selectedCategoryName
      ]}>
        {item.name}
      </Text>
      <Text style={styles.categoryCount}>{item.productCount}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        
        {/* Condition Badge */}
        <View style={[styles.conditionBadge, getConditionStyle(item.condition)]}>
          <Text style={styles.conditionText}>{item.condition.toUpperCase()}</Text>
        </View>
        
        {/* Like Button */}
        <TouchableOpacity 
          style={styles.likeButton}
          onPress={() => handleLikeProduct(item.id)}
        >
          <Ionicons 
            name={item.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={item.isLiked ? "#ff3040" : "#fff"} 
          />
        </TouchableOpacity>
        
        {/* Discount Badge */}
        {item.originalPrice && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -{Math.round((1 - item.price / item.originalPrice) * 100)}%
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.price}</Text>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>${item.originalPrice}</Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.sellerInfo}
          onPress={() => handleSellerPress(item.seller)}
        >
          <Image source={{ uri: item.seller.avatarURL }} style={styles.sellerAvatar} />
          <View style={styles.sellerText}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName} numberOfLines={1}>{item.seller.displayName}</Text>
              {item.seller.verified && (
                <VerifiedBadge size={14} />
              )}
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.rating}>{item.seller.rating}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.shippingInfo}>
          {item.shipping.free ? (
            <Text style={styles.freeShipping}>Free shipping</Text>
          ) : (
            <Text style={styles.shippingCost}>+${item.shipping.cost} shipping</Text>
          )}
          <Text style={styles.estimatedDays}>{item.shipping.estimatedDays} days</Text>
        </View>
        
        <View style={styles.productStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.stats.views}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.stats.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.stats.sold} sold</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getConditionStyle = (condition: string) => {
    switch (condition) {
      case 'new': return { backgroundColor: '#10b981' };
      case 'like-new': return { backgroundColor: '#3b82f6' };
      case 'good': return { backgroundColor: '#f59e0b' };
      case 'fair': return { backgroundColor: '#ef4444' };
      default: return { backgroundColor: colors.text.secondary };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Cart')}>
          <Ionicons name="bag-outline" size={28} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlashList estimatedItemSize={100}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList as any}
        />
      </View>
      
      {/* Sort Options */}
      <View style={styles.sortSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'recent', label: 'Recent' },
            { key: 'popular', label: 'Popular' },
            { key: 'price-low', label: 'Price: Low to High' },
            { key: 'price-high', label: 'Price: High to Low' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.sortOption, sortBy === option.key && styles.activeSortOption]}
              onPress={() => setSortBy(option.key as any)}
            >
              <Text style={[styles.sortText, sortBy === option.key && styles.activeSortText]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlashList estimatedItemSize={100}
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList as any}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  filterButton: {
    padding: spacing.xs,
  },
  categoriesSection: {
    marginBottom: spacing.md,
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.background.secondary,
    minWidth: 80,
  },
  selectedCategory: {
    backgroundColor: colors.background.primary,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: colors.accent.primary,
  },
  categoryCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sortSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    marginRight: spacing.sm,
  },
  activeSortOption: {
    backgroundColor: colors.accent.primary,
  },
  sortText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  activeSortText: {
    color: '#fff',
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
  productsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  productCard: {
    width: PRODUCT_WIDTH,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginRight: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: PRODUCT_WIDTH,
    resizeMode: 'cover',
  },
  conditionBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  likeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: spacing.xs,
  },
  discountBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#ff3040',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold as any,
  },
  productInfo: {
    padding: spacing.md,
  },
  productTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.accent.primary,
  },
  originalPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.xs,
  },
  sellerText: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  rating: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  shippingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  freeShipping: {
    fontSize: typography.fontSize.sm,
    color: '#10b981',
    fontWeight: typography.fontWeight.medium as any,
  },
  shippingCost: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  estimatedDays: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});

