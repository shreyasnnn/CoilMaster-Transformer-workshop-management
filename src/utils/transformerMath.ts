// src/utils/transformerMath.ts

export interface TransformerSpecs {
    vIn: number;
    vOut: number;
    amps: number;
    bobbinLength: number; // Added this so the user can select 1", 1.5", 2", etc.
}

export interface CalculationResult {
    va: number;
    coreAreaSqInch: number;
    bobbinWidth: number;
    tpv: number;
    primary: { turns: number; amps: number; swg: number; lengthMeters: number; weightKg: number };
    secondary: { turns: number; amps: number; swg: number; lengthMeters: number; weightKg: number };
}

// MOCK TABLE: Now includes weight in grams per meter (approximate values for logic testing)
// Your Uncle's Verified AWG/SWG Table (500 cmil/A rating)
const WIRE_TABLE = [
    { swg: 10, maxAmps: 32.8, gramPerMeter: 74.1 },
    { swg: 11, maxAmps: 26.9, gramPerMeter: 60.8 },
    { swg: 12, maxAmps: 21.6, gramPerMeter: 48.9 },
    { swg: 13, maxAmps: 16.9, gramPerMeter: 38.3 },
    { swg: 14, maxAmps: 12.8, gramPerMeter: 28.9 },
    { swg: 15, maxAmps: 10.4, gramPerMeter: 23.4 },
    { swg: 16, maxAmps: 8.19, gramPerMeter: 18.5 },
    { swg: 17, maxAmps: 6.27, gramPerMeter: 14.2 },
    { swg: 18, maxAmps: 4.61, gramPerMeter: 10.4 },
    { swg: 19, maxAmps: 3.20, gramPerMeter: 7.23 },
    { swg: 20, maxAmps: 2.59, gramPerMeter: 5.86 },
    { swg: 21, maxAmps: 2.05, gramPerMeter: 4.63 },
    { swg: 22, maxAmps: 1.57, gramPerMeter: 3.54 },
    { swg: 23, maxAmps: 1.15, gramPerMeter: 2.60 },
    { swg: 24, maxAmps: 0.968, gramPerMeter: 2.19 },
    { swg: 25, maxAmps: 0.800, gramPerMeter: 1.81 },
    { swg: 26, maxAmps: 0.648, gramPerMeter: 1.46 },
    { swg: 27, maxAmps: 0.538, gramPerMeter: 1.22 },
    { swg: 28, maxAmps: 0.438, gramPerMeter: 0.990 },
    { swg: 29, maxAmps: 0.370, gramPerMeter: 0.836 },
    { swg: 30, maxAmps: 0.308, gramPerMeter: 0.695 },
];

const findOptimalSWG = (targetAmps: number) => {
    for (let i = WIRE_TABLE.length - 1; i >= 0; i--) {
        if (WIRE_TABLE[i].maxAmps >= targetAmps) return WIRE_TABLE[i];
    }
    return WIRE_TABLE[0];
};

export const calculateEICore = (specs: TransformerSpecs): CalculationResult => {
    const { vIn, vOut, amps, bobbinLength } = specs;

    // Step 1: Power (VA)
    const va = vOut * amps;

    // Step 2: Core Area (Convert sq cm to sq inches)
    const coreAreaCm = 1.15 * Math.sqrt(va);
    const rawCoreAreaInch = coreAreaCm / 6.4516;

    // Calculate Width and Round off (Real-world bobbin sizing)
    const exactWidth = rawCoreAreaInch / bobbinLength;
    const bobbinWidth = Math.round(exactWidth); // Rounds 2.06 to 2"
    const actualCoreAreaInch = bobbinLength * bobbinWidth; // 1.5 * 2 = 3.0 sq inches

    // Step 3: TPV and Turns
    const tpv = Number((7 / actualCoreAreaInch).toFixed(2));

    const primaryTurns = Math.round(vIn * tpv);
    const secondaryTurns = Math.round((vOut * tpv) * 1.05);

    // Step 4: Current & SWG Selection
    const primaryAmps = Number((va / vIn).toFixed(2)); // e.g., 300 / 220 = 1.36A
    const secondaryAmps = amps; // 10A

    const primaryWire = findOptimalSWG(primaryAmps); // Looks up ~1.5A
    const secondaryWire = findOptimalSWG(secondaryAmps); // Looks up 10A

    // Step 5: Wire Length in Meters
    const turnPerimeterInches = (bobbinLength * 2) + (bobbinWidth * 2); // 1.5*2 + 2*2 = 7 inches
    const inchesToMeters = 0.0254;

    const priLengthMeters = Math.ceil((primaryTurns * turnPerimeterInches) * inchesToMeters);
    const secLengthMeters = Math.ceil((secondaryTurns * turnPerimeterInches) * inchesToMeters);

    // Step 6: Wire Weight in KG (length * grams per meter / 1000)
    const priWeightKg = Number(((priLengthMeters * primaryWire.gramPerMeter) / 1000).toFixed(3));
    const secWeightKg = Number(((secLengthMeters * secondaryWire.gramPerMeter) / 1000).toFixed(3));

    return {
        va,
        coreAreaSqInch: actualCoreAreaInch,
        bobbinWidth,
        tpv,
        primary: {
            turns: primaryTurns,
            amps: primaryAmps,
            swg: primaryWire.swg,
            lengthMeters: priLengthMeters,
            weightKg: priWeightKg
        },
        secondary: {
            turns: secondaryTurns,
            amps: secondaryAmps,
            swg: secondaryWire.swg,
            lengthMeters: secLengthMeters,
            weightKg: secWeightKg
        }
    };
};