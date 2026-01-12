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
        bg: isDark ? '#121212' : '#f4f4f4',
        card: isDark ? '#1E1E1E' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#333333',
        subtext: isDark ? '#AAAAAA' : '#666666',
        border: isDark ? '#333333' : '#eeeeee',
        success: '#28a745',
        danger: '#d32f2f',
    }), [isDark]);

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
        Alert.alert('Verify Payment', 'Are you sure you have received the funds in the bank?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Approve', onPress: async () => {
                    setFeedback({ visible: true, type: 'success', message: 'Order Approved!' });
                    if (payment) {
                        await supabase.from('payments').update({ status: 'verified' }).eq('id', payment.id);
                    }
                    await supabase.from('orders').update({ status: 'approved' }).eq('id', order.id);
                }
            }
        ]);
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
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Order #{order.id.substring(0, 8)}</Text>
                <Text style={{ color: theme.text }}>Status: <Text style={{ fontWeight: 'bold' }}>{order.status.toUpperCase()}</Text></Text>
                <Text style={{ color: theme.text }}>Date: {new Date(order.created_at).toLocaleString()}</Text>
                <Text style={[styles.amount, { color: theme.danger }]}>Total: {order.total_amount.toLocaleString()} FCFA</Text>
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

            {order.status === 'paid_waiting_verification' && (
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.approveButton} onPress={verifyPayment}>
                        <Text style={styles.btnText}>Verify Payment & Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton} onPress={rejectOrder}>
                        <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    card: { padding: 16, marginBottom: 16, borderRadius: 8, elevation: 1 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    amount: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    txnId: { fontWeight: 'bold', fontSize: 16, marginVertical: 4 },
    actionContainer: { marginTop: 20, gap: 10 },
    approveButton: { backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center' },
    rejectButton: { backgroundColor: '#d32f2f', padding: 16, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
