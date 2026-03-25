// src/screens/ManageWorkersScreen.tsx
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../services/supabase';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';

export default function ManageWorkersScreen() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [userRole, setUserRole] = useState('worker');

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editMobile, setEditMobile] = useState('');
    const [editGender, setEditGender] = useState('Male');
    const [editPassword, setEditPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [workerToDelete, setWorkerToDelete] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            fetchWorkers();
        }, [])
    );

    const fetchWorkers = async () => {
        setIsLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsLoading(false);
            return;
        }

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        setUserRole(profile?.role || 'worker');

        const myWorkshopId = profile?.role === 'admin' ? profile.id : profile?.admin_id;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'worker')
            .eq('admin_id', myWorkshopId)
            .order('created_at', { ascending: false });

        if (data) setWorkers(data);
        setIsLoading(false);
    };

    const openEditModal = (worker: any) => {
        setSelectedWorker(worker);
        setEditName(worker.name || '');
        setEditMobile(worker.mobile || '');
        setEditGender(worker.gender || 'Male');
        setEditPassword('');
        setIsEditModalVisible(true);
    };

    const saveWorkerEdits = async () => {
        if (!editName.trim()) {
            Toast.show({ type: 'error', text1: 'Name Required' });
            return;
        }

        setIsSaving(true);

        const { error } = await supabase.from('profiles').update({
            name: editName.trim(),
            mobile: editMobile.trim(),
            gender: editGender
        }).eq('id', selectedWorker.id);

        if (error) {
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message });
            setIsSaving(false);
            return;
        }

        if (editPassword.length > 0) {
            Toast.show({ type: 'info', text1: 'Updating Password...', text2: 'Please wait.' });

            const { error: funcError } = await supabase.functions.invoke('reset-worker-password', {
                body: { workerId: selectedWorker.id, newPassword: editPassword }
            });

            if (funcError) {
                Toast.show({ type: 'error', text1: 'Password Failed', text2: funcError.message });
            } else {
                Toast.show({ type: 'success', text1: 'Employee Updated!', text2: 'Profile and password saved successfully.' });
            }
        } else {
            Toast.show({ type: 'success', text1: 'Employee Updated!' });
        }

        setIsEditModalVisible(false);
        fetchWorkers();
        setIsSaving(false);
    };

    const triggerDeleteWarning = (worker: any) => {
        setWorkerToDelete(worker);
        setIsDeleteModalVisible(true);
    };

    const confirmDeleteWorker = async () => {
        if (!workerToDelete) return;
        
        setIsDeleteModalVisible(false);
        setIsLoading(true);

        const { error: funcError } = await supabase.functions.invoke('delete-worker', {
            body: { workerId: workerToDelete.id }
        });

        if (funcError) {
            Toast.show({ type: 'error', text1: 'Deletion Failed', text2: funcError.message });
        } else {
            Toast.show({ type: 'success', text1: 'Employee Removed', text2: `${workerToDelete.name}'s account has been permanently deleted.` });
            fetchWorkers();
        }
        
        setWorkerToDelete(null);
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollArea}>
                <Text style={styles.headerTitle}>Workshop Roster</Text>
                <Text style={styles.headerSubtitle}>{userRole === 'admin' ? 'Manage Employees' : 'Team Overview'}</Text>

                <GlassCard style={{ padding: 20 }}>
                    {isLoading ? (
                        <ActivityIndicator color={theme.primaryGlow} style={{ padding: 20 }} />
                    ) : workers.length === 0 ? (
                        <Text style={styles.emptyText}>No employees found.</Text>
                    ) : (
                        workers.map((worker, index) => (
                            <View key={worker.id}>
                                <View style={styles.workerRowWrapper}>
                                    <TouchableOpacity
                                        style={styles.workerRowTouchable}
                                        activeOpacity={userRole === 'admin' ? 0.7 : 1}
                                        onPress={() => {
                                            // 🚀 BULLETPROOF CLICK LOGIC
                                            if (userRole === 'admin') {
                                                openEditModal(worker);
                                            } else {
                                                Toast.show({ type: 'info', text1: 'Read Only', text2: 'Workers cannot edit profiles.' });
                                            }
                                        }}
                                    >
                                        <View style={styles.iconCircle}>
                                            <Ionicons name="person" size={20} color={theme.primaryGlow} />
                                        </View>

                                        <View style={styles.workerInfo}>
                                            <View style={styles.nameRow}>
                                                <View style={[styles.onlineDot, { backgroundColor: worker.is_online ? theme.statusDone : theme.textMuted }]} />
                                                <Text style={styles.workerName}>{worker.name}</Text>
                                            </View>
                                            <Text style={styles.workerDetails}>{worker.gender}  |  📞 {worker.mobile || 'N/A'}</Text>
                                        </View>

                                        {userRole === 'admin' && (
                                            <View style={styles.statusBadge}>
                                                <Text style={styles.statusText}>EDIT</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {userRole === 'admin' && (
                                        <TouchableOpacity 
                                            style={styles.deleteIconBtn} 
                                            onPress={() => {
                                                // 🚀 BULLETPROOF DELETE CLICK
                                                triggerDeleteWarning(worker);
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {index < workers.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))
                    )}
                </GlassCard>
            </ScrollView>

            {/* EDIT MODAL */}
            <Modal animationType="fade" transparent={true} visible={isEditModalVisible} onRequestClose={() => setIsEditModalVisible(false)}>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Employee</Text>
                            <GlassInput label="FULL NAME" value={editName} onChangeText={setEditName} placeholder="e.g. Shashi Kumar" autoCapitalize="words" />
                            <GlassInput label="MOBILE NUMBER" value={editMobile} onChangeText={setEditMobile} keyboardType="phone-pad" />
                            <View style={styles.genderRow}>
                                <TouchableOpacity style={[styles.genderBtn, editGender === 'Male' && styles.genderBtnActive]} onPress={() => setEditGender('Male')}><Text style={[styles.genderText, editGender === 'Male' && styles.genderTextActive]}>Male</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.genderBtn, editGender === 'Female' && styles.genderBtnActive]} onPress={() => setEditGender('Female')}><Text style={[styles.genderText, editGender === 'Female' && styles.genderTextActive]}>Female</Text></TouchableOpacity>
                            </View>
                            <View style={styles.passwordContainer}>
                                <GlassInput label="NEW PASSWORD (OPTIONAL)" value={editPassword} onChangeText={setEditPassword} placeholder="Leave blank to keep current" secureTextEntry autoCapitalize="none" />
                                <Text style={styles.securityWarning}>* Requires backend Edge Function to execute.</Text>
                            </View>
                            <View style={styles.modalButtonRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.modalConfirmBtn} onPress={saveWorkerEdits}><Text style={styles.modalSaveBtnText}>Save</Text></TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal animationType="fade" transparent={true} visible={isDeleteModalVisible} onRequestClose={() => setIsDeleteModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Remove Employee?</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure you want to permanently delete{" "}
                            <Text style={{ color: theme.textMain, fontWeight: 'bold' }}>{workerToDelete?.name}</Text>?
                        </Text>
                        
                        <View style={styles.warningBox}>
                            <Ionicons name="warning-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                            <Text style={styles.warningText}>This action cannot be undone. Their account will be wiped and their mobile number will be freed up.</Text>
                        </View>
                        
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsDeleteModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#EF4444' }]} onPress={confirmDeleteWorker}>
                                <Text style={styles.modalSaveBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollArea: { padding: 20, paddingTop: 40, paddingBottom: 60 },
    headerTitle: { color: theme.primaryGlow, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    headerSubtitle: { color: theme.textMain, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 5, marginBottom: 25 },
    emptyText: { color: theme.textMuted, textAlign: 'center', padding: 20, fontStyle: 'italic' },
    
    // 🚀 NEW: Layout styles for the row
    workerRowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    workerRowTouchable: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
    deleteIconBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginLeft: 5 },

    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(52, 211, 153, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    workerInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    workerName: { color: theme.textMain, fontSize: 18, fontWeight: 'bold' },
    workerDetails: { color: theme.textMuted, fontSize: 12 },
    statusBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.glassBorder },
    statusText: { color: theme.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    divider: { height: 1, backgroundColor: theme.glassBorder, marginVertical: 10 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', padding: 20, justifyContent: 'center' },
    modalContent: { width: '100%', padding: 24, backgroundColor: '#0F172A', borderRadius: 16, borderColor: theme.glassBorder, borderWidth: 1, marginTop: 'auto', marginBottom: 'auto' },
    modalTitle: { color: theme.textMain, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    modalSubtitle: { color: theme.textMuted, fontSize: 14, marginBottom: 15, lineHeight: 20 },
    
    genderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, marginTop: 5 },
    genderBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
    genderBtnActive: { backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: theme.primaryGlow },
    genderText: { color: theme.textMuted, fontWeight: 'bold' },
    genderTextActive: { color: theme.primaryGlow },
    
    passwordContainer: { marginBottom: 5 },
    securityWarning: { color: theme.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: -15, marginBottom: 15, marginLeft: 5 },
    
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalCancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', marginRight: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.glassBorder },
    modalCancelText: { color: theme.textMuted, fontWeight: 'bold', fontSize: 16 },
    modalConfirmBtn: { flex: 1, backgroundColor: theme.primaryGlow, paddingVertical: 16, alignItems: 'center', borderRadius: 12, marginLeft: 10 },
    modalSaveBtnText: { color: theme.background, fontWeight: 'bold', fontSize: 16 },
    
    warningBox: { flexDirection: 'row', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    warningText: { color: '#EF4444', fontSize: 13, flex: 1, lineHeight: 18 },
});