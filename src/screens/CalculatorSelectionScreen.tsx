// src/screens/CalculatorSelectionScreen.tsx
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';

export default function CalculatorSelectionScreen({ navigation }: any) {
    
    // Future-proof array. Just add to this list later!
    const calculatorTypes = [
        {
            id: 'ei_core',
            title: 'EI Core Transformer',
            subtitle: 'Standard laminations (E & I), bobbin sizing, and copper weight.',
            icon: 'hardware-chip-outline',
            route: 'Calculator', // The name of your existing math screen
            typeLabel: 'EI Core'
        },
        // {
        //     id: 'toroidal',
        //     title: 'Toroidal Transformer',
        //     subtitle: 'Ring core calculations (Coming in V2)',
        //     icon: 'aperture-outline',
        //     route: 'ToroidalCalculator',
        //     typeLabel: 'Toroidal'
        // }
    ];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollArea}>
                <Text style={styles.headerTitle}>Engine</Text>
                <Text style={styles.headerSubtitle}>Select Core Type</Text>

                {calculatorTypes.map((calc) => (
                    <TouchableOpacity 
                        key={calc.id} 
                        style={styles.cardWrapper}
                        onPress={() => navigation.navigate(calc.route, { transformerType: calc.typeLabel })}
                    >
                        <GlassCard style={styles.card}>
                            <View style={styles.iconCircle}>
                                <Ionicons name={calc.icon as any} size={28} color={theme.primaryGlow} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.calcTitle}>{calc.title}</Text>
                                <Text style={styles.calcSubtitle}>{calc.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                        </GlassCard>
                    </TouchableOpacity>
                ))}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollArea: { padding: 20, paddingTop: 40, paddingBottom: 60 },
    headerTitle: { color: theme.primaryGlow, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    headerSubtitle: { color: theme.textMain, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 5, marginBottom: 30 },
    cardWrapper: { marginBottom: 15 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(52, 211, 153, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    textContainer: { flex: 1 },
    calcTitle: { color: theme.textMain, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    calcSubtitle: { color: theme.textMuted, fontSize: 12, lineHeight: 18, paddingRight: 10 }
});