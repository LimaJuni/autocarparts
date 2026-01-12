import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

type FeedbackType = 'success' | 'error';

interface FeedbackOverlayProps {
    visible: boolean;
    type: FeedbackType;
    message: string;
    onFinish?: () => void;
}

export default function FeedbackOverlay({ visible, type, message, onFinish }: FeedbackOverlayProps) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = withSequence(
                withSpring(1.2, { damping: 10 }),
                withSpring(1)
            );
            opacity.value = withTiming(1, { duration: 200 });

            const timer = setTimeout(() => {
                scale.value = withTiming(0, { duration: 300 });
                opacity.value = withTiming(0, { duration: 300 }, () => {
                    if (onFinish) runOnJS(onFinish)();
                });
            }, 2000);

            return () => clearTimeout(timer);
        } else {
            scale.value = 0;
            opacity.value = 0;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value
    }));

    if (!visible) return null;

    const isSuccess = type === 'success';
    const color = isSuccess ? '#4CD964' : '#FF3B30';
    const icon = isSuccess ? 'checkmark-circle' : 'close-circle';

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.card, animatedStyle]}>
                <Ionicons name={icon} size={80} color={color} />
                <Text style={[styles.text, { color }]}>{message}</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    card: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10
    }
});
