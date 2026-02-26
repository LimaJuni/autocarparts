import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function DeliveryDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
    const locationWatcher = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        fetchOrder();
        return () => stopTracking();
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, user_profiles(full_name, phone_number)')
            .eq('id', id)
            .single();
        if (!error && data) setOrder(data);
        setLoading(false);
    };

    // ─── GPS Tracking ──────────────────────────────────────────────────────
    const startTracking = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Location Permission Required',
                'Please allow location access to share your position with the customer.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
            );
            return;
        }

        setIsTracking(true);
        locationWatcher.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,   // update every 5 seconds
                distanceInterval: 10, // or every 10 metres
            },
            async (loc) => {
                const { latitude, longitude } = loc.coords;
                setDriverLocation({ lat: latitude, lng: longitude });

                // Upsert into delivery_locations table
                await supabase.from('delivery_locations').upsert({
                    order_id: id,
                    delivery_man_id: user?.id,
                    latitude,
                    longitude,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'order_id' });
            }
        );
    };

    const stopTracking = () => {
        if (locationWatcher.current) {
            locationWatcher.current.remove();
            locationWatcher.current = null;
        }
        setIsTracking(false);
    };

    const toggleTracking = () => {
        if (isTracking) stopTracking();
        else startTracking();
    };

    // ─── Accept Order ──────────────────────────────────────────────────────
    const acceptOrder = async () => {
        if (!user) return;
        setAccepting(true);
        const { error } = await supabase
            .from('orders')
            .update({
                delivery_man_id: user.id,
                status: 'out_for_delivery'
            })
            .eq('id', id);

        if (error) {
            Alert.alert('Error', error.message);
            setAccepting(false);
        } else {
            // Refetch to update UI
            await fetchOrder();
            setAccepting(false);
            Alert.alert('✅ Order Accepted', 'You are now assigned to this delivery.');
        }
    };

    // ─── Mark as Delivered ─────────────────────────────────────────────────
    const markDelivered = async () => {
        Alert.alert('Confirm Delivery', 'Mark this order as delivered?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark Delivered',
                onPress: async () => {
                    setMarking(true);
                    stopTracking();
                    const { error } = await supabase
                        .from('orders')
                        .update({ status: 'delivered' })
                        .eq('id', id);
                    setMarking(false);
                    if (error) Alert.alert('Error', error.message);
                    else Alert.alert('✅ Success', 'Order marked as delivered!', [
                        { text: 'OK', onPress: () => router.back() },
                    ]);
                },
            },
        ]);
    };

    // ─── Map HTML using OpenStreetMap + Leaflet (no API key needed) ────────
    const buildMapHtml = (
        centerLat: number,
        centerLng: number,
        customerLat?: number,
        customerLng?: number,
        driverLat?: number,
        driverLng?: number
    ) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%;}</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([${centerLat}, ${centerLng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  ${customerLat ? `
  var customerIcon = L.divIcon({className:'',html:'<div style="font-size:28px">🏠</div>',iconSize:[32,32],iconAnchor:[16,16]});
  L.marker([${customerLat},${customerLng}], {icon: customerIcon}).addTo(map).bindPopup('Customer Location').openPopup();
  ` : ''}

  ${driverLat ? `
  var driverIcon = L.divIcon({className:'',html:'<div style="font-size:28px">🚚</div>',iconSize:[32,32],iconAnchor:[16,16]});
  var driverMarker = L.marker([${driverLat},${driverLng}], {icon: driverIcon}).addTo(map).bindPopup('You (Driver)');
  ` : ''}
</script>
</body>
</html>`;

    if (loading || !order) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading order details…</Text>
            </View>
        );
    }

    // Try to use driver location for map center, else use a default
    const mapCenterLat = driverLocation?.lat ?? 4.0511;
    const mapCenterLng = driverLocation?.lng ?? 9.7679;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

            {/* Status Banner */}
            <View style={[styles.statusBanner, order.delivery_man_id ? styles.statusBannerActive : null]}>
                <Ionicons
                    name={order.delivery_man_id ? "bicycle" : "notifications"}
                    size={24}
                    color="#FFD700"
                />
                <Text style={styles.statusText}>
                    {order.delivery_man_id ? 'Assigned to You' : 'Available for Delivery'}
                </Text>
            </View>

            {/* Order ID */}
            <Text style={styles.orderId}>Order #{String(order.id).substring(0, 8).toUpperCase()}</Text>

            {/* Customer Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                <InfoRow icon="person-outline" label="Name" value={order.user_profiles?.full_name || '—'} />
                <InfoRow icon="call-outline" label="Phone" value={order.user_profiles?.phone_number || '—'} />
                <InfoRow icon="location-outline" label="Address" value={order.shipping_address || '—'} />
                <InfoRow icon="cube-outline" label="Total Items" value={String(order.total_items ?? '—')} />
                <InfoRow icon="cash-outline" label="Order Total" value={`${order.total_amount?.toLocaleString()} FCFA`} />
            </View>

            {/* Action Buttons */}
            {!order.delivery_man_id ? (
                // Not assigned yet
                <TouchableOpacity
                    style={[styles.acceptButton, accepting && { opacity: 0.6 }]}
                    onPress={acceptOrder}
                    disabled={accepting}
                    activeOpacity={0.8}
                >
                    <Ionicons name="hand-right" size={22} color="#8B0000" />
                    <Text style={styles.acceptButtonText}>
                        {accepting ? 'Accepting…' : 'Accept Delivery'}
                    </Text>
                </TouchableOpacity>
            ) : order.delivery_man_id === user?.id ? (
                // Assigned to current user
                <>
                    {/* GPS Tracking Toggle */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Live GPS Tracking</Text>
                        <View style={styles.trackingRow}>
                            <View style={styles.trackingStatus}>
                                <View style={[styles.statusDot, { backgroundColor: isTracking ? '#4caf50' : '#666' }]} />
                                <Text style={styles.trackingStatusText}>
                                    {isTracking ? 'Sharing location…' : 'Not tracking'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.trackBtn, { backgroundColor: isTracking ? '#c13030' : '#4caf50' }]}
                                onPress={toggleTracking}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={isTracking ? 'stop-circle' : 'navigate'} size={18} color="#fff" />
                                <Text style={styles.trackBtnText}>{isTracking ? 'Stop' : 'Start Tracking'}</Text>
                            </TouchableOpacity>
                        </View>

                        {driverLocation && (
                            <Text style={styles.coordText}>
                                📍 {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}
                            </Text>
                        )}
                    </View>

                    {/* Live Map */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Live Map</Text>
                        <View style={styles.mapContainer}>
                            <WebView
                                source={{ html: buildMapHtml(mapCenterLat, mapCenterLng, undefined, undefined, driverLocation?.lat, driverLocation?.lng) }}
                                style={styles.map}
                                scrollEnabled={false}
                                javaScriptEnabled
                            />
                        </View>
                        {!driverLocation && (
                            <Text style={styles.mapHint}>Start tracking to see your live position on the map</Text>
                        )}
                    </View>

                    {/* Mark as Delivered */}
                    <TouchableOpacity
                        style={[styles.deliverButton, marking && { opacity: 0.6 }]}
                        onPress={markDelivered}
                        disabled={marking}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle" size={22} color="#8B0000" />
                        <Text style={styles.deliverButtonText}>
                            {marking ? 'Updating…' : 'Mark as Delivered'}
                        </Text>
                    </TouchableOpacity>
                </>
            ) : (
                // Assigned to someone else
                <View style={styles.assignedOtherBox}>
                    <Ionicons name="lock-closed" size={24} color="#FFCCCC" />
                    <Text style={styles.assignedOtherText}>This order is assigned to another driver</Text>
                </View>
            )}
        </ScrollView>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <Ionicons name={icon} size={18} color="#FFD700" />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#8B0000' },
    content: { padding: 16, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8B0000' },
    loadingText: { color: '#fff', fontSize: 16 },

    statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#6b0000', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#c13030' },
    statusBannerActive: { backgroundColor: '#4caf5033', borderColor: '#4caf50' },
    statusText: { color: '#FFD700', fontSize: 16, fontWeight: '700' },
    orderId: { color: '#FFCCCC', fontSize: 13, fontWeight: '600', marginBottom: 16 },

    section: { backgroundColor: '#a11212', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
    sectionTitle: { color: '#FFD700', fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
    infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B0000', justifyContent: 'center', alignItems: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { color: '#FFCCCC', fontSize: 12, marginBottom: 2 },
    infoValue: { color: '#fff', fontSize: 15, fontWeight: '600' },

    // GPS Tracking
    trackingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    trackingStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    trackingStatusText: { color: '#FFCCCC', fontSize: 14 },
    trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    coordText: { color: '#FFCCCC', fontSize: 11, marginTop: 8, textAlign: 'center' },

    // Map
    mapContainer: { borderRadius: 12, overflow: 'hidden', height: 240 },
    map: { flex: 1 },
    mapHint: { color: '#FFCCCC', fontSize: 12, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },

    // Deliver button
    deliverButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFD700', padding: 18, borderRadius: 16, elevation: 4, marginTop: 4 },
    deliverButtonText: { color: '#8B0000', fontSize: 17, fontWeight: '800' },

    // Accept button
    acceptButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFD700', padding: 18, borderRadius: 16, elevation: 4, marginTop: 4 },
    acceptButtonText: { color: '#8B0000', fontSize: 17, fontWeight: '800' },

    assignedOtherBox: { alignItems: 'center', padding: 20, gap: 10, backgroundColor: '#6b0000', borderRadius: 16 },
    assignedOtherText: { color: '#FFCCCC', fontSize: 14, textAlign: 'center' },
});
