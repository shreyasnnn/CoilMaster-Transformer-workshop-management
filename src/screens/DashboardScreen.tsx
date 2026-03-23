// src/screens/DashboardScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { supabase } from '../services/supabase';

export default function DashboardScreen({ navigation }: any) {
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [stats, setStats] = useState({ active: 0, pending: 0, done: 0 });

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [userProfile, setUserProfile] = useState<any>(null);
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<any>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchDashboardData(false);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData(recentJobs.length === 0);
        }, [recentJobs.length])
    );

    const fetchDashboardData = async (showMainSpinner = false) => {
        if (showMainSpinner) setIsInitialLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setIsInitialLoading(false);
            setRefreshing(false);
            return;
        }

        // 1. Fetch the logged-in user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        let displayProfile = profile;

        // 🚀 THE FIX: If it's a worker, fetch their Admin's profile to get the branding!
        if (profile?.role === 'worker' && profile?.admin_id) {
            const { data: adminProfile } = await supabase
                .from('profiles')
                .select('company_name, company_logo')
                .eq('id', profile.admin_id)
                .single();

            if (adminProfile) {
                // Merge the Admin's branding into the worker's display profile
                displayProfile = {
                    ...profile,
                    company_name: adminProfile.company_name,
                    company_logo: adminProfile.company_logo
                };
            }
        }

        setUserProfile(displayProfile);

        // Redirect if Admin hasn't completed setup!
        if (displayProfile?.role === 'admin' && !displayProfile?.is_setup_complete) {
            navigation.replace('Setup');
            return;
        }

        const myWorkshopId = displayProfile?.role === 'admin' ? displayProfile.id : displayProfile?.admin_id;

        // Fetch top 3 orders for THIS specific workshop
        const { data: jobs } = await supabase
            .from('jobs')
            .select('*')
            .eq('admin_id', myWorkshopId)
            .order('created_at', { ascending: false })
            .limit(3);

        if (jobs) setRecentJobs(jobs);

        // Fetch stats for THIS specific workshop
        const { data: allJobs } = await supabase
            .from('jobs')
            .select('status')
            .eq('admin_id', myWorkshopId);

        if (allJobs) {
            setStats({
                pending: allJobs.filter(j => j.status === 'pending').length,
                active: allJobs.filter(j => j.status === 'in_progress').length,
                done: allJobs.filter(j => j.status === 'completed').length,
            });
        }

        setIsInitialLoading(false);
        setRefreshing(false);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData(false);
    }, []);

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
        setIsInitialLoading(true);

        const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete.id);

        if (error) Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        else {
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Job has been removed.' });
            fetchDashboardData(false);
        }
        setJobToDelete(null);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {userProfile?.company_logo ? (
                        <Image source={{ uri: userProfile.company_logo }} style={styles.logoImage} />
                    ) : (
                        <View style={styles.logoPlaceholder}>
                            <Ionicons name="business" size={20} color="#FFF" />
                        </View>
                    )}
                    <Text style={[styles.title, { fontSize: 24, color: theme.statusDone, flexShrink: 1 }]} numberOfLines={1}>
                        {userProfile?.company_name || 'Industrial Refinement'}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => onRefresh()} style={{ padding: 5, marginRight: 8 }}>
                        <Ionicons name="sync" size={24} color={theme.statusDone} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => Toast.show({ type: 'info', text1: 'Theme Switcher', text2: 'Coming soon!' })} style={{ padding: 5 }}>
                        <Ionicons name="moon" size={24} color={theme.statusDone} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primaryGlow}
                        colors={[theme.primaryGlow]}
                        progressBackgroundColor={theme.glassCard}
                    />
                }
            >

                <GlassCard style={styles.cardSpacing}>
                    <Text style={styles.cardTitle}>Operational Pulse</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>ACTIVE</Text>
                            <Text style={styles.statNumber}>{isInitialLoading ? '-' : stats.active}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>PENDING</Text>
                            <Text style={[styles.statNumber, { color: theme.secondaryGlow }]}>
                                {isInitialLoading ? '-' : stats.pending}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>DONE</Text>
                            <Text style={styles.statNumber}>{isInitialLoading ? '-' : stats.done}</Text>
                        </View>
                    </View>
                </GlassCard>

                <View style={styles.cardSpacing}>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primaryGlow }]} onPress={() => navigation.navigate('Calculator')}>
                        <Text style={styles.actionButtonText}>Transformer Calculator</Text>
                    </TouchableOpacity>
                </View>

                {userProfile?.role === 'admin' && (
                    <View style={[styles.cardSpacing, { flexDirection: 'row', gap: 12, marginTop: -10 }]}>
                        <TouchableOpacity style={[styles.actionButton, { flex: 1, backgroundColor: theme.glassCard, borderWidth: 1, borderColor: theme.glassBorder }]} onPress={() => navigation.navigate('WorkersTab')}>
                            <Text style={[styles.actionButtonText, { color: theme.textMain }]}>Manage Workers</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, { flex: 1, backgroundColor: theme.statusProgress }]} onPress={() => navigation.navigate('AddWorker')}>
                            <Text style={styles.actionButtonText}>+ Add Employee</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Recent Production Orders</Text>

                <GlassCard style={styles.cardSpacing}>
                    {isInitialLoading ? (
                        <ActivityIndicator color={theme.primaryGlow} style={{ padding: 20 }} />
                    ) : recentJobs.length === 0 ? (
                        <Text style={styles.emptyText}>No jobs in the database yet.</Text>
                    ) : (
                        recentJobs.map((job, index) => {
                            const displayName = job.specs.jobName ? job.specs.jobName : formatJobId(job.id);
                            return (
                                <View key={job.id}>
                                    <View style={styles.jobRowWrapper}>
                                        <TouchableOpacity
                                            style={styles.jobRowTouchable}
                                            onPress={() => navigation.navigate('JobDetails', { job: job, userProfile: userProfile })}
                                            activeOpacity={0.7}
                                        >
                                            <View>
                                                <Text style={styles.jobId}>{displayName}</Text>
                                                <Text style={styles.jobSpecs}>{job.specs.vIn}V ➔ {job.specs.vOut}V  |  {job.specs.amps}A</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { borderColor: getStatusColor(job.status) }]}>
                                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
                                                <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>{job.status.toUpperCase()}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Workers can see the delete button if we want, but usually only admins delete from dashboard. Leaving as is based on your previous code */}
                                        <TouchableOpacity style={styles.deleteIconBtn} onPress={() => handleDeleteClick(job)}>
                                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    {index < recentJobs.length - 1 && <View style={styles.divider} />}
                                </View>
                            );
                        })
                    )}

                    {!isInitialLoading && recentJobs.length > 0 && (
                        <TouchableOpacity style={styles.showMoreBtn} onPress={() => navigation.navigate('OrdersTab')}>
                            <Text style={styles.showMoreText}>Show All Orders</Text>
                            <Ionicons name="arrow-forward" size={16} color={theme.primaryGlow} />
                        </TouchableOpacity>
                    )}
                </GlassCard>
            </ScrollView>

            <Modal animationType="fade" transparent={true} visible={isDeleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
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
                                <Text style={styles.warningText}>Warning: This job is not yet completed. Deleting it will remove it from the workshop queue.</Text>
                            </View>
                        )}
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmDelete}><Text style={styles.modalDeleteBtnText}>Delete Job</Text></TouchableOpacity>
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
    title: { color: theme.textMain, fontSize: 32, fontWeight: 'bold', flexShrink: 1 },

    logoImage: { width: 36, height: 36, borderRadius: 8, marginRight: 12 },
    logoPlaceholder: { width: 36, height: 36, backgroundColor: theme.primaryGlow, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },

    scrollArea: { flex: 1, paddingHorizontal: 20 },
    cardSpacing: { marginBottom: 24 },
    cardTitle: { color: theme.textMain, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
    sectionTitle: { color: theme.textMain, fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { alignItems: 'flex-start' },
    statLabel: { color: theme.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
    statNumber: { color: theme.primaryGlow, fontSize: 36, fontWeight: 'bold' },

    actionButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
    actionButtonText: { fontSize: 16, fontWeight: 'bold', color: theme.background },

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

    showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingVertical: 10 },
    showMoreText: { color: theme.primaryGlow, fontWeight: 'bold', marginRight: 8, fontSize: 14 },

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