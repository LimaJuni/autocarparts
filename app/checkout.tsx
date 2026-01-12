import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

export default function CheckoutScreen() {
    const { items, totalAmount, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#f8f9fa',
        card: isDark ? '#1E1E1E' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#333333',
        subtext: isDark ? '#AAAAAA' : '#666666',
        border: isDark ? '#333333' : '#cccccc',
        input: isDark ? '#2C2C2C' : '#ffffff',
        accent: '#007AFF',
        danger: '#d32f2f'
    }), [isDark]);

    const [shippingAddress, setShippingAddress] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);

    async function placeOrder() {
        if (!shippingAddress || !transactionId) {
            Alert.alert('Missing Info', 'Please provide shipping address and bank transaction ID.');
            return;
        }

        setLoading(true);
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_amount: totalAmount,
                    status: 'paid_waiting_verification',
                    shipping_address: shippingAddress
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    order_id: orderData.id,
                    user_id: user.id,
                    amount: totalAmount,
                    transaction_id: transactionId,
                    status: 'pending',
                    proof_image_url: null
                });

            if (paymentError) throw paymentError;

            Alert.alert('Success', 'Order placed! Waiting for manual payment verification.', [
                {
                    text: 'OK', onPress: () => {
                        clearCart();
                        router.replace('/(tabs)/orders');
                    }
                }
            ]);

        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={[styles.summary, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Order Summary</Text>
                <Text style={{ color: theme.text }}>Items: {items.length}</Text>
                <Text style={[styles.total, { color: theme.danger }]}>Total: {totalAmount.toLocaleString()} FCFA</Text>
            </View>

            <View style={[styles.form, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.text }]}>Shipping Address</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text, height: 80 }]}
                    multiline
                    placeholder="123 Street, City..."
                    placeholderTextColor={theme.subtext}
                    value={shippingAddress}
                    onChangeText={setShippingAddress}
                />

                <Text style={[styles.label, { color: theme.text }]}>Bank Transfer</Text>
                <View style={[styles.bankInfo, { backgroundColor: isDark ? '#2C3E50' : '#e3f2fd' }]}>
                    <Text style={{ fontWeight: 'bold', color: theme.text }}>Bank Name: AutoParts Bank</Text>
                    <Text style={{ color: theme.text }}>Account: 123-456-7890</Text>
                    <Text style={{ color: theme.text }}>Ref: {user?.id.substring(0, 8)}</Text>
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Transaction ID (Proof)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                    placeholder="Enter Bank Transaction ID"
                    placeholderTextColor={theme.subtext}
                    value={transactionId}
                    onChangeText={setTransactionId}
                />

                <TouchableOpacity style={styles.button} onPress={placeOrder} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Payment & Place Order</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    summary: { padding: 20, marginBottom: 10 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    total: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
    form: { padding: 20, flex: 1 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12 },
    bankInfo: { padding: 12, borderRadius: 8, marginBottom: 12 },
    button: { backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
