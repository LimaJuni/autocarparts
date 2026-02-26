import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function OrdersScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const router = useRouter();

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: '#8B0000',
        card: '#a11212',
        text: '#FFFFFF',
        subtext: '#FFCCCC',
        border: '#c13030',
    }), []);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    }

    async function deleteOrder(orderId: string) {
        Alert.alert('Delete Order', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    // Delete related items first (cascade usually handles this but safety first)
                    await supabase.from('order_items').delete().eq('order_id', orderId);
                    await supabase.from('payments').delete().eq('order_id', orderId);
                    const { error } = await supabase.from('orders').delete().eq('id', orderId);

                    if (error) Alert.alert('Error', error.message);
                    else fetchOrders();
                }
            }
        ]);
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid_waiting_verification': return 'orange';
            case 'approved': return 'green';
            case 'pending': return 'gray';
            default: return isDark ? '#fff' : '#333';
        }
    };

    const renderOrder = ({ item }: { item: any }) => {
        const isInDelivery = item.status === 'approved_for_delivery' || item.status === 'out_for_delivery';
        const isDelivered = item.status === 'delivered';

        return (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.row}>
                    <Text style={[styles.orderId, { color: theme.text }]}>Order #{item.id.substring(0, 8).toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => deleteOrder(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#ff6666" />
                    </TouchableOpacity>
                </View>
                <View style={styles.row}>
                    <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={[styles.date, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.amount, { color: theme.text }]}>Total: {item.total_amount.toLocaleString()} FCFA</Text>

                {/* Track Live Button — shown when order is in delivery */}
                {(isInDelivery) && (
                    <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => router.push(`/order/${item.id}`)}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="navigate" size={16} color="#8B0000" />
                        <Text style={styles.trackBtnText}>Track Delivery Live</Text>
                    </TouchableOpacity>
                )}

                {isDelivered && (
                    <View style={styles.deliveredBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                        <Text style={styles.deliveredText}>Delivered ✓</Text>
                    </View>
                )}
            </View>
        );
    };


    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={theme.text} />}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.subtext }}>No orders yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: { padding: 16, marginBottom: 12, borderRadius: 12, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    orderId: { fontWeight: 'bold', fontSize: 15 },
    status: { fontWeight: 'bold', fontSize: 11 },
    amount: { fontSize: 15, fontWeight: 'bold', marginTop: 4 },
    date: { fontSize: 12, marginTop: 4 },
    trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD700', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginTop: 10, alignSelf: 'flex-start' },
    trackBtnText: { color: '#8B0000', fontWeight: '800', fontSize: 13 },
    deliveredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    deliveredText: { color: '#4caf50', fontWeight: '700', fontSize: 13 },
});
