// src/screens/AddWorkerScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';

export default function AddWorkerScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [gender, setGender] = useState('Male');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateEmployee = async () => {
        if (!name || !password || !mobile) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill out all required fields.' });
            return;
        }

        // 🚀 NEW: Strict 10-digit Mobile Validation
        const mobileClean = mobile.trim();
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobileClean)) {
            Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Please enter a valid 10-digit mobile number.' });
            return;
        }

        setIsLoading(true);

        // We use the mobile number to silently generate an internal login email
        const emailToUse = `${mobileClean}@twm.local`;

        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || supabase['supabaseUrl'];
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || supabase['supabaseKey'];

        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        const { data: { user: adminUser } } = await supabase.auth.getUser();

        if (!adminUser) {
            Toast.show({ type: 'error', text1: 'Auth Error', text2: 'You must be logged in.' });
            setIsLoading(false);
            return;
        }

        const { error } = await tempClient.auth.signUp({
            email: emailToUse,
            password: password,
            options: {
                data: {
                    name: name.trim(),
                    role: 'worker',
                    mobile: mobileClean,
                    gender: gender,
                    admin_id: adminUser.id
                }
            }
        });

        if (error) {
            Toast.show({ type: 'error', text1: 'Creation Failed', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Employee Created!', text2: `${name} can now log in using their mobile number.` });
            navigation.goBack();
        }
        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollArea}>
                <Text style={styles.headerTitle}>New Employee</Text>
                <Text style={styles.headerSubtitle}>System Registration</Text>

                <GlassCard style={styles.cardSpacing}>
                    <GlassInput label="FULL NAME" value={name} onChangeText={setName} placeholder="e.g. Shashi Kumar" autoCapitalize="words" />

                    {/* 🚀 REMOVED THE EMAIL/USERNAME INPUT ENTIRELY */}

                    <GlassInput label="MOBILE NUMBER (10 DIGITS)" value={mobile} onChangeText={setMobile} placeholder="e.g. 9876543210" keyboardType="phone-pad" maxLength={10} />

                    <View style={styles.genderRow}>
                        <TouchableOpacity style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]} onPress={() => setGender('Male')}>
                            <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]} onPress={() => setGender('Female')}>
                            <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
                        </TouchableOpacity>
                    </View>

                    <GlassInput label="ASSIGN PASSWORD" value={password} onChangeText={setPassword} placeholder="Must be 6+ characters" />

                    <TouchableOpacity style={styles.submitButton} onPress={handleCreateEmployee} disabled={isLoading}>
                        {isLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.submitButtonText}>CREATE EMPLOYEE ACCOUNT</Text>}
                    </TouchableOpacity>
                </GlassCard>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollArea: { padding: 20, paddingTop: 40, paddingBottom: 60 },
    headerTitle: { color: theme.primaryGlow, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    headerSubtitle: { color: theme.textMain, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 5, marginBottom: 25 },
    cardSpacing: { padding: 25 },
    genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 5 },
    genderBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
    genderBtnActive: { backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: theme.primaryGlow },
    genderText: { color: theme.textMuted, fontWeight: 'bold' },
    genderTextActive: { color: theme.primaryGlow },
    submitButton: { backgroundColor: theme.primaryGlow, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: theme.background, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});