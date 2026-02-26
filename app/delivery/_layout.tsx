import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function DeliveryLayout() {
    const { profile, isLoading, isDeliveryMan } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (isLoading) return;
        if (!isDeliveryMan) {
            router.replace('/welcome');
        }
    }, [isDeliveryMan, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8B0000' }}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    if (!isDeliveryMan) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="[id]" options={{ title: 'Delivery Details', headerShown: true, headerStyle: { backgroundColor: '#8B0000' }, headerTintColor: '#fff' }} />
        </Stack>
    );
}
