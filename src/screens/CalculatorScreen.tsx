// src/screens/CalculatorScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal
} from 'react-native';
import { calculateEICore } from '../utils/transformerMath';
import { theme } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export default function CalculatorScreen() {
    const [vIn, setVIn] = useState('220');
    const [vOut, setVOut] = useState('30');
    const [amps, setAmps] = useState('10');
    const [bobbinLength, setBobbinLength] = useState('1.5');

    const [mathResult, setMathResult] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [jobName, setJobName] = useState('');

    // 🚀 THE FIX: We actually need to store the profile here!
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        setIsSaved(false);
        fetchUserProfile(); // 🚀 Fetch it when the screen loads
    }, [vIn, vOut, amps, bobbinLength]);

    // 🚀 THE FIX: Function to grab the logged-in user's profile
    const fetchUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setUserProfile(data);
        }
    };

    const handleCalculate = () => {
        const specs = {
            vIn: Number(vIn),
            vOut: Number(vOut),
            amps: Number(amps),
            bobbinLength: Number(bobbinLength)
        };

        const result = calculateEICore(specs);
        setMathResult(result);
        setIsSaved(false);
    };

    const handleTriggerSave = () => {
        if (!mathResult || isSaved) return;
        setJobName('');
        setIsModalVisible(true);
    };

    const handleConfirmSave = async () => {
        if (!jobName.trim()) {
            Toast.show({ type: 'error', text1: 'Name Required', text2: 'Please enter a name for this job.' });
            return;
        }

        // 🚀 Safe check: Make sure profile is loaded before saving!
        if (!userProfile) {
            Toast.show({ type: 'error', text1: 'Loading', text2: 'Still loading user data, please wait.' });
            return;
        }

        setIsModalVisible(false);
        setIsSaving(true);

        // 🚀 MULTI-TENANCY: Assign to the correct Admin's workshop
        const workshopId = userProfile.role === 'admin' ? userProfile.id : userProfile.admin_id;

        const { error } = await supabase.from('jobs').insert([
            {
                admin_id: workshopId, // 🚀 Stamped with the workshop ID!
                specs: {
                    vIn: Number(vIn),
                    vOut: Number(vOut),
                    amps: Number(amps),
                    bobbinLength: Number(bobbinLength),
                    jobName: jobName.trim()
                },
                results: mathResult,
                status: 'pending'
            }
        ]);

        if (error) {
            Toast.show({ type: 'error', text1: 'Save Failed', text2: error.message, position: 'bottom' });
            setIsSaving(false);
        } else {
            setIsSaving(false);
            setIsSaved(true);
            Toast.show({ type: 'success', text1: 'Job Card Created! ⚡', text2: `Saved as: ${jobName}`, position: 'bottom' });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Industrial Refinement</Text>
            <Text style={styles.headerSubtitle}>Design Specifications</Text>

            <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>

                <GlassCard style={styles.cardSpacing}>
                    <GlassInput label="Input Voltage (V)" value={vIn} onChangeText={setVIn} keyboardType="numeric" />
                    <GlassInput label="Output Voltage (V)" value={vOut} onChangeText={setVOut} keyboardType="numeric" />
                    <GlassInput label="Output Current (Amps)" value={amps} onChangeText={setAmps} keyboardType="numeric" />
                    <GlassInput label="Bobbin Length (Inches)" value={bobbinLength} onChangeText={setBobbinLength} keyboardType="numeric" />

                    <TouchableOpacity style={styles.computeButton} onPress={handleCalculate}>
                        <Text style={styles.computeButtonText}>COMPUTE DESIGN</Text>
                    </TouchableOpacity>
                </GlassCard>

                {mathResult && (
                    <>
                        <View style={styles.logicContainer}>
                            <View style={styles.logicHeaderRow}>
                                <Ionicons name="stats-chart" size={20} color={theme.statusDone} />
                                <Text style={styles.logicTitle}>Calculation Logic</Text>
                            </View>

                            <View style={styles.logicStep}>
                                <View style={styles.stepNumberBox}><Text style={styles.stepNumberText}>01</Text></View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>TPV Calculation</Text>
                                    <Text style={styles.stepDesc}>Turns Per Volt factor established based on core area efficiency.</Text>
                                </View>
                            </View>

                            <View style={styles.logicStep}>
                                <View style={styles.stepNumberBox}><Text style={styles.stepNumberText}>02</Text></View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>SWG selection</Text>
                                    <Text style={styles.stepDesc}>Standard Wire Gauge matched against input current density.</Text>
                                </View>
                            </View>

                            <View style={styles.logicStep}>
                                <View style={styles.stepNumberBox}><Text style={styles.stepNumberText}>03</Text></View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>Bobbin size</Text>
                                    <Text style={styles.stepDesc}>Physical dimensions optimized for winding window clearance.</Text>
                                </View>
                            </View>

                            <View style={styles.logicStep}>
                                <View style={styles.stepNumberBox}><Text style={styles.stepNumberText}>04</Text></View>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>Copper weight</Text>
                                    <Text style={styles.stepDesc}>Mass calculation based on turn count and mean length.</Text>
                                </View>
                            </View>

                            <View style={[styles.logicStep, { borderLeftColor: 'transparent' }]}>
                                <View style={styles.stepNumberBox}><Text style={styles.stepNumberText}>05</Text></View>
                                <View style={[styles.stepContent, { paddingBottom: 0 }]}>
                                    <Text style={styles.stepTitle}>Copper length</Text>
                                    <Text style={styles.stepDesc}>Total spool length required for procurement manifest.</Text>
                                </View>
                            </View>
                        </View>

                        <GlassCard style={styles.resultsCard}>
                            <Text style={styles.resultTitle}>Calculated Output</Text>

                            <View style={styles.dataRow}><Text style={styles.dataLabel}>PRIMARY TURNS</Text><Text style={styles.dataValue}>{mathResult.primary.turns}</Text></View>
                            <View style={styles.dataRow}><Text style={styles.dataLabel}>PRIMARY SWG</Text><Text style={styles.dataValue}>{mathResult.primary.swg}</Text></View>
                            <View style={styles.dataDivider} />
                            <View style={styles.dataRow}><Text style={styles.dataLabel}>SECONDARY TURNS</Text><Text style={styles.dataValue}>{mathResult.secondary.turns}</Text></View>
                            <View style={styles.dataRow}><Text style={styles.dataLabel}>SECONDARY SWG</Text><Text style={styles.dataValue}>{mathResult.secondary.swg}</Text></View>
                            <View style={styles.dataDivider} />
                            <View style={styles.dataRow}>
                                <Text style={styles.dataLabel}>EST. COPPER WEIGHT</Text>
                                <Text style={[styles.dataValue, { color: theme.primaryGlow }]}>
                                    {(mathResult.primary.weightKg + mathResult.secondary.weightKg).toFixed(2)} KG
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    isSaved && styles.savedButtonLocked,
                                    isSaving && { opacity: 0.7 }
                                ]}
                                onPress={handleTriggerSave}
                                disabled={isSaving || isSaved}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : isSaved ? (
                                    <Text style={styles.saveButtonText}>✓ Saved to Workshop</Text>
                                ) : (
                                    <Text style={styles.saveButtonText}>Save & Create Job Card</Text>
                                )}
                            </TouchableOpacity>
                        </GlassCard>
                    </>
                )}
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Name this Job</Text>
                        <Text style={styles.modalSubtitle}>Give this work order a clear reference name for the workshop.</Text>

                        <GlassInput
                            label="CLIENT OR JOB NAME"
                            value={jobName}
                            onChangeText={setJobName}
                            placeholder="e.g. Shashi's Order"
                        />

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalConfirmBtn}
                                onPress={handleConfirmSave}
                            >
                                <Text style={styles.computeButtonText}>Confirm & Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingTop: 60 },
    headerTitle: { color: theme.primaryGlow, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    headerSubtitle: { color: theme.textMain, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 10, marginBottom: 20 },
    scrollArea: { flex: 1, paddingHorizontal: 20 },
    cardSpacing: { marginBottom: 20 },
    computeButton: { backgroundColor: theme.primaryGlow, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    computeButtonText: { color: theme.background, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    resultsCard: { borderColor: theme.primaryGlow, borderWidth: 1, marginBottom: 30 },
    resultTitle: { color: theme.textMain, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dataLabel: { color: theme.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
    dataValue: { color: theme.textMain, fontSize: 24, fontWeight: 'bold' },
    dataDivider: { height: 1, backgroundColor: theme.glassBorder, marginVertical: 15 },
    logicContainer: { marginBottom: 30, paddingHorizontal: 10 },
    logicHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    logicTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    logicStep: { flexDirection: 'row', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', marginLeft: 15, paddingLeft: 20, paddingBottom: 25, position: 'relative' },
    stepNumberBox: { position: 'absolute', left: -16, top: -2, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    stepNumberText: { color: theme.textMuted, fontSize: 12, fontWeight: 'bold' },
    stepContent: { flex: 1, marginTop: -2 },
    stepTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    stepDesc: { color: theme.textMuted, fontSize: 12, lineHeight: 18 },
    saveButton: { backgroundColor: theme.primaryGlow, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    savedButtonLocked: { backgroundColor: '#1B4332', borderColor: theme.primaryGlow, opacity: 0.9 },
    saveButtonText: { color: theme.background, fontWeight: 'bold', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', padding: 24, backgroundColor: '#121212', borderRadius: 16, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 },
    modalTitle: { color: theme.textMain, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    modalSubtitle: { color: theme.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 20 },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    modalCancelBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', marginRight: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.glassBorder },
    modalCancelText: { color: theme.textMuted, fontWeight: 'bold', fontSize: 16 },
    modalConfirmBtn: { flex: 1, backgroundColor: theme.primaryGlow, paddingVertical: 16, alignItems: 'center', borderRadius: 12, marginLeft: 10 }
});