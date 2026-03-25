// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform, Modal
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
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // 🚀 NEW: OTP Recovery Modal States
    const [recoveryStep, setRecoveryStep] = useState<'none' | 'email' | 'otp'>('none');
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newRecoveryPassword, setNewRecoveryPassword] = useState('');

    const handleAuth = async () => {
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
            authEmail = `${mobile.trim()}@twm.local`;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: password
                });
                if (error) throw error;

                if (data.user) {
                    await supabase.from('profiles').update({ is_online: true }).eq('id', data.user.id);
                }
            } else {
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

    // 🚀 OTP PHASE 1: Send the 6-digit code to the email
    const handleSendOtp = async () => {
        if (!recoveryEmail.trim()) {
            Toast.show({ type: 'error', text1: 'Email Required' });
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim());

        if (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Code Sent!', text2: 'Check your email for the 6-digit code.' });
            setRecoveryStep('otp'); // Move to the next screen in the modal
        }
        setIsLoading(false);
    };

    // 🚀 OTP PHASE 2: Verify the code and update the password directly
    const handleVerifyAndReset = async () => {
        if (!otpCode.trim() || !newRecoveryPassword.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter the code and a new password.' });
            return;
        }

        setIsLoading(true);
        
        // Step A: Verify the 6-digit code (This temporarily logs them in behind the scenes)
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: recoveryEmail.trim(),
            token: otpCode.trim(),
            type: 'recovery'
        });

        if (verifyError) {
            Toast.show({ type: 'error', text1: 'Invalid Code', text2: verifyError.message });
            setIsLoading(false);
            return;
        }

        // Step B: Now that they are verified, update the password!
        const { error: updateError } = await supabase.auth.updateUser({ 
            password: newRecoveryPassword 
        });

        if (updateError) {
            Toast.show({ type: 'error', text1: 'Update Failed', text2: updateError.message });
        } else {
            Toast.show({ type: 'success', text1: 'Password Updated!', text2: 'You can now log in with your new password.' });
            setRecoveryStep('none'); // Close modal
            setOtpCode('');
            setNewRecoveryPassword('');
            setPassword(''); // Clear the main login form
        }
        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

                {!isAdminMode ? (
                    <GlassInput label="MOBILE NUMBER" value={mobile} onChangeText={setMobile} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
                ) : (
                    <GlassInput label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                )}

                <GlassInput label="PASSWORD" value={password} onChangeText={setPassword} secureTextEntry keyboardType='default' />

                {isAdminMode && isLogin && (
                    <TouchableOpacity 
                        onPress={() => {
                            setRecoveryEmail(email); // Pre-fill if they already typed it
                            setRecoveryStep('email');
                        }} 
                        style={{ alignSelf: 'flex-end', marginBottom: 15, marginTop: -5 }}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                )}

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

            {/* 🚀 OTP RECOVERY MODAL */}
            <Modal animationType="slide" transparent={true} visible={recoveryStep !== 'none'} onRequestClose={() => setRecoveryStep('none')}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={styles.modalContent}>
                        
                        {/* HEADER */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={styles.modalTitle}>Reset Password</Text>
                            <TouchableOpacity onPress={() => setRecoveryStep('none')}>
                                <Text style={{ color: theme.textMuted, fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        {/* STEP 1: ASK FOR EMAIL */}
                        {recoveryStep === 'email' && (
                            <>
                                <Text style={styles.modalSubtitle}>Enter your admin email. We will send you a 6-digit code.</Text>
                                <GlassInput label="ADMIN EMAIL" value={recoveryEmail} onChangeText={setRecoveryEmail} keyboardType="email-address" autoCapitalize="none" />
                                <TouchableOpacity style={styles.submitButton} onPress={handleSendOtp} disabled={isLoading}>
                                    {isLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.submitButtonText}>SEND CODE</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* STEP 2: VERIFY CODE & NEW PASSWORD */}
                        {recoveryStep === 'otp' && (
                            <>
                                <Text style={styles.modalSubtitle}>Enter the 6-digit code sent to {recoveryEmail}</Text>
                                <GlassInput label="6-DIGIT CODE" value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" placeholder="e.g. 123456" />
                                <GlassInput label="NEW PASSWORD" value={newRecoveryPassword} onChangeText={setNewRecoveryPassword} secureTextEntry />
                                
                                <TouchableOpacity style={styles.submitButton} onPress={handleVerifyAndReset} disabled={isLoading}>
                                    {isLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.submitButtonText}>UPDATE PASSWORD</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                    </View>
                </KeyboardAvoidingView>
            </Modal>

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
    toggleTextBold: { color: theme.primaryGlow, fontWeight: 'bold' },
    forgotPasswordText: { color: theme.primaryGlow, fontSize: 12, fontWeight: '600' },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', padding: 20, justifyContent: 'center' },
    modalContent: { width: '100%', padding: 30, backgroundColor: '#0F172A', borderRadius: 16, borderColor: theme.glassBorder, borderWidth: 1 },
    modalTitle: { color: theme.textMain, fontSize: 22, fontWeight: 'bold' },
    modalSubtitle: { color: theme.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 20 },
});