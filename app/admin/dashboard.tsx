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
        bg: '#8B0000',
        headerBg: '#6b0000',
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
            case 'paid_waiting_verification': return { bg: 'rgba(255, 152, 0, 0.2)', color: theme.warning, label: 'Verify Payment' };
            case 'approved': return { bg: 'rgba(76, 175, 80, 0.2)', color: theme.success, label: 'Approved' };
            case 'approved_for_delivery': return { bg: 'rgba(76, 175, 80, 0.2)', color: theme.success, label: 'Dispatched' };
            case 'out_for_delivery': return { bg: 'rgba(76, 175, 80, 0.2)', color: theme.success, label: 'In Transit' };
            case 'delivered': return { bg: 'rgba(76, 175, 80, 0.3)', color: theme.success, label: 'Delivered' };
            default: return { bg: '#6b0000', color: theme.subtext, label: status.replace(/_/g, ' ').toUpperCase() };
        }
    };

    const renderOrder = ({ item }: { item: any }) => {
        const { bg, color, label } = getStatusStyle(item.status);

        return (
            <Link href={`/admin/order/${item.id}`} asChild>
                <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.orderInfo}>
                            <Text style={[styles.orderId, { color: theme.text }]}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                            <View style={styles.dateRow}>
                                <Ionicons name="time-outline" size={12} color={theme.subtext} />
                                <Text style={[styles.date, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                            <Text style={[styles.statusText, { color: color }]}>{label}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.cardBody}>
                        <View style={styles.custBox}>
                            <Text style={[styles.label, { color: theme.subtext }]}>CUSTOMER</Text>
                            <Text style={[styles.value, { color: theme.text }]}>{item.user_profiles?.full_name || 'Anonymous'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.label, { color: theme.subtext }]}>TOTAL</Text>
                            <Text style={[styles.amount, { color: theme.accent }]}>{item.total_amount?.toLocaleString()} FCFA</Text>
                        </View>
                    </View>

                    {item.status === 'paid_waiting_verification' && (
                        <View style={[styles.alertBox, { borderColor: theme.warning, backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                            <Ionicons name="shield-checkmark" size={16} color={theme.warning} />
                            <Text style={[styles.alertText, { color: theme.warning }]}>Action Required: Verify Proof</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Link>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: '#fff' }]}>Admin Panel</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Orders Management</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Link href="/admin/products" asChild>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8B0000', borderColor: theme.border }]}>
                            <Ionicons name="cube-outline" size={20} color={theme.accent} />
                        </TouchableOpacity>
                    </Link>
                    <Link href="/admin/add-product" asChild>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]}>
                            <Ionicons name="add" size={26} color="#8B0000" />
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={theme.accent} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Ionicons name="list" size={18} color={theme.accent} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Orders</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, elevation: 4 },
    headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 13, fontWeight: '600' },
    actionBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 2 },

    listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 4 },
    sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    card: { borderRadius: 20, padding: 18, marginBottom: 16, elevation: 2, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderInfo: { gap: 2 },
    orderId: { fontSize: 16, fontWeight: '800' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    date: { fontSize: 12, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

    divider: { height: 1, marginVertical: 14, opacity: 0.3 },

    cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    custBox: { flex: 1 },
    label: { fontSize: 10, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
    value: { fontSize: 15, fontWeight: '700' },
    amount: { fontSize: 17, fontWeight: '900' },

    alertBox: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, gap: 10 },
    alertText: { fontSize: 12, fontWeight: '700' }
});
