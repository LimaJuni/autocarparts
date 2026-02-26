import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
    const { isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
    }

    if (!isAdmin) {
        // Redirect non-admins out
        return <Redirect href="/(tabs)/catalog" />;
    }

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#6b0000' },
                headerTintColor: '#FFD700',
                headerTitleStyle: { fontWeight: '800' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: '#8B0000' },
            }}
        >
            <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="products" options={{ title: 'Manage Products' }} />
            <Stack.Screen name="add-product" options={{ title: 'Add New Product' }} />
            <Stack.Screen name="edit-product/[id]" options={{ title: 'Edit Product' }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Verify Order' }} />
        </Stack>
    );
}
