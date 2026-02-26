import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { profile, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = useMemo(() => ({
    bg: '#8B0000',
    card: '#a11212',
    text: '#FFFFFF',
    subtext: '#FFCCCC',
    border: '#c13030',
  }), []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#333' : '#eee' }]}>
          <Text style={[styles.avatarText, { color: theme.subtext }]}>{profile?.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{profile?.full_name || 'User'}</Text>
        <Text style={[styles.role, { color: theme.subtext }]}>{profile?.role.toUpperCase()}</Text>
      </View>

      <View style={[styles.menu, { backgroundColor: theme.card }]}>
        {isAdmin && (
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push('/admin/dashboard')}>
            <Text style={[styles.menuText, { color: theme.text }]}>Admin Dashboard</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: theme.text }]}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={signOut}>
          <Text style={[styles.menuText, { color: 'red' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, padding: 20, borderRadius: 12, elevation: 2 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold' },
  role: { fontSize: 14, marginTop: 4 },
  menu: { borderRadius: 12, elevation: 2 },
  menuItem: { padding: 16, borderBottomWidth: 1 },
  menuText: { fontSize: 16 },
});
