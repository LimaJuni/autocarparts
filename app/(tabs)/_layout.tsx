import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { isAdmin } = useAuth();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null
        }}
      />

      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <Ionicons name="cart-outline" size={24} color={color} />,
        }}
      />



      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
