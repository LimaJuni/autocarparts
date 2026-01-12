import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function OrdersScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#f4f4f4',
        card: isDark ? '#1E1E1E' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#333333',
        subtext: isDark ? '#AAAAAA' : '#666666',
        border: isDark ? '#333333' : '#eeeeee',
    }), [isDark]);

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

    const renderOrder = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.row}>
                <Text style={[styles.orderId, { color: theme.text }]}>Order #{item.id.substring(0, 8)}</Text>
                <TouchableOpacity onPress={() => deleteOrder(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
            </View>
            <View style={styles.row}>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={[styles.date, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.amount, { color: theme.text }]}>Total: {item.total_amount.toLocaleString()} FCFA</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
    card: { padding: 16, marginBottom: 12, borderRadius: 8, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    orderId: { fontWeight: 'bold', fontSize: 16 },
    status: { fontWeight: 'bold', fontSize: 12 },
    amount: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    date: { fontSize: 12, marginTop: 4 },
});
