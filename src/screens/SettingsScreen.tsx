// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // 🚀 NEW IMPORT
import Toast from 'react-native-toast-message';
import { supabase } from '../services/supabase';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';

export default function SettingsScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [logo, setLogo] = useState(''); // 🚀 NEW: Logo State
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                setProfile(data);
                setName(data.name || '');
                setCompany(data.company_name || '');
                setLogo(data.company_logo || '');
            }
        }
    };

    // 🚀 NEW: WHATSAPP-STYLE IMAGE PICKER
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3, // Compressed for fast database saving
            base64: true, // We save as Base64 directly into the text column
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setLogo(base64Image);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                name,
                company_name: company,
                company_logo: logo
            })
            .eq('id', profile.id);

        if (error) Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        else Toast.show({ type: 'success', text1: 'Profile Updated!' });
        setIsSaving(false);
    };

    const handleLogout = async () => {
        if (profile) await supabase.from('profiles').update({ is_online: false }).eq('id', profile.id);
        supabase.auth.signOut();
    };

    if (!profile) return <View style={styles.container}><ActivityIndicator color={theme.primaryGlow} style={{ marginTop: 100 }} /></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
            <View style={styles.header}>
                <Text style={styles.title}>System Settings</Text>
                <Text style={styles.subtitle}>{profile.role.toUpperCase()} ACCOUNT</Text>
            </View>

            <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Branding & Profile</Text>

                {/* 🚀 NEW: LOGO UPLOAD UI */}
                {profile.role === 'admin' && (
                    <View style={styles.logoUploadContainer}>
                        <TouchableOpacity style={styles.logoWrapper} onPress={pickImage}>
                            {logo ? (
                                <Image source={{ uri: logo }} style={styles.profileLogo} />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Ionicons name="business" size={40} color={theme.textMuted} />
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={16} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.logoHint}>Tap to change company logo</Text>
                    </View>
                )}

                <GlassInput label="FULL NAME" value={name} onChangeText={setName} />

                {profile.role === 'admin' && (
                    <GlassInput label="COMPANY NAME" value={company} onChangeText={setCompany} />
                )}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color={theme.background} /> : <Text style={styles.saveBtnText}>Update Profile</Text>}
                </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={styles.logoutText}>Secure Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingTop: 40, marginBottom: 30 },
    title: { color: theme.textMain, fontSize: 32, fontWeight: 'bold' },
    subtitle: { color: theme.primaryGlow, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginTop: 5 },
    card: { padding: 20, marginBottom: 30 },
    sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },

    // 🚀 NEW LOGO UPLOAD STYLES
    logoUploadContainer: { alignItems: 'center', marginBottom: 25 },
    logoWrapper: { position: 'relative', width: 100, height: 100, borderRadius: 50 },
    profileLogo: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.primaryGlow },
    logoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: theme.glassBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primaryGlow, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.background },
    logoHint: { color: theme.textMuted, fontSize: 12, marginTop: 10 },

    saveBtn: { backgroundColor: theme.primaryGlow, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: theme.background, fontWeight: 'bold', fontSize: 14 },
    logoutBtn: { flexDirection: 'row', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 }
});