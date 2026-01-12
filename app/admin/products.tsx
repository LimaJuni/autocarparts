import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function ManageProductsScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#f8f9fa',
        card: isDark ? '#1E1E1E' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#333333',
        subtext: isDark ? '#AAAAAA' : '#666666',
        border: isDark ? '#333333' : '#eeeeee',
        danger: '#dc3545',
        accent: '#007AFF',
    }), [isDark]);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    }

    async function deleteProduct(id: string) {
        Alert.alert('Delete Product', 'Are you sure you want to delete this product? This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    attemptDelete(id);
                }
            }
        ]);
    }

    async function attemptDelete(id: string, force = false) {
        if (force) {
            // Delete related order items first
            await supabase.from('order_items').delete().eq('product_id', id);
        }

        const { error } = await supabase.from('products').delete().eq('id', id);

        if (error) {
            if (error.message.includes('foreign key constraint') || error.code === '23503') {
                Alert.alert(
                    'Product in Use',
                    'This product is part of existing orders. Deleting it will remove it from those order histories.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Force Delete',
                            style: 'destructive',
                            onPress: () => attemptDelete(id, true)
                        }
                    ]
                );
            } else {
                Alert.alert('Error', error.message);
            }
        } else {
            Alert.alert('Success', 'Product deleted');
            fetchProducts();
        }
    }

    const renderProduct = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.category, { color: theme.subtext }]}>{item.categories?.name}</Text>
                <Text style={[styles.price, { color: theme.accent }]}>{item.price.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => router.push(`/admin/edit-product/${item.id}`)} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={20} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteProduct(item.id)} style={styles.actionBtn}>
                    <Ionicons name="trash" size={20} color={theme.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Products</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProducts} tintColor={theme.text} />}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ color: theme.subtext }}>No products found.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    card: { flexDirection: 'row', padding: 12, marginBottom: 12, borderRadius: 12, elevation: 2, alignItems: 'center' },
    image: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
    info: { flex: 1, marginLeft: 12 },
    name: { fontWeight: 'bold', fontSize: 16 },
    category: { fontSize: 12, marginTop: 2 },
    price: { fontWeight: 'bold', marginTop: 4 },
    actions: { flexDirection: 'row', gap: 12 },
    actionBtn: { padding: 8 },
    empty: { alignItems: 'center', marginTop: 40 }
});
