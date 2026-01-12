import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = useMemo(() => ({
        bg: isDark ? '#121212' : '#ffffff',
        text: isDark ? '#FFFFFF' : '#000000',
        inputBg: isDark ? '#1E1E1E' : '#F5F5F5',
        inputBorder: isDark ? '#333333' : '#dbdbdb',
        placeholder: isDark ? '#888888' : '#999999',
        button: '#28a745'
    }), [isDark]);

    async function signUpWithEmail() {
        setLoading(true);
        const { data: { session, user }, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
            setLoading(false);
            return;
        }

        if (user) {
            // Create Profile
            const { error: profileError } = await supabase.from('user_profiles').insert({
                id: user.id,
                full_name: fullName,
                role: 'customer' // Default role
            });

            if (profileError) {
                Alert.alert('Error creating profile', profileError.message);
            } else {
                if (session) {
                    // Auto-login active (Email confirmation disabled)
                    // AuthContext will handle redirect
                } else {
                    Alert.alert('Success', 'Check your email for confirmation!');
                }
            }
        }

        setLoading(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                    placeholder="Full Name"
                    placeholderTextColor={theme.placeholder}
                    value={fullName}
                    onChangeText={setFullName}
                />
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
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={signUpWithEmail} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={{ color: theme.text }}>Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                    <TouchableOpacity><Text style={styles.link}>Sign In</Text></TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    inputContainer: { gap: 12 },
    input: { borderWidth: 1, padding: 12, borderRadius: 8 },
    button: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontWeight: '600' },
    footer: { flexDirection: 'row', marginTop: 20, justifyContent: 'center' },
    link: { color: '#007AFF', fontWeight: '600' },
});
