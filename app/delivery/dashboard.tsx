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

// Helper for formatting
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export default function DeliveryDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'available' | 'active'>('available');
    const { profile, user, signOut } = useAuth();
    const router = useRouter();

    // Original App Theme with SaaS structure
    const theme = {
        bg: '#8B0000',
        headerBg: '#6b0000',
        card: '#a11212',
        text: '#FFFFFF',
        subtext: '#FFCCCC',
        primary: '#FFD700', // Gold is primary action color on red background
        accent: '#FFD700',
        border: '#c13030',
        routeLine: '#FFCCCC',
    };

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

    const renderOrder = ({ item }: { item: any }) => {
        const isAvailable = tab === 'available';
        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push(`/delivery/${item.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.orderId, { color: theme.text }]}>Order #{item.id.substring(0, 8).toUpperCase()}</Text>
                        <Text style={[styles.cardDate, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.pricePill, { backgroundColor: theme.headerBg }]}>
                        <Text style={[styles.priceText, { color: theme.primary }]}>{formatCurrency(item.total_amount)}</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.routeContainer}>
                    {/* Route Timeline Graphics */}
                    <View style={styles.routeGraphics}>
                        <View style={[styles.routeDot, { backgroundColor: theme.primary }]} />
                        <View style={[styles.routeLine, { backgroundColor: theme.routeLine }]} />
                        <View style={[styles.routeDot, { backgroundColor: theme.accent, borderColor: theme.card, borderWidth: 2 }]} />
                    </View>

                    {/* Route Info */}
                    <View style={styles.routeInfo}>
                        <View style={styles.routeLocation}>
                            <Text style={[styles.locationTitle, { color: theme.subtext }]}>Pickup</Text>
                            <Text style={[styles.locationDetails, { color: theme.text }]}>AutoParts Store</Text>
                        </View>

                        <View style={styles.routeSpacer} />

                        <View style={styles.routeLocation}>
                            <Text style={[styles.locationTitle, { color: theme.subtext }]}>Drop-off</Text>
                            <Text style={[styles.locationDetails, { color: theme.text }]} numberOfLines={2}>
                                {item.shipping_address || 'Customer Address'}
                            </Text>
                            <Text style={[styles.customerName, { color: theme.subtext }]}>
                                {item.user_profiles?.full_name || 'Customer'} • {item.total_items} items
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.actionText, { color: isAvailable ? theme.primary : '#4caf50' }]}>
                        {isAvailable ? "Review & Accept" : "View Active Delivery"}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={isAvailable ? theme.primary : '#4caf50'} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.bg} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Driver Portal</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Hello, {profile?.full_name?.split(' ')[0] || 'Driver'}</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={[styles.signOutBtn, { backgroundColor: theme.headerBg, borderColor: theme.border }]}>
                    <Ionicons name="log-out-outline" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {/* SaaS Segmented Tabs */}
            <View style={styles.tabContainer}>
                <View style={[styles.tabBackground, { backgroundColor: theme.headerBg }]}>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'available' && [styles.tabActive, { backgroundColor: theme.primary }]]}
                        onPress={() => setTab('available')}
                    >
                        <Text style={[styles.tabText, tab === 'available' ? { color: '#8B0000' } : { color: theme.text }]}>Available</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, tab === 'active' && [styles.tabActive, { backgroundColor: theme.primary }]]}
                        onPress={() => setTab('active')}
                    >
                        <Text style={[styles.tabText, tab === 'active' ? { color: '#8B0000' } : { color: theme.text }]}>My Active</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={theme.primary} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconBox, { backgroundColor: theme.headerBg }]}>
                            <Ionicons name={tab === 'available' ? "checkmark-circle-outline" : "bicycle-outline"} size={48} color={theme.primary} />
                        </View>
                        <Text style={[styles.emptyText, { color: theme.text }]}>
                            {tab === 'available' ? 'You are all caught up!' : 'No active deliveries'}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                            {tab === 'available' ? 'More orders will appear when they are ready.' : 'Accept an available order to start.'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerSubtitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    headerTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
    signOutBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 2 },

    tabContainer: { paddingHorizontal: 16, paddingBottom: 10 },
    tabBackground: { flexDirection: 'row', borderRadius: 30, padding: 4 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 26 },
    tabActive: { elevation: 3 },
    tabText: { fontWeight: '800', fontSize: 14 },

    card: {
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16,
    },
    orderId: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
    cardDate: { fontSize: 12, fontWeight: '500' },
    pricePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    priceText: { fontWeight: '800', fontSize: 14 },

    divider: { height: 1, marginHorizontal: 16, opacity: 0.5 },

    routeContainer: { flexDirection: 'row', padding: 16 },
    routeGraphics: { width: 24, alignItems: 'center', marginRight: 12, marginTop: 4 },
    routeDot: { width: 12, height: 12, borderRadius: 6 },
    routeLine: { width: 2, flex: 1, marginVertical: 4 },

    routeInfo: { flex: 1 },
    routeLocation: { justifyContent: 'center' },
    locationTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    locationDetails: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
    customerName: { fontSize: 13, fontWeight: '500', marginTop: 4 },

    routeSpacer: { height: 20 },

    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderTopWidth: 1,
        gap: 8,
    },
    actionText: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
    emptyIconBox: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyText: { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    emptySubtext: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 22 },
});
