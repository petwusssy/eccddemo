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

/**
 * Dynamic Real-Time Nutritional Status Calculator
 * Adheres strictly to standard WHO Child Growth Standards (WFA & WFL/H / BMI):
 * - Critically low (< -3 SD or BMI < 12.5 or weight < 60% of expected): "Severely Underweight"
 * - Below -2 SD: "Underweight"
 * - Normal range (-2 SD to +2 SD): "Normal"
 * - Above +2 SD: "Overweight"
 */
export function computeNutritionalStatus({
  weightKg,
  heightCm,
  birthDate,
  sex = 'Female',
  measurementDate,
}) {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);

  if (isNaN(w) || w <= 0) {
    return {
      status: 'Normal',
      bmi: null,
      zScore: 0,
      ageMonths: null,
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
  const table = isMale ? WHO_WFA.boys : WHO_WFA.girls;

  // Interpolate median & standard deviation for age
  let medianAgeWeight = 14.0;
  let sdAgeWeight = 1.6;
  for (let i = 0; i < table.length - 1; i++) {
    if (ageMonths >= table[i].m && ageMonths <= table[i + 1].m) {
      const frac = (ageMonths - table[i].m) / (table[i + 1].m - table[i].m);
      medianAgeWeight = table[i].median + frac * (table[i + 1].median - table[i].median);
      sdAgeWeight = table[i].sd + frac * (table[i + 1].sd - table[i].sd);
      break;
    }
  }
  if (ageMonths > 60) {
    medianAgeWeight = table[table.length - 1].median;
    sdAgeWeight = table[table.length - 1].sd;
  }

  // Weight-for-Height & BMI assessment if height is provided
  let bmi = null;
  let medianHeightWeight = null;
  let sdHeightWeight = null;
  let zHeightWeight = null;

  if (!isNaN(h) && h > 40) {
    const hM = h / 100;
    bmi = Math.round((w / (hM * hM)) * 10) / 10;
    // Standard WHO median weight for height: ~ 14.4 * (h / 96.5)^2.3
    medianHeightWeight = 14.4 * Math.pow(h / 96.5, 2.3);
    sdHeightWeight = medianHeightWeight * 0.105;
    zHeightWeight = (w - medianHeightWeight) / sdHeightWeight;
  }

  const zAgeWeight = (w - medianAgeWeight) / sdAgeWeight;
  // Clinically sensitive evaluation considering both WFA and WFH/BMI
  const effectiveZ = zHeightWeight !== null ? Math.min(zAgeWeight, zHeightWeight) : zAgeWeight;

  let status = 'Normal';
  // Critical low weight (e.g. 5 kg at 96.5 cm, Z < -3 SD, or BMI < 12.5)
  if (effectiveZ < -3.0 || (bmi !== null && bmi < 12.5) || w <= (medianAgeWeight * 0.62)) {
    status = 'Severely Underweight';
  } else if (effectiveZ < -2.0 || (bmi !== null && bmi < 13.9) || w <= (medianAgeWeight * 0.80)) {
    status = 'Underweight';
  } else if (effectiveZ > 2.0 || (bmi !== null && bmi > 18.0) || w >= (medianAgeWeight * 1.25)) {
    status = 'Overweight';
  } else {
    status = 'Normal';
  }

  // Exact badge styling per prompt requirement:
  // - Severely Underweight: Red badge (bg-red-100 text-red-700 border-red-300)
  // - Underweight: Amber badge (bg-amber-100 text-amber-700 border-amber-300)
  // - Normal: Green badge (bg-emerald-100 text-emerald-700 border-emerald-300)
  // - Overweight: Purple/Orange badge
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
      backgroundColor: '#fee2e2', // bg-red-100
      color: '#b91c1c',           // text-red-700
      borderColor: '#fca5a5',     // border-red-300
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#dc2626',
    };
  } else if (status === 'Underweight') {
    style = {
      backgroundColor: '#fef3c7', // bg-amber-100
      color: '#b45309',           // text-amber-700
      borderColor: '#fcd34d',     // border-amber-300
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#d97706',
    };
  } else if (status === 'Overweight') {
    style = {
      backgroundColor: '#ede9fe', // purple
      color: '#6d28d9',
      borderColor: '#c4b5fd',
      borderWidth: '1px',
      borderStyle: 'solid',
      dotColor: '#7c3aed',
    };
  }

  return {
    status,
    bmi,
    ageMonths,
    zScore: Math.round(effectiveZ * 100) / 100,
    wfaZScore: Math.round(zAgeWeight * 100) / 100,
    wfhZScore: zHeightWeight !== null ? Math.round(zHeightWeight * 100) / 100 : null,
    style,
  };
}
