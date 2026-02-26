import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { notifyWithHaptic, sendLocalNotification } from '../utils/notifications';
import { useAuth } from './AuthContext';

// Configure how notifications appear while app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const NotificationContext = createContext({});
export function useNotification() { return useContext(NotificationContext); }

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const notificationListener = useRef<any>(undefined);
    const responseListener = useRef<any>(undefined);

    // ─── Register for push permissions once ───────────────────────────────
    useEffect(() => {
        registerForPushNotificationsAsync();

        notificationListener.current = Notifications.addNotificationReceivedListener((_n) => { });
        responseListener.current = Notifications.addNotificationResponseReceivedListener((_r) => { });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);

    // ─── Role-based Supabase Realtime subscriptions ───────────────────────
    useEffect(() => {
        if (!user?.id || !profile?.role) return;

        const role = profile.role;
        const channels: ReturnType<typeof supabase.channel>[] = [];

        // 📦 CUSTOMER: notified when their order is delivered
        if (role === 'customer') {
            const ch = supabase
                .channel(`customer-orders-${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'orders',
                    filter: `user_id=eq.${user.id}`,
                }, async (payload: any) => {
                    const { new: newOrder, old: oldOrder } = payload;
                    if (newOrder.status === oldOrder.status) return;

                    if (newOrder.status === 'delivered') {
                        await notifyWithHaptic(
                            '📦 Order Delivered!',
                            `Your order #${newOrder.id.substring(0, 8).toUpperCase()} has been successfully delivered.`,
                            'success'
                        );
                    } else if (newOrder.status === 'approved_for_delivery') {
                        await notifyWithHaptic(
                            '🚚 Order On Its Way!',
                            `Your order #${newOrder.id.substring(0, 8).toUpperCase()} has been dispatched for delivery.`,
                            'success'
                        );
                    } else if (newOrder.status === 'approved') {
                        await notifyWithHaptic(
                            '✅ Order Approved!',
                            `Your order #${newOrder.id.substring(0, 8).toUpperCase()} payment was verified.`,
                            'success'
                        );
                    } else if (newOrder.status === 'rejected') {
                        await notifyWithHaptic(
                            '❌ Order Rejected',
                            `There was an issue with order #${newOrder.id.substring(0, 8).toUpperCase()}.`,
                            'error'
                        );
                    }
                })
                .subscribe();
            channels.push(ch);
        }

        // 🚚 DELIVERY MAN: notified when a new order is ready for delivery
        if (role === 'delivery') {
            const ch = supabase
                .channel(`delivery-man-orders-${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'orders',
                }, async (payload: any) => {
                    const { new: newOrder, old: oldOrder } = payload;
                    if (newOrder.status === oldOrder.status) return;

                    if (newOrder.status === 'approved_for_delivery') {
                        await notifyWithHaptic(
                            '🚚 New Delivery Assigned!',
                            `Order #${newOrder.id.substring(0, 8).toUpperCase()} is ready for delivery.`,
                            'success'
                        );
                    }
                })
                .subscribe();
            channels.push(ch);
        }

        // 🔔 ADMIN: notified when a payment is submitted for verification
        if (role === 'admin') {
            const ch = supabase
                .channel(`admin-payments-${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'payments',
                }, async (payload: any) => {
                    const payment = payload.new;
                    await notifyWithHaptic(
                        '💳 New Payment Received',
                        `Order #${payment.order_id?.substring(0, 8).toUpperCase()} — Amount: ${payment.amount?.toLocaleString()} FCFA. Verify now.`,
                        'warning'
                    );
                })
                .subscribe();

            // Also notify admin when any order status changes
            const ch2 = supabase
                .channel(`admin-orders-${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'orders',
                }, async (payload: any) => {
                    const { new: newOrder, old: oldOrder } = payload;
                    if (newOrder.status === oldOrder.status) return;
                    if (newOrder.status === 'paid_waiting_verification') {
                        await sendLocalNotification(
                            '🔔 Payment Awaiting Verification',
                            `Order #${newOrder.id.substring(0, 8).toUpperCase()} needs payment review.`
                        );
                    }
                })
                .subscribe();
            channels.push(ch, ch2);
        }

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, [user, profile]);

    return (
        <NotificationContext.Provider value={{}}>
            {children}
        </NotificationContext.Provider>
    );
}

async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('autoparts-default', {
            name: 'AutoParts Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFD700',
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
            console.log('[Notifications] Permission not granted.');
        }
    }
}
