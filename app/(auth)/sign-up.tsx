import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
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

type Role = 'customer' | 'delivery';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<Role>('customer');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        if (!fullName.trim()) {
            Alert.alert('Missing Info', 'Please enter your full name.');
            return;
        }
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing Info', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const { data: { session, user }, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                Alert.alert('Sign Up Error', error.message);
                return;
            }

            if (user) {
                // Wait a moment for auth to settle, then insert profile
                await new Promise(r => setTimeout(r, 300));
                const { error: profileError } = await supabase.from('user_profiles').insert({
                    id: user.id,
                    full_name: fullName.trim(),
                    role,
                });

                if (profileError) {
                    Alert.alert('Profile Error', profileError.message);
                } else if (!session) {
                    Alert.alert('Check your email', 'Click the confirmation link to activate your account.');
                }
                // If session exists, AuthContext will handle redirect automatically
            }
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
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
                        <Text style={styles.brandName}>Create Account</Text>
                        <View style={styles.brandBar} />
                    </View>

                    {/* Form Card */}
                    <View style={styles.card}>

                        {/* Role Selector */}
                        <Text style={styles.label}>I am a…</Text>
                        <View style={styles.roleRow}>
                            <TouchableOpacity
                                style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
                                onPress={() => setRole('customer')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.roleIcon}>🛒</Text>
                                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.roleBtn, role === 'delivery' && styles.roleBtnActive]}
                                onPress={() => setRole('delivery')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.roleIcon}>🚚</Text>
                                <Text style={[styles.roleText, role === 'delivery' && styles.roleTextActive]}>Delivery Man</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            placeholderTextColor="#FFCCCC"
                            value={fullName}
                            onChangeText={setFullName}
                            returnKeyType="next"
                        />

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
                                onSubmitEditing={signUpWithEmail}
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
                            onPress={signUpWithEmail}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#8B0000" />
                                : <Text style={styles.buttonText}>Create Account</Text>}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Link href="/(auth)/sign-in" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.link}>Sign In</Text>
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

    brand: { alignItems: 'center', marginBottom: 24 },
    logoCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 8 },
    logoText: { fontSize: 22, fontWeight: '900', color: '#8B0000' },
    brandName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    brandBar: { width: 50, height: 3, backgroundColor: '#FFD700', marginTop: 8, borderRadius: 2 },

    card: { backgroundColor: '#a11212', borderRadius: 20, padding: 24, elevation: 6 },

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

    roleRow: { flexDirection: 'row', gap: 12 },
    roleBtn: {
        flex: 1,
        backgroundColor: '#6b0000',
        borderWidth: 1.5,
        borderColor: '#c13030',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        gap: 6,
    },
    roleBtnActive: { borderColor: '#FFD700', backgroundColor: '#7a0000' },
    roleIcon: { fontSize: 24 },
    roleText: { color: '#FFCCCC', fontWeight: '600', fontSize: 13 },
    roleTextActive: { color: '#FFD700' },

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
