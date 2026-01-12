import { Link, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme();

    const isDark = colorScheme === 'dark';
    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#000000',
        inputBg: isDark ? '#1E1E1E' : '#F5F5F5',
        inputBorder: isDark ? '#333333' : '#dbdbdb',
        placeholder: isDark ? '#888888' : '#999999',
        button: '#007AFF'
    }), [isDark]);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        }
        setLoading(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Text style={[styles.title, { color: theme.text }]}>
                {isAdminMode ? 'Admin Portal' : 'Auto Part Delivery'}
            </Text>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleBtn, !isAdminMode && { backgroundColor: theme.button }]}
                    onPress={() => setIsAdminMode(false)}
                >
                    <Text style={[styles.toggleText, !isAdminMode && { color: '#fff' }]}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, isAdminMode && { backgroundColor: theme.button }]}
                    onPress={() => setIsAdminMode(true)}
                >
                    <Text style={[styles.toggleText, isAdminMode && { color: '#fff' }]}>Admin</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="Email"
                    placeholderTextColor={theme.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="Password"
                    placeholderTextColor={theme.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={signInWithEmail} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={{ color: theme.text }}>Don't have an account? </Text>
                <Link href="/(auth)/sign-up" asChild>
                    <TouchableOpacity><Text style={styles.link}>Sign Up</Text></TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 8, padding: 4, marginBottom: 20 },
    toggleBtn: { flex: 1, padding: 8, borderRadius: 6, alignItems: 'center' },
    toggleText: { fontWeight: '600', color: '#666' },
    inputContainer: { gap: 12 },
    input: { borderWidth: 1, padding: 12, borderRadius: 8 },
    button: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontWeight: '600' },
    footer: { flexDirection: 'row', marginTop: 20, justifyContent: 'center' },
    link: { color: '#007AFF', fontWeight: '600' },
});
