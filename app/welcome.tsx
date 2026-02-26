import { Link } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
    return (
        <View style={styles.background}>
            <StatusBar barStyle="light-content" />

            {/* Decorative circles */}
            <View style={styles.circleTopLeft} />
            <View style={styles.circleBottomRight} />
            <View style={styles.circleMidRight} />

            <SafeAreaView style={styles.container}>
                {/* Brand Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>AP</Text>
                    </View>
                    <Text style={styles.title}>AUTO PARTS</Text>
                    <Text style={styles.subtitle}>DELIVERY</Text>
                    <View style={styles.separator} />
                    <Text style={styles.tagline}>Premium Quality. Fast Delivery.</Text>
                </View>

                {/* Feature Pills */}
                <View style={styles.pills}>
                    {['🔧 Genuine Parts', '🚚 Fast Delivery', '💳 Secure Payment'].map((f) => (
                        <View key={f} style={styles.pill}>
                            <Text style={styles.pillText}>{f}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA Footer */}
                <View style={styles.footer}>
                    <Link href="/(auth)/sign-up" asChild>
                        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
                            <Text style={styles.primaryButtonText}>Get Started</Text>
                        </TouchableOpacity>
                    </Link>

                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Link href="/(auth)/sign-in" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Log In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: '#8B0000', overflow: 'hidden' },

    // Decorative background circles
    circleTopLeft: {
        position: 'absolute', top: -80, left: -80,
        width: 250, height: 250, borderRadius: 125,
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
    },
    circleBottomRight: {
        position: 'absolute', bottom: -100, right: -80,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(255, 215, 0, 0.07)',
    },
    circleMidRight: {
        position: 'absolute', top: '35%', right: -60,
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: 'rgba(161, 18, 18, 0.6)',
    },

    container: { flex: 1, justifyContent: 'space-between', padding: 28 },

    header: { marginTop: 40, alignItems: 'flex-start' },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#FFD700',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, elevation: 10,
        shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
    },
    logoText: { fontSize: 26, fontWeight: '900', color: '#8B0000' },

    title: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    subtitle: { fontSize: 44, fontWeight: '200', color: '#FFD700', letterSpacing: 1, marginTop: -8 },
    separator: { width: 60, height: 4, backgroundColor: '#FFD700', marginTop: 16, marginBottom: 16, borderRadius: 2 },
    tagline: { fontSize: 16, color: '#FFCCCC', fontWeight: '400' },

    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pill: {
        backgroundColor: 'rgba(255,215,0,0.12)',
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    },
    pillText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },

    footer: { marginBottom: 20, width: '100%' },
    primaryButton: {
        backgroundColor: '#FFD700',
        paddingVertical: 18, borderRadius: 16,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    },
    primaryButtonText: { color: '#8B0000', fontSize: 18, fontWeight: '800' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    loginText: { color: '#FFCCCC', fontSize: 15 },
    loginLink: { color: '#FFD700', fontSize: 15, fontWeight: '700' },
});
