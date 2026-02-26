import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Brand */}
                    <View style={styles.brand}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>AP</Text>
                        </View>
                        <Text style={styles.brandName}>AUTO PARTS</Text>
                        <Text style={styles.brandSub}>DELIVERY</Text>
                        <View style={styles.brandBar} />
                    </View>

                    {/* Form */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Welcome Back</Text>

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            placeholderTextColor="#FFCCCC"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            returnKeyType="next"
                        />

                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder=""
                                placeholderTextColor="#FFCCCC"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={signInWithEmail}
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(v => !v)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color="#FFCCCC"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && { opacity: 0.7 }]}
                            onPress={signInWithEmail}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#8B0000" />
                                : <Text style={styles.buttonText}>Sign In</Text>}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.link}>Sign Up</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#8B0000' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 },

    brand: { alignItems: 'center', marginBottom: 32 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 8 },
    logoText: { fontSize: 26, fontWeight: '900', color: '#8B0000' },
    brandName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    brandSub: { fontSize: 18, fontWeight: '300', color: '#FFD700', letterSpacing: 2 },
    brandBar: { width: 60, height: 3, backgroundColor: '#FFD700', marginTop: 10, borderRadius: 2 },

    card: { backgroundColor: '#a11212', borderRadius: 20, padding: 24, elevation: 6 },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20, textAlign: 'center' },

    label: { color: '#FFCCCC', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#6b0000',
        borderWidth: 1,
        borderColor: '#c13030',
        borderRadius: 10,
        padding: 14,
        color: '#fff',
        fontSize: 15,
    },
    passwordRow: { position: 'relative' },
    passwordInput: { paddingRight: 50 },
    eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },

    button: {
        backgroundColor: '#FFD700',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        elevation: 4,
    },
    buttonText: { color: '#8B0000', fontWeight: '800', fontSize: 16 },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    footerText: { color: '#FFCCCC', fontSize: 14 },
    link: { color: '#FFD700', fontWeight: '700', fontSize: 14 },
});
