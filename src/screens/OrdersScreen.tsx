// src/screens/OrdersScreen.tsx
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { supabase } from '../services/supabase';

export default function OrdersScreen({ navigation }: any) {
    const [allJobs, setAllJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Modal States
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            fetchAllOrders();
        }, [])
    );

    const fetchAllOrders = async () => {
        setIsLoading(true);

        // 1. Get user profile (so we can pass it to JobDetails for assigning workers)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile(profile);
        }

        // 2. Fetch ALL jobs (Notice we removed the .limit() here!)
        const { data: jobs } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (jobs) setAllJobs(jobs);
        setIsLoading(false);
    };

    const formatJobId = (uuid: string) => `#TR-${uuid.substring(0, 4).toUpperCase()}`;

    const getStatusColor = (status: string) => {
        if (status === 'completed') return theme.statusDone;
        if (status === 'in_progress') return theme.statusProgress;
        return theme.statusPending;
    };

    const handleDeleteClick = (job: any) => {
        setJobToDelete(job);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!jobToDelete) return;
        setDeleteModalVisible(false);
        setIsLoading(true);

        const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete.id);

        if (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Job has been removed.' });
            fetchAllOrders(); // Refresh the list
        }
        setJobToDelete(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.systemText}>WORKSHOP DATABASE</Text>
                <Text style={styles.title}>All Production Orders</Text>
            </View>

            <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>
                <GlassCard style={styles.cardSpacing}>
                    {isLoading ? (
                        <ActivityIndicator color={theme.primaryGlow} style={{ padding: 20 }} />
                    ) : allJobs.length === 0 ? (
                        <Text style={styles.emptyText}>No jobs in the database yet.</Text>
                    ) : (
                        allJobs.map((job, index) => {
                            const displayName = job.specs.jobName ? job.specs.jobName : formatJobId(job.id);

                            return (
                                <View key={job.id}>
                                    <View style={styles.jobRowWrapper}>
                                        <TouchableOpacity
                                            style={styles.jobRowTouchable}
                                            onPress={() => navigation.navigate('JobDetails', {
                                                job: job,
                                                userProfile: userProfile
                                            })}
                                            activeOpacity={0.7}
                                        >
                                            <View>
                                                <Text style={styles.jobId}>{displayName}</Text>
                                                <Text style={styles.jobSpecs}>
                                                    {job.specs.vIn}V ➔ {job.specs.vOut}V  |  {job.specs.amps}A
                                                </Text>
                                            </View>

                                            <View style={[styles.statusBadge, { borderColor: getStatusColor(job.status) }]}>
                                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
                                                <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                                                    {job.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Delete Button for Everyone */}
                                        <TouchableOpacity
                                            style={styles.deleteIconBtn}
                                            onPress={() => handleDeleteClick(job)}
                                        >
                                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>

                                    {index < allJobs.length - 1 && <View style={styles.divider} />}
                                </View>
                            );
                        })
                    )}
                </GlassCard>
            </ScrollView>

            {/* DELETE MODAL (Fixed styling applied here too!) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isDeleteModalVisible}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Delete Job Card?</Text>
                        <Text style={styles.modalSubtitle}>
                            Are you sure you want to permanently delete{" "}
                            <Text style={{ color: theme.textMain, fontWeight: 'bold' }}>
                                {jobToDelete?.specs.jobName ? jobToDelete.specs.jobName : (jobToDelete && formatJobId(jobToDelete.id))}
                            </Text>?
                        </Text>

                        {jobToDelete?.status !== 'completed' && (
                            <View style={styles.warningBox}>
                                <Ionicons name="warning-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                                <Text style={styles.warningText}>
                                    Warning: This job is not yet completed. Deleting it will remove it from the workshop queue.
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmDelete}>
                                <Text style={styles.modalDeleteBtnText}>Delete Job</Text>
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
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
    systemText: { color: theme.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
    title: { color: theme.textMain, fontSize: 32, fontWeight: 'bold' },
    scrollArea: { flex: 1, paddingHorizontal: 20 },
    cardSpacing: { marginBottom: 24 },
    emptyText: { color: theme.textMuted, textAlign: 'center', padding: 20, fontStyle: 'italic' },

    jobRowWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    jobRowTouchable: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 15 },
    deleteIconBtn: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
    jobId: { color: theme.textMain, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    jobSpecs: { color: theme.textMuted, fontSize: 12 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)' },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: theme.glassBorder, marginVertical: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', padding: 24, backgroundColor: '#121212', borderRadius: 16, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 },
    modalTitle: { color: theme.textMain, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    modalSubtitle: { color: theme.textMuted, fontSize: 14, marginBottom: 15, lineHeight: 20 },
    warningBox: { flexDirection: 'row', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    warningText: { color: '#EF4444', fontSize: 13, flex: 1, lineHeight: 18 },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalCancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', marginRight: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.glassBorder },
    modalCancelText: { color: theme.textMuted, fontWeight: 'bold', fontSize: 16 },
    modalConfirmBtn: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 16, alignItems: 'center', borderRadius: 12, marginLeft: 10 },
    modalDeleteBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});