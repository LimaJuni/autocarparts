import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../../lib/supabase';

export default function TrackOrderScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const webViewRef = useRef<WebView>(null);

    useEffect(() => {
        fetchOrder();

        // Realtime subscription for delivery_locations updates
        const sub = supabase
            .channel(`track-order-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'delivery_locations',
                filter: `order_id=eq.${id}`,
            }, (payload: any) => {
                const loc = payload.new;
                if (loc?.latitude && loc?.longitude) {
                    setDriverLocation({ lat: loc.latitude, lng: loc.longitude });
                    setLastUpdated(new Date().toLocaleTimeString());
                    // Inject JS to move driver marker without full reload
                    webViewRef.current?.injectJavaScript(`
                        if(typeof driverMarker !== 'undefined'){
                            driverMarker.setLatLng([${loc.latitude},${loc.longitude}]);
                            map.panTo([${loc.latitude},${loc.longitude}]);
                        }
                        true;
                    `);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        const { data: orderData } = await supabase
            .from('orders')
            // Get both customer and driver names
            .select('*, customer:user_id(full_name), driver:delivery_man_id(full_name)')
            .eq('id', id)
            .single();

        if (orderData) setOrder(orderData);

        // Fetch latest driver location (may not exist yet)
        const { data: locData } = await supabase
            .from('delivery_locations')
            .select('*')
            .eq('order_id', id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (locData) {
            setDriverLocation({ lat: locData.latitude, lng: locData.longitude });
            setLastUpdated(new Date(locData.updated_at).toLocaleTimeString());
        }
        setLoading(false);
    };

    // Leaflet map HTML — uses stored lat/lng for customer pin when available, else geocodes
    const buildMapHtml = (
        driverLat?: number,
        driverLng?: number,
        address?: string,
        customerLat?: number,
        customerLng?: number
    ) => {
        const centerLat = driverLat ?? customerLat ?? 4.0511;
        const centerLng = driverLng ?? customerLng ?? 9.7679;
        const customerPinJs = customerLat
            // Use precise coords from checkout selection
            ? `var houseIcon = L.divIcon({className:'',html:'<div style="font-size:26px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🏠</div>',iconSize:[32,32],iconAnchor:[16,16]});
               L.marker([${customerLat},${customerLng}], {icon: houseIcon})
                 .addTo(map).bindPopup('<b>Delivery Address</b><br>${(address || '').replace(/'/g, "\\'").replace(/"/g, '')}');`
            // Fallback: geocode from address text
            : address
                ? `fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent('${(address || '').replace(/'/g, "\\'").replace(/"/g, '')}'))
               .then(r=>r.json()).then(res=>{
                 if(res&&res[0]){
                   var houseIcon=L.divIcon({className:'',html:'<div style="font-size:26px">🏠</div>',iconSize:[32,32],iconAnchor:[16,16]});
                   L.marker([parseFloat(res[0].lat),parseFloat(res[0].lon)],{icon:houseIcon}).addTo(map).bindPopup('<b>Delivery Address</b>');
                 }
               }).catch(()=>{});`
                : '';

        return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;}
  .pulse{width:20px;height:20px;border-radius:50%;background:rgba(139,0,0,0.6);box-shadow:0 0 0 0 rgba(139,0,0,0.6);animation:pulse 1.5s infinite;}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(139,0,0,0.5);}70%{box-shadow:0 0 0 12px rgba(139,0,0,0);}100%{box-shadow:0 0 0 0 rgba(139,0,0,0);}}
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {zoomControl: true}).setView([${centerLat}, ${centerLng}], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  ${customerPinJs}
  ${driverLat ? `
  var driverHtml = '<div style="position:relative"><div class="pulse" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></div><div style="font-size:28px;position:relative;z-index:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))">🚚</div></div>';
  var driverIcon = L.divIcon({className:'',html:driverHtml,iconSize:[40,40],iconAnchor:[20,20]});
  var driverMarker = L.marker([${driverLat},${driverLng}],{icon:driverIcon}).addTo(map).bindPopup('<b>🚚 Driver is on the way!</b>');` : `var driverMarker;`}
</script>
</body>
</html>`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Track Delivery</Text>
                    <Text style={styles.headerSub}>Order #{String(id).substring(0, 8).toUpperCase()}</Text>
                </View>
            </View>

            {/* Status Card */}
            <View style={styles.card}>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: order?.delivery_man_id ? '#4caf50' : '#FFD700' }]} />
                    <Text style={styles.statusText}>
                        {order?.delivery_man_id
                            ? `🚚 ${order.driver?.full_name || 'Driver'} is coming!`
                            : '⏳ Finding a delivery person…'}
                    </Text>
                </View>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: driverLocation ? '#4caf50' : '#666' }]} />
                    <Text style={styles.statusSubText}>
                        {driverLocation ? 'GPS is active' : 'Waiting for driver to start tracking'}
                    </Text>
                </View>
                {lastUpdated && (
                    <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
                )}
                {order?.shipping_address && (
                    <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={16} color="#FFCCCC" />
                        <Text style={styles.addressText}>{order.shipping_address}</Text>
                    </View>
                )}
            </View>

            {/* Live Map */}
            <View style={styles.mapSection}>
                <View style={styles.mapHeader}>
                    <Ionicons name="map-outline" size={18} color="#FFD700" />
                    <Text style={styles.mapTitle}>Live Map</Text>
                    {driverLocation && (
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    )}
                </View>
                <View style={styles.mapContainer}>
                    <WebView
                        ref={webViewRef}
                        source={{
                            html: buildMapHtml(
                                driverLocation?.lat,
                                driverLocation?.lng,
                                order?.shipping_address,
                                order?.delivery_lat,
                                order?.delivery_lng
                            )
                        }}
                        style={styles.map}
                        javaScriptEnabled
                        scrollEnabled={false}
                    />
                </View>
                {!driverLocation && (
                    <View style={styles.noDriverBox}>
                        <Ionicons name="time-outline" size={28} color="#FFCCCC" />
                        <Text style={styles.noDriverText}>Driver hasn't started sharing location yet</Text>
                        <Text style={styles.noDriverSub}>The map will update automatically when they do</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#8B0000' },
    content: { paddingBottom: 40 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#6b0000',
    },
    backBtn: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    headerSub: { color: '#FFCCCC', fontSize: 12 },

    card: {
        margin: 16,
        backgroundColor: '#a11212',
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        gap: 10,
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    statusText: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
    statusSubText: { color: '#FFCCCC', fontSize: 13, flex: 1 },
    lastUpdated: { color: '#FFCCCC', fontSize: 11, marginLeft: 22 },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
    addressText: { color: '#FFCCCC', fontSize: 13, flex: 1 },

    mapSection: { marginHorizontal: 16, backgroundColor: '#a11212', borderRadius: 16, overflow: 'hidden', elevation: 3 },
    mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
    mapTitle: { color: '#FFD700', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', flex: 1 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4caf50', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    liveText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    mapContainer: { height: 350 },
    map: { flex: 1 },

    noDriverBox: { alignItems: 'center', padding: 20, gap: 6 },
    noDriverText: { color: '#FFCCCC', fontSize: 14, fontWeight: '600', textAlign: 'center' },
    noDriverSub: { color: '#c13030', fontSize: 12, textAlign: 'center' },
});
