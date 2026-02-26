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
        bg: '#8B0000',
        card: '#a11212',
        text: '#FFFFFF',
        subtext: '#FFCCCC',
        accent: '#FFD700',
        border: '#c13030',
        danger: '#ff4444',
    }), []);

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
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.category, { color: theme.subtext }]}>{item.categories?.name}</Text>
                <Text style={[styles.price, { color: theme.accent }]}>{item.price.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => router.push(`/admin/edit-product/${item.id}`)} style={[styles.actionBtn, { backgroundColor: '#8B0000' }]}>
                    <Ionicons name="pencil" size={18} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteProduct(item.id)} style={[styles.actionBtn, { backgroundColor: '#8B0000' }]}>
                    <Ionicons name="trash" size={18} color={theme.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: '#fff' }]}>Products</Text>
                <TouchableOpacity onPress={() => router.push('/admin/add-product')} style={styles.backBtn}>
                    <Ionicons name="add" size={28} color={theme.accent} />
                </TouchableOpacity>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#6b0000', borderBottomWidth: 1, borderBottomColor: '#c13030' },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 22, fontWeight: '900' },
    card: { flexDirection: 'row', padding: 14, marginBottom: 12, borderRadius: 20, elevation: 2, alignItems: 'center', borderWidth: 1 },
    image: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#6b0000' },
    info: { flex: 1, marginLeft: 14, gap: 2 },
    name: { fontWeight: '800', fontSize: 16 },
    category: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    price: { fontWeight: '900', marginTop: 4, fontSize: 13 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#c13030' },
    empty: { alignItems: 'center', marginTop: 60 }
});
