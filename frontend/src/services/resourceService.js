/**
 * ECCD CARE — Resources & Official Documents Service
 * City Social Welfare & Development Office (CSWDO)
 *
 * Official Forms & Checklist Resources Catalog
 * IMPORTANT:
 * - Do not fabricate the contents of the official documents.
 * - Do not replace the actual official forms with invented forms.
 * - The resources page is a reference/integration area while operational workflow uses structured data.
 * - For every item: Official Form, Status: "Pending Integration", Button: [CONNECT OFFICIAL DOCUMENT]
 *
 * API Contract:
 * GET /api/resources
 * GET /api/resources/:id
 */

export const INITIAL_RESOURCES = [
  // SECTION 1: COMMUNITY MAPPING & REGISTRATION (10 Forms)
  {
    id: 'RES-MAP-REG',
    name: 'Registration Form',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-REG-00',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN DIGITAL FORM',
    description: 'Official CSWDO Household Child Intake and Community Registration Form.',
    authority: 'City Social Welfare and Development Office / DSWD',
    type: 'Intake & Registration',
    supportedFormats: 'Interactive Digital Form / Connected to Central Database',
  },
  {
    id: 'RES-MAP-FORM-1',
    name: 'Form 1 – Home Profile',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-1',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN DIGITAL FORM',
    description: 'DSWD / ECCD Council Form 1: Family and Household Socio-demographic Profile.',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Household Profile',
    supportedFormats: 'Interactive Digital Form / Connected to Central Database',
  },
  {
    id: 'RES-MAP-FORM-2',
    name: "Form 2 – Children's Profile",
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-2',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN DIGITAL FORM',
    description: 'DSWD / ECCD Council Form 2: Individual Child Demographic and Health Tracking Profile (Ages 0–4).',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Child Profile',
    supportedFormats: 'Interactive Digital Form / Connected to Central Database',
  },
  {
    id: 'RES-MAP-FORM-3',
    name: 'Form 3 – Community Profile',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-3',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN DIGITAL FORM',
    description: 'DSWD / ECCD Council Form 3: Barangay ECCD Spot Map and Community Resource Assessment.',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Community Spot Map',
    supportedFormats: 'Interactive Digital Form / Connected to Central Database',
  },
  {
    id: 'RES-MAP-FORM-4',
    name: 'Form 4 – Consolidated Family Profile',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-4',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN CONSOLIDATED REPORT',
    description: 'DSWD / ECCD Council Form 4: Consolidated Barangay Family Profiles and 4Ps Beneficiary Tagging.',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Consolidated Family Registry',
    supportedFormats: 'Interactive Digital Report / Exportable & Printable',
  },
  {
    id: 'RES-MAP-FORM-5',
    name: "Form 5 – Consolidated Children's Profile",
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-5',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'GENERATE FORM 5',
    description: "ECCD Council Form 5 (June 2015): Consolidated LGU Child Demographic, Anthropometric, Health, and Logistics Profile.",
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Consolidated Child Registry',
    supportedFormats: 'Interactive Digital Report / Exportable & Printable',
  },
  {
    id: 'RES-MAP-FORM-6',
    name: 'Form 6 – Day Care Worker Profile',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-6',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN FORM 6 PROFILE',
    description: 'ECCD Council Form 6 (April 2014): Child Development Worker Personal Info, Education, Compensation, and Working Conditions.',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Worker Accreditation Profile',
    supportedFormats: 'Interactive Digital Form / Connected to Central Database',
  },
  {
    id: 'RES-MAP-FORM-7',
    name: 'Form 7 – Day Care Center Profile',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-7',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN FORM 7 PROFILE',
    description: 'ECCD Council Form 7 (April 2014): Child Development Center Facility, Services, Equipment, and Learning Materials Audit.',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Center Accreditation Profile',
    supportedFormats: 'Interactive Digital Form / Connected to Central Database',
  },
  {
    id: 'RES-MAP-FORM-8',
    name: 'Form 8 – Consolidated Child Development Worker Profile',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-8',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'GENERATE FORM 8',
    description: 'ECCD Council Form 8 (April 2014): LGU Consolidated Masterlist and Statistical Summary of Child Development Workers.',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Consolidated Worker Masterlist',
    supportedFormats: 'Interactive Digital Report / Exportable & Printable',
  },
  {
    id: 'RES-MAP-FORM-9',
    name: 'Form 9 – Consolidated Child Development Center Profile',
    section: 'COMMUNITY MAPPING & REGISTRATION',
    officialForm: 'Official Form',
    code: 'ECCD-FORM-9',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'GENERATE FORM 9',
    description: 'ECCD Council Form 9 (April 2014): LGU Consolidated Masterlist and Accreditation Profile of Public Child Development Centers.',
    authority: 'DSWD / Early Childhood Care and Development Council',
    type: 'Consolidated Center Masterlist',
    supportedFormats: 'Interactive Digital Report / Exportable & Printable',
  },

  // SECTION 2: ECCD CHECKLIST (4 Items)
  {
    id: 'RES-CHK-GUIDE',
    name: 'How to Use the ECCD Checklist',
    section: 'ECCD CHECKLIST',
    officialForm: 'Official Form',
    code: 'ECCD-CHK-00-GUIDE',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN MANUAL',
    description: 'National ECCD Council Administration Manual: Standardized Guidelines for Administering the ECCD Checklist.',
    authority: 'Early Childhood Care and Development Council',
    type: 'Official Administration Manual',
    supportedFormats: 'Interactive Digital Reference / Official Administration Manual',
  },
  {
    id: 'RES-CHK-SCALES',
    name: 'ECCD Checklist / Scaled Scores and Standard Scores',
    section: 'ECCD CHECKLIST',
    officialForm: 'Official Form',
    code: 'ECCD-CHK-SCALES',
    status: 'Official Reference Available',
    isIntegrated: true,
    buttonLabel: 'VIEW SCALED TABLES',
    description: 'Official Normative Scaled Score and Standard Score Conversion Tables for the 7 Developmental Domains.',
    authority: 'Early Childhood Care and Development Council',
    type: 'Normative Score Table',
    supportedFormats: 'PDF / Official Scaled Reference Table / JSON Formula Hook',
  },
  {
    id: 'RES-CHK-REC-1',
    name: "ECCD Checklist Child's Record 1",
    section: 'ECCD CHECKLIST',
    officialForm: 'Official Form',
    code: 'ECCD-CHK-REC-1',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN RECORD 1',
    description: "Official Child's Record 1 (Ages 0 to 3.0 years): Baseline & Periodic Developmental Assessment Protocol across 7 Domains.",
    authority: 'Early Childhood Care and Development Council',
    type: "Official Child Assessment Record",
    supportedFormats: 'Interactive Digital Assessment / Electronic Questionnaire',
  },
  {
    id: 'RES-CHK-REC-2',
    name: "ECCD Checklist Child's Record 2",
    section: 'ECCD CHECKLIST',
    officialForm: 'Official Form',
    code: 'ECCD-CHK-REC-2',
    status: 'Integrated & Active',
    isIntegrated: true,
    buttonLabel: 'OPEN RECORD 2',
    description: "Official Child's Record 2 (Ages 3.1 to 5.11 years): Preschool Developmental Assessment Protocol across 7 Domains.",
    authority: 'Early Childhood Care and Development Council',
    type: "Official Progress Evaluation Record",
    supportedFormats: 'Interactive Digital Assessment / Electronic Questionnaire',
  },
];

export const resourceService = {
  /**
   * GET /api/resources
   */
  async getResources(filters = {}) {
    const params = new URLSearchParams();
    if (filters.section && filters.section !== 'all') params.append('section', filters.section);
    if (filters.search) params.append('search', filters.search);

    try {
      const res = await fetch(`/api/resources?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data.resources;
      }
    } catch {
      // Local fallback
    }

    let list = [...INITIAL_RESOURCES];
    if (filters.section && filters.section !== 'all') {
      list = list.filter(r => r.section === filters.section);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * GET /api/resources/:id
   */
  async getResourceById(id) {
    try {
      const res = await fetch(`/api/resources/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Local fallback
    }

    return (
      INITIAL_RESOURCES.find(
        r => r.id === id || r.code.toLowerCase() === id.toLowerCase()
      ) || null
    );
  },
};

export default resourceService;
