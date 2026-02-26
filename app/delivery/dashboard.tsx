import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'available' | 'active'>('available');
    const { profile, user, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetchOrders();

        // Supabase Realtime subscription
        const subscription = supabase
            .channel('delivery-orders-channel')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                },
                (payload) => {
                    if (payload.new.status === 'approved_for_delivery') {
                        fetchOrders();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchOrders = async () => {
        if (!user) return;
        setLoading(true);

        let query = supabase
            .from('orders')
            .select('*, user_profiles(full_name, phone_number)');

        if (tab === 'available') {
            // Unassigned orders
            query = query
                .eq('status', 'approved_for_delivery')
                .is('delivery_man_id', null);
        } else {
            // My active orders
            query = query
                .eq('delivery_man_id', user.id)
                .in('status', ['approved_for_delivery', 'out_for_delivery']);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [tab]);

    const renderOrder = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/delivery/${item.id}`)}
            activeOpacity={0.85}
        >
            <View style={[styles.cardHeader, tab === 'active' && styles.cardHeaderActive]}>
                <View style={styles.notifBadge}>
                    <Ionicons
                        name={tab === 'available' ? "notifications" : "cube"}
                        size={18}
                        color={tab === 'available' ? "#8B0000" : "#fff"}
                    />
                    <Text style={[styles.notifBadgeText, tab === 'active' && { color: '#fff' }]}>
                        {tab === 'available' ? 'Available' : 'My Task'}
                    </Text>
                </View>
                <Text style={[styles.cardDate, tab === 'active' && { color: '#fff' }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="cube-outline" size={16} color="#FFCCCC" />
                    <Text style={styles.infoText}>Items: <Text style={styles.infoValue}>{item.total_items ?? '—'}</Text></Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#FFCCCC" />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {item.shipping_address || 'Address not provided'}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#FFCCCC" />
                    <Text style={styles.infoText}>{item.user_profiles?.full_name || 'Customer'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={16} color="#FFCCCC" />
                    <Text style={styles.infoText}>{item.total_amount?.toLocaleString()} FCFA</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.tapHint}>Tap to view details →</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Deliveries</Text>
                    <Text style={styles.headerSubtitle}>Welcome, {profile?.full_name || 'Driver'}</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#FFD700" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'available' && styles.tabActive]}
                    onPress={() => setTab('available')}
                >
                    <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>Available</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'active' && styles.tabActive]}
                    onPress={() => setTab('active')}
                >
                    <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>My Active</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor="#FFD700" />}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name={tab === 'available' ? "checkmark-circle-outline" : "bicycle-outline"} size={64} color="#FFCCCC" />
                        <Text style={styles.emptyText}>
                            {tab === 'available' ? 'No new orders' : 'You have no active tasks'}
                        </Text>
                        <Text style={styles.emptySubtext}>Pull to refresh</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#8B0000' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#c13030',
        backgroundColor: '#6b0000',
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: '#FFCCCC', marginTop: 2 },
    signOutBtn: { padding: 8 },

    tabBar: { flexDirection: 'row', backgroundColor: '#6b0000', padding: 12, gap: 12 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#8B0000' },
    tabActive: { backgroundColor: '#FFD700' },
    tabText: { color: '#FFCCCC', fontWeight: '700', fontSize: 14 },
    tabTextActive: { color: '#8B0000' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#FFD700',
    },
    cardHeaderActive: { backgroundColor: '#4caf50' },
    notifBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    notifBadgeText: { fontWeight: '700', color: '#8B0000', fontSize: 14 },
    cardDate: { fontSize: 12, color: '#6b0000', fontWeight: '600' },

    cardBody: { padding: 14, gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#a11212', padding: 8, borderRadius: 8 },
    infoText: { color: '#FFCCCC', fontSize: 13 },
    infoValue: { color: '#fff', fontWeight: 'bold' },

    cardFooter: {
        backgroundColor: '#8B0000',
        padding: 10,
        alignItems: 'flex-end',
    },
    tapHint: { color: '#FFCCCC', fontSize: 12, fontStyle: 'italic' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 },
    emptySubtext: { color: '#FFCCCC', fontSize: 14, marginTop: 6 },
});
