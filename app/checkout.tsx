import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

export default function CheckoutScreen() {
    const { items, totalAmount, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const theme = useMemo(() => ({
        bg: '#8B0000', card: '#a11212', deep: '#6b0000',
        text: '#FFFFFF', subtext: '#FFCCCC', border: '#c13030', accent: '#FFD700',
    }), []);

    const [shippingAddress, setShippingAddress] = useState('');
    const [deliveryLat, setDeliveryLat] = useState<number | undefined>();
    const [deliveryLng, setDeliveryLng] = useState<number | undefined>();
    const [momoNumber, setMomoNumber] = useState('');
    const [paymentOperator, setPaymentOperator] = useState<'MTN' | 'ORANGE'>('MTN');
    const [loading, setLoading] = useState(false);
    const [paymentStatusText, setPaymentStatusText] = useState('');

    const handleAddressSelect = (address: string, lat?: number, lng?: number) => {
        setShippingAddress(address);
        setDeliveryLat(lat);
        setDeliveryLng(lng);
    };

    async function placeOrder() {
        if (!shippingAddress.trim() || !momoNumber.trim()) {
            Alert.alert('Missing Info', 'Please provide a delivery address and your Mobile Money number.');
            return;
        }

        setLoading(true);
        setPaymentStatusText('Initiating real-time payment...');
        try {
            // Simulate Real-time Mobile Money Payment (USSD Push delay)
            await new Promise(resolve => setTimeout(resolve, 1500));
            setPaymentStatusText('Check your phone to PIN confirm...');
            await new Promise(resolve => setTimeout(resolve, 3500));
            setPaymentStatusText('Payment successful! Processing...');

            const orderPayload: any = {
                user_id: user.id,
                total_amount: totalAmount,
                status: 'paid_waiting_verification',
                shipping_address: shippingAddress,
                total_items: items.reduce((sum, i) => sum + i.quantity, 0),
            };

            // Store coordinates if user selected from map (used by live tracking)
            if (deliveryLat !== undefined) orderPayload.delivery_lat = deliveryLat;
            if (deliveryLng !== undefined) orderPayload.delivery_lng = deliveryLng;

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert(orderPayload)
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: item.price,
            }));
            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            const { error: paymentError } = await supabase.from('payments').insert({
                order_id: orderData.id,
                user_id: user.id,
                amount: totalAmount,
                transaction_id: `MOMO-${paymentOperator}-${Date.now().toString().slice(-8)}`,
                status: 'pending',
                proof_image_url: null,
            });
            if (paymentError) throw paymentError;

            Alert.alert('✅ Payment Successful!', 'Your order has been placed and paid successfully.', [
                { text: 'OK', onPress: () => { clearCart(); router.replace('/(tabs)/orders'); } },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
            setPaymentStatusText('');
        }
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
            <StatusBar barStyle="light-content" />

            {/* Order Summary */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>Order Summary</Text>
                {items.map(item => (
                    <View key={item.id} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.itemQty, { color: theme.subtext }]}>x{item.quantity}</Text>
                        <Text style={[styles.itemPrice, { color: theme.accent }]}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
                    </View>
                ))}
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                    <Text style={[styles.totalValue, { color: theme.accent }]}>{totalAmount.toLocaleString()} FCFA</Text>
                </View>
            </View>

            {/* Delivery Address with Autocomplete */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>Delivery Address</Text>
                <Text style={[styles.fieldHint, { color: theme.subtext }]}>
                    Start typing to search for your address on the map
                </Text>
                <AddressAutocomplete
                    value={shippingAddress}
                    onChange={handleAddressSelect}
                />
                {deliveryLat !== undefined && (
                    <View style={styles.pinConfirm}>
                        <Text style={styles.pinConfirmText}>📍 Location pinned on map</Text>
                    </View>
                )}
            </View>

            {/* Mobile Money Payment */}
            <View style={[styles.section, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>Mobile Money</Text>

                <View style={styles.operatorContainer}>
                    <TouchableOpacity
                        style={[styles.operatorBtn, paymentOperator === 'MTN' && styles.operatorBtnActive, { borderColor: paymentOperator === 'MTN' ? '#FFCC00' : theme.deep }]}
                        onPress={() => setPaymentOperator('MTN')}
                        activeOpacity={0.8}
                    >
                        <Image source={require('../assets/images/mtn.png')} style={styles.operatorLogo} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.operatorBtn, paymentOperator === 'ORANGE' && styles.operatorBtnActive, { borderColor: paymentOperator === 'ORANGE' ? '#FF6600' : theme.deep }]}
                        onPress={() => setPaymentOperator('ORANGE')}
                        activeOpacity={0.8}
                    >
                        <Image source={require('../assets/images/orange.png')} style={styles.operatorLogo} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, { color: theme.subtext }]}>{paymentOperator} Phone Number</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.deep, borderColor: theme.border, color: theme.text }]}
                    placeholder={`e.g. 6${paymentOperator === 'MTN' ? '7' : '9'}X XX XX XX`}
                    placeholderTextColor={theme.subtext}
                    keyboardType="phone-pad"
                    value={momoNumber}
                    onChangeText={setMomoNumber}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={placeOrder}
                disabled={loading}
                activeOpacity={0.85}
            >
                {loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator color="#8B0000" style={{ marginRight: 10 }} />
                        <Text style={styles.buttonText}>{paymentStatusText || 'Processing...'}</Text>
                    </View>
                ) : (
                    <Text style={styles.buttonText}>Pay with {paymentOperator === 'MTN' ? 'MTN MoMo' : 'Orange Money'}</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 60 },

    section: { borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    fieldHint: { fontSize: 12, marginBottom: 10 },
    fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 14 },

    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
    itemName: { flex: 1, fontSize: 14, fontWeight: '500' },
    itemQty: { fontSize: 13, marginHorizontal: 8 },
    itemPrice: { fontSize: 14, fontWeight: '700' },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12 },
    totalLabel: { fontSize: 17, fontWeight: '700' },
    totalValue: { fontSize: 19, fontWeight: '900' },

    pinConfirm: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#4caf5022', borderRadius: 8, padding: 8 },
    pinConfirmText: { color: '#4caf50', fontSize: 12, fontWeight: '600' },

    input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 14 },

    operatorContainer: { flexDirection: 'row', gap: 12, marginTop: 5, marginBottom: 10 },
    operatorBtn: { flex: 1, borderWidth: 2, borderRadius: 12, padding: 0, height: 110, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', overflow: 'hidden' },
    operatorBtnActive: { borderWidth: 4 },
    operatorLogo: { width: '100%', height: '100%', resizeMode: 'cover' },

    button: {
        backgroundColor: '#FFD700',
        padding: 18, borderRadius: 14,
        alignItems: 'center', elevation: 6,
        shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    buttonText: { color: '#8B0000', fontWeight: '800', fontSize: 16 },
});
