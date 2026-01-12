import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#f8f9fa',
        headerBg: isDark ? '#1E1E1E' : '#ffffff',
        card: isDark ? '#1E1E1E' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#333333',
        subtext: isDark ? '#AAAAAA' : '#666666',
        accent: '#007AFF',
        border: isDark ? '#333333' : '#eeeeee',
        success: '#28a745',
        warning: '#ff9800',
        danger: '#dc3545',
        shadow: isDark ? '#000' : '#888'
    }), [isDark]);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, user_profiles(full_name)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid_waiting_verification': return { bg: 'rgba(255, 152, 0, 0.1)', color: theme.warning, label: 'Pending Verify' };
            case 'approved': return { bg: 'rgba(40, 167, 69, 0.1)', color: theme.success, label: 'Approved' };
            default: return { bg: isDark ? '#333' : '#eee', color: theme.subtext, label: status.replace(/_/g, ' ') };
        }
    };

    const renderOrder = ({ item }: { item: any }) => {
        const { bg, color, label } = getStatusStyle(item.status);

        return (
            <Link href={`/admin/order/${item.id}`} asChild>
                <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.orderInfo}>
                            <Text style={[styles.orderId, { color: theme.text }]}>#{item.id.substring(0, 8)}</Text>
                            <Text style={[styles.date, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                            <Text style={[styles.statusText, { color: color }]}>{label}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.cardBody}>
                        <View>
                            <Text style={[styles.label, { color: theme.subtext }]}>Customer</Text>
                            <Text style={[styles.value, { color: theme.text }]}>{item.user_profiles?.full_name}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.label, { color: theme.subtext }]}>Total</Text>
                            <Text style={[styles.amount, { color: theme.text }]}>{item.total_amount.toLocaleString()} FCFA</Text>
                        </View>
                    </View>

                    {item.status === 'paid_waiting_verification' && (
                        <View style={[styles.alertBox, { borderColor: theme.warning }]}>
                            <Ionicons name="alert-circle" size={16} color={theme.warning} />
                            <Text style={[styles.alertText, { color: theme.warning }]}>Payment Verification Needed</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Link>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Dashboard</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Overview & Orders</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Link href="/admin/products" asChild>
                        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.subtext }]}>
                            <Ionicons name="list" size={24} color="#fff" />
                        </TouchableOpacity>
                    </Link>
                    <Link href="/admin/add-product" asChild>
                        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.accent }]}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={theme.text} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListHeaderComponent={
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Orders</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, elevation: 2 },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    headerSubtitle: { fontSize: 14, marginTop: 4 },
    addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, marginLeft: 4 },

    card: { borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderInfo: { gap: 4 },
    orderId: { fontSize: 16, fontWeight: 'bold' },
    date: { fontSize: 12 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    divider: { height: 1, marginVertical: 12 },

    cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 12, marginBottom: 4 },
    value: { fontSize: 15, fontWeight: '600' },
    amount: { fontSize: 18, fontWeight: 'bold' },

    alertBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1, gap: 8, backgroundColor: 'rgba(255, 152, 0, 0.05)' },
    alertText: { fontSize: 13, fontWeight: '600' }
});
