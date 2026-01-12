import { Link, useRouter } from 'expo-router';
import React from 'react';
import { ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <ImageBackground
            source={require('../assets/images/welcome-bg.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.overlay}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>AUTO PARTS</Text>
                        <Text style={styles.subtitle}>DELIVERY</Text>
                        <View style={styles.separator} />
                        <Text style={styles.tagline}>Premium Quality. Fast Delivery.</Text>
                    </View>

                    <View style={styles.footer}>
                        <Link href="/(auth)/sign-in" asChild>
                            <TouchableOpacity style={styles.primaryButton}>
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
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, width: '100%', height: '100%' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }, // Dark overlay for readability
    container: { flex: 1, justifyContent: 'space-between', padding: 24 },
    header: { marginTop: 60, alignItems: 'flex-start' },
    title: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    subtitle: { fontSize: 42, fontWeight: '300', color: '#007AFF', letterSpacing: 1, marginTop: -10 },
    separator: { width: 60, height: 4, backgroundColor: '#007AFF', marginTop: 16, marginBottom: 16 },
    tagline: { fontSize: 18, color: '#ccc', fontWeight: '400' },

    footer: { marginBottom: 40, width: '100%' },
    primaryButton: { backgroundColor: '#007AFF', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    loginText: { color: '#ccc', fontSize: 16 },
    loginLink: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' }
});
