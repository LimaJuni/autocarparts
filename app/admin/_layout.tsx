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
        <Stack>
            <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Verify Order' }} />
        </Stack>
    );
}
