import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QuantitySelector from '../components/QuantitySelector';
import { CartItem, useCart } from '../contexts/CartContext';

export default function CartScreen() {
    const { items, removeFromCart, updateQuantity, totalAmount } = useCart();
    const router = useRouter();

    const theme = useMemo(() => ({
        bg: '#8B0000',
        card: '#a11212',
        text: '#FFFFFF',
        subtext: '#FFCCCC',
        border: '#c13030',
        accent: '#FFD700',
        danger: '#ff6666'
    }), []);

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
                <Text style={[styles.details, { color: theme.subtext }]}>{item.price.toLocaleString()} FCFA each</Text>
                <Text style={[styles.subtotal, { color: theme.accent }]}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>

                <View style={styles.quantityRow}>
                    <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                        onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                        accentColor={theme.accent}
                        textColor={theme.text}
                    />
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={20} color={theme.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" />
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
            />
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
                    <Text style={[styles.totalValue, { color: theme.accent }]}>{totalAmount.toLocaleString()} FCFA</Text>
                </View>
                <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: theme.accent }]} onPress={() => router.push('/checkout')}>
                    <Text style={[styles.checkoutText, { color: '#8B0000' }]}>Proceed to Checkout</Text>
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
    itemContainer: { flexDirection: 'row', padding: 12, borderRadius: 16, marginBottom: 12, alignItems: 'flex-start', elevation: 3 },
    image: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
    info: { flex: 1 },
    name: { fontWeight: '700', fontSize: 15 },
    details: { marginTop: 2, fontSize: 13 },
    subtotal: { fontWeight: 'bold', marginTop: 2, fontSize: 14 },
    quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    deleteBtn: { padding: 4 },
    footer: { padding: 20, borderTopWidth: 1, elevation: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    totalLabel: { fontSize: 18, fontWeight: '600' },
    totalValue: { fontSize: 20, fontWeight: 'bold' },
    checkoutButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    checkoutText: { fontWeight: 'bold', fontSize: 16 },
});
