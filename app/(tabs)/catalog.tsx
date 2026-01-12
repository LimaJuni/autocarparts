import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import FlyToCart from '../components/animations/FlyToCart';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = 12;
const ITEM_WIDTH = (width - (GAP * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

export default function CatalogScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { addToCart, items } = useCart();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    bg: isDark ? '#121212' : '#f8f9fa',
    card: isDark ? '#1E1E1E' : '#ffffff',
    text: isDark ? '#FFFFFF' : '#333333',
    subtext: isDark ? '#AAAAAA' : '#666666',
    border: isDark ? '#333333' : '#eeeeee',
    input: isDark ? '#2C2C2C' : '#ffffff',
    accent: '#007AFF',
    danger: '#ff4444'
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  }

  async function fetchProducts() {
    setLoading(true);
    let query = supabase.from('products').select('*');

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    else setProducts(data || []);
    setLoading(false);
  }

  // Animation State
  const [flyData, setFlyData] = useState<{ visible: boolean, start: { x: number, y: number }, end: { x: number, y: number } }>({ visible: false, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });
  const cartIconRef = React.useRef<View>(null);

  const handleAddToCart = (item: any, buttonRef: any) => {
    // 1. Get Button Coordinates
    buttonRef.measureInWindow((x: number, y: number, width: number, height: number) => {
      const startX = x + width / 2;
      const startY = y + height / 2;

      // 2. Get Cart Icon Coordinates
      cartIconRef.current?.measureInWindow((cx: number, cy: number, cWidth: number, cHeight: number) => {
        const endX = cx + cWidth / 2;
        const endY = cy + cHeight / 2;

        // 3. Trigger Animation
        setFlyData({ visible: true, start: { x: startX, y: startY }, end: { x: endX, y: endY } });

        // 4. Add to Cart Logic (slightly delayed or immediate)
        addToCart(item);
      });
    });
  };

  const renderProduct = ({ item, index }: { item: any, index: number }) => {
    // We need a ref for each button, we can use a callback Ref or just measure on press
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50).springify()}
        layout={Layout.springify()}
        style={[styles.card, { backgroundColor: theme.card, shadowColor: isDark ? '#000' : '#888' }]}
      >
        <Image source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} style={styles.image} />
        <View style={styles.cardContent}>
          <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.price, { color: theme.danger }]}>{item.price.toLocaleString()} FCFA</Text>

          <AddToCartButton theme={theme} onPress={(ref: any) => handleAddToCart(item, ref)} />

        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Fly Animation Layer */}
      {flyData.visible && (
        <FlyToCart
          startPos={flyData.start}
          endPos={flyData.end}
          onFinish={() => setFlyData(prev => ({ ...prev, visible: false }))}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.searchContainer, { backgroundColor: theme.input, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.subtext} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search items..."
            placeholderTextColor={theme.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
          <View ref={cartIconRef} style={[styles.iconCircle, { backgroundColor: theme.input }]}>
            <Ionicons name="cart" size={24} color={theme.accent} />
          </View>
          {items.length > 0 && (
            <Animated.View entering={FadeInUp.springify()} style={styles.badge}>
              <Text style={styles.badgeText}>{items.length}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={{ height: 60, marginBottom: 10 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All' }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          contentContainerStyle={{ paddingHorizontal: GAP, alignItems: 'center' }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === item.id ? theme.accent : theme.card,
                  borderColor: theme.border
                }
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === item.id ? '#fff' : theme.text }
              ]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={{ paddingHorizontal: GAP, paddingBottom: 100 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </SafeAreaView>
  );
}

// Helper Component for Ref Access
const AddToCartButton = React.memo(({ theme, onPress }: { theme: any, onPress: (ref: any) => void }) => {
  const buttonRef = React.useRef<View>(null);
  return (
    <TouchableOpacity
      ref={buttonRef} // Actually ref is not supported on TouchableOpacity directly in some versions, wrapping in View
      style={[styles.addButton, { backgroundColor: theme.accent }]}
      onPress={() => onPress(buttonRef.current)}
    >
      <View ref={buttonRef} collapsable={false} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="cart-outline" size={16} color="#fff" />
        <Text style={styles.addButtonText}>ADD</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500' },
  cartButton: { position: 'relative' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ff4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  categoryChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginRight: 10, borderWidth: 1, elevation: 1 },
  categoryText: { fontWeight: '600' },
  card: { borderRadius: 20, width: ITEM_WIDTH, marginBottom: GAP, overflow: 'hidden', elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  image: { width: '100%', height: 160, resizeMode: 'cover' },
  cardContent: { padding: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '700', marginBottom: 12, opacity: 0.8 },
  addButton: { paddingVertical: 10, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  addButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});
