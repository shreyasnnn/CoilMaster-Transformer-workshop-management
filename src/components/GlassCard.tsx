// src/components/GlassCard.tsx
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../theme/colors';

interface GlassCardProps extends ViewProps {
    children: React.ReactNode;
}

export const GlassCard = ({ children, style, ...props }: GlassCardProps) => {
    return (
        <View style={[styles.card, style]} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.glassCard,
        borderColor: theme.glassBorder,
        borderWidth: 1,
        borderRadius: 16,
        padding: 20,
        // Soft shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 5, // For Android
    }
});