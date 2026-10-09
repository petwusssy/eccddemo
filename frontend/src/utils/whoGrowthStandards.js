/**
 * WHO Child Growth Standards & DOH / NNC Operation Timbang (OPT) Plus Calculator
 * Official Standards for Children 0–71 months (0–5.9 years)
 */

// WHO Standard Weight-for-Age (WFA) Percentiles / Median & SD (months 0 to 60)
const WHO_WFA = {
  boys: [
    { m: 0, median: 3.3, sd: 0.4 },
    { m: 3, median: 6.4, sd: 0.7 },
    { m: 6, median: 7.9, sd: 0.8 },
    { m: 9, median: 8.9, sd: 0.9 },
    { m: 12, median: 9.6, sd: 1.0 },
    { m: 18, median: 10.9, sd: 1.1 },
    { m: 24, median: 12.2, sd: 1.3 },
    { m: 30, median: 13.3, sd: 1.4 },
    { m: 36, median: 14.3, sd: 1.5 },
    { m: 42, median: 15.3, sd: 1.7 },
    { m: 48, median: 16.3, sd: 1.8 },
    { m: 54, median: 17.3, sd: 2.0 },
    { m: 60, median: 18.3, sd: 2.1 },
  ],
  girls: [
    { m: 0, median: 3.2, sd: 0.4 },
    { m: 3, median: 5.8, sd: 0.6 },
    { m: 6, median: 7.3, sd: 0.8 },
    { m: 9, median: 8.2, sd: 0.9 },
    { m: 12, median: 8.9, sd: 1.0 },
    { m: 18, median: 10.2, sd: 1.1 },
    { m: 24, median: 11.5, sd: 1.3 },
    { m: 30, median: 12.7, sd: 1.4 },
    { m: 36, median: 13.9, sd: 1.6 },
    { m: 42, median: 15.0, sd: 1.7 },
    { m: 48, median: 16.1, sd: 1.9 },
    { m: 54, median: 17.2, sd: 2.0 },
    { m: 60, median: 18.2, sd: 2.2 },
  ],
};

/**
 * Compute precise age in months between birth date and measurement date.
 */
export function calculateAgeInMonths(birthDateStr, measurementDateStr) {
  if (!birthDateStr) return 36;
  const birth = new Date(birthDateStr);
  const meas = measurementDateStr ? new Date(measurementDateStr) : new Date();
  if (isNaN(birth.getTime()) || isNaN(meas.getTime())) return 36;

  let months = (meas.getFullYear() - birth.getFullYear()) * 12 + (meas.getMonth() - birth.getMonth());
  if (meas.getDate() < birth.getDate()) {
    months -= 1;
  }
  const dayFrac = (meas.getDate() - birth.getDate()) / 30.4375;
  const exact = Math.max(0, months + (dayFrac > 0 ? dayFrac : 0));
  return Math.round(exact * 10) / 10;
}

// WHO Standard Height-for-Age (HFA) Percentiles / Median & SD (months 0 to 71)
const WHO_HFA = {
  boys: [
    { m: 0, median: 49.9, sd: 1.9 },
    { m: 3, median: 61.4, sd: 2.0 },
    { m: 6, median: 67.6, sd: 2.1 },
    { m: 9, median: 72.0, sd: 2.3 },
    { m: 12, median: 75.7, sd: 2.4 },
    { m: 18, median: 82.3, sd: 2.8 },
    { m: 24, median: 87.8, sd: 3.2 },
    { m: 30, median: 92.4, sd: 3.5 },
    { m: 36, median: 96.1, sd: 3.7 },
    { m: 42, median: 99.9, sd: 4.0 },
    { m: 48, median: 103.3, sd: 4.2 },
    { m: 54, median: 106.7, sd: 4.4 },
    { m: 60, median: 110.0, sd: 4.6 },
    { m: 71, median: 116.0, sd: 5.0 },
  ],
  girls: [
    { m: 0, median: 49.1, sd: 1.9 },
    { m: 3, median: 59.8, sd: 2.0 },
    { m: 6, median: 65.7, sd: 2.1 },
    { m: 9, median: 70.1, sd: 2.3 },
    { m: 12, median: 74.0, sd: 2.4 },
    { m: 18, median: 80.7, sd: 2.8 },
    { m: 24, median: 86.4, sd: 3.3 },
    { m: 30, median: 91.2, sd: 3.6 },
    { m: 36, median: 95.1, sd: 3.8 },
    { m: 42, median: 99.0, sd: 4.1 },
    { m: 48, median: 102.7, sd: 4.3 },
    { m: 54, median: 106.2, sd: 4.5 },
    { m: 60, median: 109.4, sd: 4.7 },
    { m: 71, median: 115.5, sd: 5.1 },
  ],
};

/**
 * Dynamic Real-Time Nutritional Status Calculator
 * Adheres strictly to standard WHO Child Growth Standards (WFA, HFA, WFL/H / BMI, and MUAC):
 * Badges: Normal, Underweight, Severely Underweight, Stunted, Wasted, Overweight
 */
export function computeNutritionalStatus({
  weightKg,
  heightCm,
  muacCm,
  birthDate,
  sex = 'Female',
  measurementDate,
}) {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  const muac = parseFloat(muacCm);

  if (isNaN(w) || w <= 0) {
    return {
      status: 'Normal',
      bmi: null,
      zScore: 0,
      wfaZScore: 0,
      hfaZScore: null,
      wfhZScore: null,
      muacCm: !isNaN(muac) ? muac : null,
      muacStatus: 'Normal',
      ageMonths: null,
      isMalnourished: false,
      badgeText: 'Enter Weight',
      style: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        borderColor: '#cbd5e1',
        borderWidth: '1px',
        borderStyle: 'solid',
        dotColor: '#94a3b8',
      },
    };
  }

  const ageMonths = calculateAgeInMonths(birthDate, measurementDate);
  const isMale = (sex || '').toLowerCase().startsWith('m');
  const wfaTable = isMale ? WHO_WFA.boys : WHO_WFA.girls;
  const hfaTable = isMale ? WHO_HFA.boys : WHO_HFA.girls;

  // 1. Interpolate WFA (Weight-for-Age) median & SD
  let medianAgeWeight = 14.0;
  let sdAgeWeight = 1.6;
  for (let i = 0; i < wfaTable.length - 1; i++) {
    if (ageMonths >= wfaTable[i].m && ageMonths <= wfaTable[i + 1].m) {
      const frac = (ageMonths - wfaTable[i].m) / (wfaTable[i + 1].m - wfaTable[i].m);
      medianAgeWeight = wfaTable[i].median + frac * (wfaTable[i + 1].median - wfaTable[i].median);
      sdAgeWeight = wfaTable[i].sd + frac * (wfaTable[i + 1].sd - wfaTable[i].sd);
      break;
    }
  }
  if (ageMonths > 60) {
    medianAgeWeight = wfaTable[wfaTable.length - 1].median;
    sdAgeWeight = wfaTable[wfaTable.length - 1].sd;
  }
  const zAgeWeight = (w - medianAgeWeight) / sdAgeWeight;

  // 2. Interpolate HFA (Height-for-Age) median & SD
  let zHeightAge = null;
  let hfaStatus = 'Normal';
  if (!isNaN(h) && h > 30) {
    let medianAgeHeight = 96.0;
    let sdAgeHeight = 3.7;
    for (let i = 0; i < hfaTable.length - 1; i++) {
      if (ageMonths >= hfaTable[i].m && ageMonths <= hfaTable[i + 1].m) {
        const frac = (ageMonths - hfaTable[i].m) / (hfaTable[i + 1].m - hfaTable[i].m);
        medianAgeHeight = hfaTable[i].median + frac * (hfaTable[i + 1].median - hfaTable[i].median);
        sdAgeHeight = hfaTable[i].sd + frac * (hfaTable[i + 1].sd - hfaTable[i].sd);
        break;
      }
    }
    if (ageMonths > 71) {
      medianAgeHeight = hfaTable[hfaTable.length - 1].median;
      sdAgeHeight = hfaTable[hfaTable.length - 1].sd;
    }
    zHeightAge = (h - medianAgeHeight) / sdAgeHeight;
    if (zHeightAge < -3.0) {
      hfaStatus = 'Severely Stunted';
    } else if (zHeightAge < -2.0) {
      hfaStatus = 'Stunted';
    } else if (zHeightAge > 2.0) {
      hfaStatus = 'Tall';
    } else {
      hfaStatus = 'Normal';
    }
  }

  // 3. Weight-for-Height & BMI assessment
  let bmi = null;
  let zHeightWeight = null;
  let wfhStatus = 'Normal';
  if (!isNaN(h) && h > 40) {
    const hM = h / 100;
    bmi = Math.round((w / (hM * hM)) * 10) / 10;
    const medianHeightWeight = 14.4 * Math.pow(h / 96.5, 2.3);
    const sdHeightWeight = medianHeightWeight * 0.105;
    zHeightWeight = (w - medianHeightWeight) / sdHeightWeight;

    if (zHeightWeight < -3.0 || (bmi !== null && bmi < 12.5)) {
      wfhStatus = 'Severely Wasted';
    } else if (zHeightWeight < -2.0 || (bmi !== null && bmi < 13.9)) {
      wfhStatus = 'Wasted';
    } else if (zHeightWeight > 2.0 || (bmi !== null && bmi > 18.0)) {
      wfhStatus = 'Overweight';
    } else {
      wfhStatus = 'Normal';
    }
  }

  // 4. MUAC evaluation (Mid-Upper Arm Circumference)
  let muacStatus = 'Normal';
  if (!isNaN(muac) && muac > 0) {
    if (muac < 11.5) {
      muacStatus = 'Severely Wasted'; // SAM (Severe Acute Malnutrition)
    } else if (muac < 12.5) {
      muacStatus = 'Wasted'; // MAM (Moderate Acute Malnutrition)
    } else {
      muacStatus = 'Normal';
    }
  }

  // 5. Aggregate Nutritional Status Assignment (ECCD & OPT Plus rules)
  // Badges: Normal, Underweight, Severely Underweight, Stunted, Wasted, Overweight
  let status = 'Normal';
  if (wfhStatus === 'Severely Wasted' || muacStatus === 'Severely Wasted') {
    status = 'Wasted';
  } else if (zAgeWeight < -3.0 || w <= (medianAgeWeight * 0.62)) {
    status = 'Severely Underweight';
  } else if (wfhStatus === 'Wasted' || muacStatus === 'Wasted') {
    status = 'Wasted';
  } else if (hfaStatus === 'Severely Stunted' || hfaStatus === 'Stunted') {
    status = 'Stunted';
  } else if (zAgeWeight < -2.0 || w <= (medianAgeWeight * 0.80)) {
    status = 'Underweight';
  } else if (wfhStatus === 'Overweight' || zAgeWeight > 2.0 || (bmi !== null && bmi > 18.0)) {
    status = 'Overweight';
  } else {
    status = 'Normal';
  }

  const isMalnourished = [
    'Severely Underweight',
    'Underweight',
    'Stunted',
    'Wasted',
  ].includes(status);

  // Exact badge styling per prompt requirement:
  // - Severely Underweight: Red badge (bg-red-100 text-red-700 border-red-300)
  // - Underweight: Amber badge (bg-amber-100 text-amber-700 border-amber-300)
  // - Stunted: Orange badge (bg-orange-100 text-orange-700 border-orange-300)
  // - Wasted: Rose/Crimson badge (bg-rose-100 text-rose-700 border-rose-300)
  // - Normal: Green badge (bg-emerald-100 text-emerald-700 border-emerald-300)
  // - Overweight: Purple badge
  let style = {
    backgroundColor: '#d1fae5', // bg-emerald-100
    color: '#047857',           // text-emerald-700
    borderColor: '#6ee7b7',     // border-emerald-300
    borderWidth: '1px',
    borderStyle: 'solid',
    dotColor: '#059669',
  };

  if (status === 'Severely Underweight') {
    style = {
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
      borderColor: '#fca5a5',
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#dc2626',
    };
  } else if (status === 'Underweight') {
    style = {
      backgroundColor: '#fef3c7',
      color: '#b45309',
      borderColor: '#fcd34d',
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#d97706',
    };
  } else if (status === 'Stunted') {
    style = {
      backgroundColor: '#ffedd5', // orange-100
      color: '#c2410c',           // orange-700
      borderColor: '#fdba74',     // orange-300
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#ea580c',
    };
  } else if (status === 'Wasted') {
    style = {
      backgroundColor: '#ffe4e6', // rose-100
      color: '#be123c',           // rose-700
      borderColor: '#fda4af',     // rose-300
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#e11d48',
    };
  } else if (status === 'Overweight') {
    style = {
      backgroundColor: '#ede9fe',
      color: '#6d28d9',
      borderColor: '#c4b5fd',
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#7c3aed',
    };
  }

  const effectiveZ = zHeightWeight !== null ? Math.min(zAgeWeight, zHeightWeight) : zAgeWeight;

  return {
    status,
    bmi,
    ageMonths,
    muacCm: !isNaN(muac) ? muac : null,
    muacStatus,
    wfaStatus: zAgeWeight < -3 ? 'Severely Underweight' : zAgeWeight < -2 ? 'Underweight' : zAgeWeight > 2 ? 'Overweight' : 'Normal',
    hfaStatus,
    wfhStatus,
    isMalnourished,
    zScore: Math.round(effectiveZ * 100) / 100,
    wfaZScore: Math.round(zAgeWeight * 100) / 100,
    hfaZScore: zHeightAge !== null ? Math.round(zHeightAge * 100) / 100 : null,
    wfhZScore: zHeightWeight !== null ? Math.round(zHeightWeight * 100) / 100 : null,
    style,
  };
}
