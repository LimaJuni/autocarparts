import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

// Helper for formatting
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export default function AdminDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'action' | 'completed'>('all');

    // Original App Theme
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

    const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.total_amount || 0), 0), [orders]);
    const totalOrders = orders.length;
    const actionRequiredCount = useMemo(() => orders.filter(o => ['paid_waiting_verification', 'pending'].includes(o.status)).length, [orders]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid_waiting_verification': return { bg: 'rgba(255, 152, 0, 0.2)', color: theme.warning, label: 'Verify Payment' };
            case 'pending': return { bg: 'rgba(255, 152, 0, 0.2)', color: theme.warning, label: 'Pending' };
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
                <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.7}>
                    <View style={styles.cardHeader}>
                        <View style={styles.orderInfo}>
                            <Text style={[styles.orderId, { color: theme.text }]}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                            <Text style={[styles.customerName, { color: theme.subtext }]}>{item.user_profiles?.full_name || 'Anonymous User'}</Text>
                        </View>
                        <View style={styles.amountBox}>
                            <Text style={[styles.amount, { color: theme.accent }]}>{formatCurrency(item.total_amount)}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                                <View style={[styles.statusDot, { backgroundColor: color }]} />
                                <Text style={[styles.statusText, { color: color }]}>{label}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.cardFooter}>
                        <View style={styles.dateRow}>
                            <Ionicons name="time-outline" size={14} color={theme.subtext} />
                            <Text style={[styles.date, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.itemsCount, { color: theme.subtext }]}>{item.total_items} items</Text>
                    </View>
                </TouchableOpacity>
            </Link>
        );
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (filter === 'action') return ['paid_waiting_verification', 'pending'].includes(o.status);
            if (filter === 'completed') return o.status === 'delivered';
            return true;
        });
    }, [orders, filter]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.bg} />

            {/* Header - Centralised and pushed upper */}
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Overview</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Admin Control Panel</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Link href="/admin/products" asChild>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.headerBg, borderColor: theme.border }]}>
                            <Ionicons name="cube-outline" size={22} color={theme.accent} />
                        </TouchableOpacity>
                    </Link>
                    <Link href="/admin/add-product" asChild>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent }]}>
                            <Ionicons name="add" size={28} color="#8B0000" />
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>

            {/* Main Content using entire screen */}
            <View style={styles.mainContent}>
                {/* Metrics */}
                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsContainer}>
                        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                                <Ionicons name="cash-outline" size={22} color={theme.accent} />
                            </View>
                            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Total Revenue</Text>
                            <Text style={[styles.metricValue, { color: theme.text }]}>{formatCurrency(totalRevenue)}</Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                                <Ionicons name="alert-circle-outline" size={22} color={theme.warning} />
                            </View>
                            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Action Required</Text>
                            <Text style={[styles.metricValue, { color: theme.text }]}>{actionRequiredCount}</Text>
                        </View>

                        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                                <Ionicons name="cart-outline" size={22} color={theme.success} />
                            </View>
                            <Text style={[styles.metricLabel, { color: theme.subtext }]}>Total Orders</Text>
                            <Text style={[styles.metricValue, { color: theme.text }]}>{totalOrders}</Text>
                        </View>
                    </ScrollView>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterPill, filter === 'all' && [styles.filterPillActive, { backgroundColor: theme.accent }], { borderColor: theme.border, backgroundColor: theme.headerBg }]}>
                        <Text style={[styles.filterText, { color: filter === 'all' ? '#8B0000' : theme.text }]}>All Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFilter('action')} style={[styles.filterPill, filter === 'action' && [styles.filterPillActive, { backgroundColor: theme.accent }], { borderColor: theme.border, backgroundColor: theme.headerBg }]}>
                        <Text style={[styles.filterText, { color: filter === 'action' ? '#8B0000' : theme.text }]}>Needs Action</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFilter('completed')} style={[styles.filterPill, filter === 'completed' && [styles.filterPillActive, { backgroundColor: theme.accent }], { borderColor: theme.border, backgroundColor: theme.headerBg }]}>
                        <Text style={[styles.filterText, { color: filter === 'completed' ? '#8B0000' : theme.text }]}>Completed</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={theme.accent} />}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitleContainer: { flex: 1, justifyContent: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
    actionBtn: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 3 },

    mainContent: { flex: 1, paddingTop: 4 },

    metricsContainer: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
    metricCard: { width: 160, padding: 18, borderRadius: 18, borderWidth: 1, elevation: 4 },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    metricLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    metricValue: { fontSize: 22, fontWeight: '900' },

    filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
    filterPill: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20, borderWidth: 1, elevation: 1 },
    filterPillActive: { borderWidth: 0, elevation: 4 },
    filterText: { fontSize: 13, fontWeight: '800' },

    card: { borderRadius: 16, padding: 18, borderWidth: 1, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderInfo: { flex: 1 },
    orderId: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
    customerName: { fontSize: 13, fontWeight: '600' },

    amountBox: { alignItems: 'flex-end', gap: 8 },
    amount: { fontSize: 18, fontWeight: '900' },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

    divider: { height: 1, marginVertical: 14, opacity: 0.5 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    date: { fontSize: 13, fontWeight: '600' },
    itemsCount: { fontSize: 13, fontWeight: '700' }
});
