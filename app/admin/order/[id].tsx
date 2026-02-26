import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { supabase } from '../../../lib/supabase';
import FeedbackOverlay from '../../components/animations/FeedbackOverlay';

export default function AdminOrderDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [payment, setPayment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ visible: boolean, type: 'success' | 'error', message: string }>({ visible: false, type: 'success', message: '' });

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: '#8B0000',
        card: '#a11212',
        text: '#FFFFFF',
        subtext: '#FFCCCC',
        accent: '#FFD700',
        border: '#c13030',
        success: '#4caf50',
        warning: '#ff9800',
        danger: '#ff4444',
    }), []);

    useEffect(() => {
        if (id) fetchOrderDetails();
    }, [id]);

    async function fetchOrderDetails() {
        setLoading(true);
        const { data: orderData } = await supabase.from('orders').select('*').eq('id', id).single();
        const { data: itemsData } = await supabase.from('order_items').select('*, products(name)').eq('order_id', id);
        const { data: paymentData } = await supabase.from('payments').select('*').eq('order_id', id).single();

        setOrder(orderData);
        setItems(itemsData || []);
        setPayment(paymentData);
        setLoading(false);
    }

    async function verifyPayment() {
        Alert.alert('Verify Payment', 'Approve this order and send to delivery dashboard?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve & Dispatch', onPress: async () => {
                    setFeedback({ visible: true, type: 'success', message: 'Order Dispatched!' });
                    if (payment) {
                        await supabase.from('payments').update({ status: 'verified' }).eq('id', payment.id);
                    }
                    // Auto-push to delivery by setting status to approved_for_delivery
                    await supabase.from('orders').update({ status: 'approved_for_delivery' }).eq('id', order.id);
                }
            }
        ]);
    }

    async function dispatchForDelivery() {
        setFeedback({ visible: true, type: 'success', message: 'Sent to Deliveries!' });
        await supabase.from('orders').update({ status: 'approved_for_delivery' }).eq('id', order.id);
    }

    async function rejectOrder() {
        Alert.alert('Reject Order', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Reject', onPress: async () => {
                    setFeedback({ visible: true, type: 'error', message: 'Order Rejected' });
                    await supabase.from('orders').update({ status: 'rejected' }).eq('id', order.id);
                    if (payment) await supabase.from('payments').update({ status: 'rejected' }).eq('id', payment.id);
                }
            }
        ]);
    }

    if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
    if (!order) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Order not found</Text></View>;

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <FeedbackOverlay
                visible={feedback.visible}
                type={feedback.type}
                message={feedback.message}
                onFinish={() => router.back()}
            />
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.title, { color: theme.accent }]}>Order #{order.id.substring(0, 8).toUpperCase()}</Text>
                <View style={styles.statusRow}>
                    <Text style={{ color: theme.text, fontSize: 14 }}>Status:</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 4 }}>Date: {new Date(order.created_at).toLocaleString()}</Text>
                <Text style={[styles.amount, { color: theme.text }]}>Total: <Text style={{ color: theme.accent }}>{order.total_amount?.toLocaleString()} FCFA</Text></Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Items</Text>
                {items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={{ color: theme.text }}>{item.quantity} x {item.products?.name}</Text>
                        <Text style={{ color: theme.text }}>{item.price_at_purchase.toLocaleString()} FCFA</Text>
                    </View>
                ))}
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Payment Info</Text>
                {payment ? (
                    <>
                        <Text style={{ color: theme.text }}>Method: Bank Transfer</Text>
                        <Text style={[styles.txnId, { color: theme.text }]}>Transaction ID: {payment.transaction_id}</Text>
                        <Text style={{ color: theme.text }}>Status: {payment.status}</Text>
                    </>
                ) : (
                    <Text style={{ fontStyle: 'italic', color: theme.subtext }}>No digital payment record found (Mock Mode).</Text>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {order.status === 'paid_waiting_verification' && (
                    <>
                        <TouchableOpacity style={[styles.btn, styles.approveButton]} onPress={verifyPayment}>
                            <Text style={styles.btnText}>Verify & Dispatch for Delivery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.rejectButton]} onPress={rejectOrder}>
                            <Text style={styles.btnText}>Reject Order</Text>
                        </TouchableOpacity>
                    </>
                )}

                {order.status === 'approved' && (
                    <TouchableOpacity style={[styles.btn, styles.dispatchButton]} onPress={dispatchForDelivery}>
                        <Text style={styles.btnText}>Push to Delivery Man Dashboard</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: { padding: 18, marginBottom: 16, borderRadius: 16, elevation: 2 },
    title: { fontSize: 22, fontWeight: '900', marginBottom: 12 },

    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
    statusBadge: { backgroundColor: '#6b0000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#c13030' },
    statusText: { color: '#FFD700', fontSize: 11, fontWeight: '800' },

    amount: { fontSize: 18, fontWeight: '800', marginTop: 12 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, backgroundColor: '#8B0000', padding: 10, borderRadius: 8 },
    txnId: { fontWeight: '700', fontSize: 14, marginVertical: 6, backgroundColor: '#8B0000', padding: 8, borderRadius: 6 },

    actionContainer: { marginTop: 10, gap: 12, paddingBottom: 40 },
    btn: { padding: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
    approveButton: { backgroundColor: '#4caf50' },
    rejectButton: { backgroundColor: '#ff4444' },
    dispatchButton: { backgroundColor: '#FFD700' },
    btnText: { color: '#8B0000', fontWeight: '900', fontSize: 16 }
});
