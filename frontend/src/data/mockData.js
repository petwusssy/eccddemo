/**
 * ECCD CARE — Philippine CSWDO Realistic Synthetic Data
 * City Social Welfare and Development Office (CSWDO)
 * Early Childhood Care and Development Information System
 */

export const currentUser = {
  name: "Ma. Elena D. Santos, RSW",
  role: "CSWDO Senior Social Worker / ECCD Focal",
  agency: "City Social Welfare & Development Office",
  lgu: "City of San Fernando, Pampanga",
  region: "Region III - Central Luzon",
  avatarInitials: "ES",
  email: "elena.santos@cswdo.gov.ph",
  activeSchoolYear: "SY 2026–2027",
};

import { SAN_FERNANDO_BARANGAYS } from './sanFernandoBarangays';

export const barangaysList = SAN_FERNANDO_BARANGAYS.map((name, index) => ({
  id: `BRGY-${String(index + 1).padStart(2, '0')}`,
  name,
  cdcs: 0,
  childrenCount: 0,
  workers: 0,
}));

export const dayCareCentersList = [];

export const mockChildren = [];

export const kpiMetrics = [
  {
    id: "total-children",
    label: "Children Registered (0–4)",
    value: "0",
    delta: "Awaiting child mapping",
    trend: "up",
    icon: "Users",
    color: "primary",
  },
  {
    id: "enrolled-cdcs",
    label: "Enrolled in Day Care / CDCs",
    value: "0",
    delta: "0% enrollment rate",
    trend: "up",
    icon: "School",
    color: "accent",
  },
  {
    id: "assessments-due",
    label: "ECCD Assessments Due",
    value: "0",
    delta: "No pending assessments",
    trend: "warning",
    icon: "CalendarClock",
    color: "warning",
  },
  {
    id: "urgent-intervention",
    label: "Urgent Support / Nutrition Flag",
    value: "0",
    delta: "No active cases",
    trend: "urgent",
    icon: "AlertOctagon",
    color: "danger",
  },
];

export const mockNotifications = [];

export const mockAuditLogs = [];
