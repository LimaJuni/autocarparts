import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface FlyToCartProps {
    startPos: { x: number, y: number };
    endPos: { x: number, y: number };
    onFinish: () => void;
}

export default function FlyToCart({ startPos, endPos, onFinish }: FlyToCartProps) {
    const translateX = useSharedValue(startPos.x);
    const translateY = useSharedValue(startPos.y);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        translateX.value = withTiming(endPos.x, { duration: 600 });
        translateY.value = withTiming(endPos.y, { duration: 600 });
        scale.value = withTiming(0.2, { duration: 600 });
        opacity.value = withTiming(0, { duration: 600 }, () => {
            runOnJS(onFinish)();
        });
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        opacity: opacity.value
    }));

    return (
        <Animated.View style={[styles.particle, style]}>
            <View style={styles.iconContainer}>
                <Ionicons name="cart" size={24} color="#fff" />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5
    }
});
