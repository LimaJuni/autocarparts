import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

/**
 * Send a local push notification immediately.
 * Works in development builds. Falls back silently in Expo Go.
 */
export async function sendLocalNotification(title: string, body: string): Promise<void> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: 'default' },
            trigger: null, // Immediate
        });
    } catch (e) {
        // Silently fail in Expo Go environment
        console.warn('[Notification] Could not send notification:', e);
    }
}

/**
 * Trigger haptic feedback alongside a notification.
 */
export async function notifyWithHaptic(
    title: string,
    body: string,
    type: 'success' | 'error' | 'warning' = 'success'
): Promise<void> {
    const hapticMap = {
        success: Haptics.NotificationFeedbackType.Success,
        error: Haptics.NotificationFeedbackType.Error,
        warning: Haptics.NotificationFeedbackType.Warning,
    };
    await Haptics.notificationAsync(hapticMap[type]);
    await sendLocalNotification(title, body);
}
