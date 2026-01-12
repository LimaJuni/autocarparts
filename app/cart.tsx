import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { CartItem, useCart } from '../contexts/CartContext';

export default function CartScreen() {
    const { items, removeFromCart, totalAmount } = useCart();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#f8f9fa',
        card: isDark ? '#1E1E1E' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#333333',
        subtext: isDark ? '#AAAAAA' : '#666666',
        border: isDark ? '#333333' : '#eeeeee',
        accent: '#007AFF',
        danger: '#ff4444'
    }), [isDark]);

    if (items.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
                <Ionicons name="cart-outline" size={64} color={theme.subtext} />
                <Text style={[styles.emptyText, { color: theme.text }]}>Your cart is empty</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={[styles.itemContainer, { backgroundColor: theme.card }]}>
            <Image source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} style={styles.image} />
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.details, { color: theme.subtext }]}>{item.price.toLocaleString()} FCFA x {item.quantity}</Text>
                <Text style={[styles.subtotal, { color: theme.accent }]}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Ionicons name="trash-outline" size={24} color={theme.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
                    <Text style={[styles.totalValue, { color: theme.danger }]}>{totalAmount.toLocaleString()} FCFA</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/checkout')}>
                    <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 16, fontSize: 18 },
    list: { padding: 16 },
    itemContainer: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center', elevation: 2 },
    image: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
    info: { flex: 1 },
    name: { fontWeight: '600', fontSize: 16 },
    details: { marginTop: 4 },
    subtotal: { fontWeight: 'bold', marginTop: 4 },
    footer: { padding: 20, borderTopWidth: 1, elevation: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    totalLabel: { fontSize: 18, fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: 'bold' },
    checkoutButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
    checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
