// src/screens/SetupScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // 🚀 IMPORT ADDED
import Toast from 'react-native-toast-message';
import { supabase } from '../services/supabase';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';

export default function SetupScreen({ navigation }: any) {
    const [companyName, setCompanyName] = useState('');
    const [city, setCity] = useState('');
    const [logo, setLogo] = useState(''); // 🚀 NEW: Logo State
    const [isLoading, setIsLoading] = useState(false);

    // 🚀 NEW: Image Picker Function
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setLogo(base64Image);
        }
    };

    const handleCompleteSetup = async () => {
        if (!companyName.trim() || !city.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter company name and city.' });
            return;
        }

        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({
                    company_name: companyName.trim(),
                    company_city: city.trim(),
                    company_logo: logo, // 🚀 Saves the logo to the DB
                    is_setup_complete: true
                })
                .eq('id', user.id);

            if (error) {
                Toast.show({ type: 'error', text1: 'Error', text2: error.message });
            } else {
                Toast.show({ type: 'success', text1: 'Setup Complete!' });
                navigation.replace('MainTabs');
            }
        }
        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.headerContainer}>
                <Text style={styles.logoText}>Welcome to the Platform</Text>
                <Text style={styles.subtitle}>Let's set up your workspace.</Text>
            </View>

            <GlassCard style={styles.card}>
                <GlassInput label="COMPANY NAME" value={companyName} onChangeText={setCompanyName} placeholder="e.g. AtoZ Solutions" autoCapitalize="words" />
                <GlassInput label="CITY" value={city} onChangeText={setCity} placeholder="e.g. Bangalore" autoCapitalize="words" />

                {/* 🚀 FULLY FUNCTIONAL LOGO UPLOAD */}
                <View style={styles.logoUploadBox}>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8 }}>COMPANY LOGO (OPTIONAL)</Text>
                    <TouchableOpacity
                        style={[styles.uploadBtn, logo ? { padding: 0, borderWidth: 0 } : {}]}
                        onPress={pickImage}
                    >
                        {logo ? (
                            <Image source={{ uri: logo }} style={styles.uploadedLogo} />
                        ) : (
                            <Text style={{ color: theme.primaryGlow, fontWeight: 'bold' }}>+ Select Image</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleCompleteSetup} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.submitButtonText}>FINISH SETUP</Text>}
                </TouchableOpacity>
            </GlassCard>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 20 },
    headerContainer: { alignItems: 'center', marginBottom: 40 },
    logoText: { color: theme.primaryGlow, fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: theme.textMuted, fontSize: 14, marginTop: 5 },
    card: { padding: 30 },
    logoUploadBox: { marginTop: 10, marginBottom: 20 },
    uploadBtn: { padding: 15, borderWidth: 1, borderColor: theme.primaryGlow, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 60 },
    uploadedLogo: { width: 80, height: 80, borderRadius: 8 },
    submitButton: { backgroundColor: theme.primaryGlow, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    submitButtonText: { color: theme.background, fontWeight: 'bold', fontSize: 16 }
});