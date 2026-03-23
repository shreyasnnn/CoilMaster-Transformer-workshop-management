// src/screens/PlaceholderScreen.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/colors';

export default function PlaceholderScreen({ route }: any) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{route.name.replace('Tab', '')} Module</Text>
            <Text style={styles.subtitle}>Coming soon...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
    title: { color: theme.primaryGlow, fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: theme.textMuted, fontSize: 16, marginTop: 10 }
});