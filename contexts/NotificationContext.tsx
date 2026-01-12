import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Configure Notification Handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const NotificationContext = createContext({});

export function useNotification() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();

    useEffect(() => {
        registerForPushNotificationsAsync();

        // Listen to Supabase Realtime Updates
        if (user?.id) {
            console.log('Subscribing to order updates for user:', user.id);
            const subscription = supabase
                .channel('public:orders')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'orders',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload: any) => {
                        console.log('Order Update Received:', payload);
                        handleOrderUpdate(payload.new, payload.old);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user]);

    const handleOrderUpdate = async (newOrder: any, oldOrder: any) => {
        // Only trigger if status changed
        if (newOrder.status !== oldOrder.status) {
            let title = '';
            let body = '';

            switch (newOrder.status) {
                case 'approved':
                    title = 'Order Approved! ✅';
                    body = `Your order #${newOrder.id.substring(0, 8)} has been verified and is being prepared.`;
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'rejected':
                    title = 'Order Rejected ❌';
                    body = `There was an issue with order #${newOrder.id.substring(0, 8)}. Please check details.`;
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
                default:
                    return; // Ignore other status changes for now
            }

            // Trigger Local Notification (Sound + Banner)
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: 'default',
                },
                trigger: null, // Immediate
            });
        }
    };

    async function registerForPushNotificationsAsync() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }
        }
    }

    return (
        <NotificationContext.Provider value={{}}>
            {children}
        </NotificationContext.Provider>
    );
}
