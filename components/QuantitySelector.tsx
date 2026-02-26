import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    accentColor?: string;
    textColor?: string;
}

const QuantitySelector = ({ quantity, onIncrease, onDecrease, accentColor = '#fff', textColor = '#fff' }: Props) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, { borderColor: accentColor }]}
                onPress={onDecrease}
                activeOpacity={0.7}
            >
                <Text style={[styles.buttonText, { color: accentColor }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.quantity, { color: textColor }]}>{quantity}</Text>
            <TouchableOpacity
                style={[styles.button, { borderColor: accentColor, backgroundColor: accentColor }]}
                onPress={onIncrease}
                activeOpacity={0.7}
            >
                <Text style={[styles.buttonText, { color: '#8B0000' }]}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    button: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 20,
    },
    quantity: {
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 24,
        textAlign: 'center',
    },
});

export default QuantitySelector;
