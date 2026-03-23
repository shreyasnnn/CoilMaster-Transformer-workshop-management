// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '../services/supabase';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';

export default function LoginScreen() {
    const [isAdminMode, setIsAdminMode] = useState(false);

    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Auth States
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState(''); // 🚀 NEW: State for Employee Phone Number
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleAuth = async () => {
        // 🚀 SMART VALIDATION & EMAIL CONSTRUCTION
        let authEmail = '';

        if (isAdminMode) {
            if (!email || !password) {
                Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter email and password.' });
                return;
            }
            authEmail = email.trim();
        } else {
            if (!mobile || !password) {
                Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter mobile number and password.' });
                return;
            }
            // 🚀 THE MAGIC TRICK: Convert phone number to a hidden system email!
            authEmail = `${mobile.trim()}@twm.local`;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authEmail, // Use our dynamically constructed email
                    password: password
                });
                if (error) throw error;

                // Flip their status to online!
                if (data.user) {
                    await supabase.from('profiles').update({ is_online: true }).eq('id', data.user.id);
                }
            } else {
                // Admin Registration Flow
                if (!name) {
                    Toast.show({ type: 'error', text1: 'Name Required' });
                    setIsLoading(false);
                    return;
                }
                const { error } = await supabase.auth.signUp({
                    email: authEmail,
                    password,
                    options: { data: { name: name.trim(), role: 'admin' } }
                });
                if (error) throw error;
                Toast.show({ type: 'success', text1: 'Success!', text2: isLogin ? 'Logged in.' : 'Account created.' });
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Auth Failed', text2: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.headerContainer}>
                <Text style={styles.logoText}>Industrial Refinement</Text>
                <Text style={styles.subtitle}>Workshop Management System</Text>
            </View>

            <GlassCard style={styles.card}>

                <View style={styles.roleTabRow}>
                    <TouchableOpacity
                        style={[styles.roleTab, !isAdminMode && styles.roleTabActive]}
                        onPress={() => { setIsAdminMode(false); setIsLogin(true); }}
                    >
                        <Text style={[styles.roleTabText, !isAdminMode && styles.roleTabTextActive]}>Employee</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.roleTab, isAdminMode && styles.roleTabActive]}
                        onPress={() => setIsAdminMode(true)}
                    >
                        <Text style={[styles.roleTabText, isAdminMode && styles.roleTabTextActive]}>Admin</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.formTitle}>
                    {!isAdminMode ? 'Employee Access' : (isLogin ? 'Admin Login' : 'Register Admin')}
                </Text>

                {isAdminMode && !isLogin && (
                    <GlassInput label="NAME" value={name} onChangeText={setName} placeholder="Shashi" keyboardType='default' autoCapitalize='words' autoCorrect={false} />
                )}

                {/* 🚀 CONDITIONAL INPUT RENDERING */}
                {!isAdminMode ? (
                    <GlassInput label="MOBILE NUMBER" value={mobile} onChangeText={setMobile} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
                ) : (
                    <GlassInput label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                )}

                <GlassInput label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry keyboardType='default' />

                <TouchableOpacity style={styles.submitButton} onPress={handleAuth} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.submitButtonText}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>}
                </TouchableOpacity>

                {isAdminMode && (
                    <TouchableOpacity style={styles.toggleButton} onPress={() => setIsLogin(!isLogin)}>
                        <Text style={styles.toggleText}>
                            {isLogin ? "Need a new account? " : "Already have an account? "}
                            <Text style={styles.toggleTextBold}>{isLogin ? 'Register' : 'Login'}</Text>
                        </Text>
                    </TouchableOpacity>
                )}
            </GlassCard>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 20 },
    headerContainer: { alignItems: 'center', marginBottom: 40 },
    logoText: { color: theme.primaryGlow, fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: theme.textMuted, fontSize: 14, marginTop: 5, letterSpacing: 1 },
    card: { padding: 30 },
    roleTabRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 4, marginBottom: 24 },
    roleTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    roleTabActive: { backgroundColor: theme.glassCard, borderColor: theme.glassBorder, borderWidth: 1 },
    roleTabText: { color: theme.textMuted, fontWeight: 'bold' },
    roleTabTextActive: { color: theme.primaryGlow },
    formTitle: { color: theme.textMain, fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
    submitButton: { backgroundColor: theme.primaryGlow, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    submitButtonText: { color: theme.background, fontWeight: 'bold', fontSize: 16 },
    toggleButton: { marginTop: 20, alignItems: 'center' },
    toggleText: { color: theme.textMuted },
    toggleTextBold: { color: theme.primaryGlow, fontWeight: 'bold' }
});