<?php

namespace App\Services;

class ResourceService
{
    /**
     * Official ECCD forms and checklist resources master catalog.
     * Core Rule: Do not fabricate contents of official documents.
     * Do not replace actual official forms with invented forms.
     * Status for every item: "Pending Integration"
     * Button for every item: [CONNECT OFFICIAL DOCUMENT]
     */
    protected static array $resources = [
        // ==========================================
        // SECTION 1: COMMUNITY MAPPING & REGISTRATION
        // ==========================================
        [
            'id' => 'RES-MAP-REG',
            'name' => 'Registration Form',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-REG-00',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'Official CSWDO Household Child Intake and Community Registration Form.',
            'authority' => 'City Social Welfare and Development Office / DSWD',
            'type' => 'Intake & Registration',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-1',
            'name' => 'Form 1 – Home Profile',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-1',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 1: Family and Household Socio-demographic Profile.',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Household Profile',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-2',
            'name' => "Form 2 – Children's Profile",
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-2',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 2: Individual Child Demographic and Health Tracking Profile (Ages 0–4).',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Child Profile',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-3',
            'name' => 'Form 3 – Community Profile',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-3',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 3: Barangay ECCD Spot Map and Community Resource Assessment.',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Community Spot Map',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-4',
            'name' => 'Form 4 – Consolidated Family Profile',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-4',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 4: Consolidated Barangay Family Profiles and 4Ps Beneficiary Tagging.',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Consolidated Family Registry',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-5',
            'name' => "Form 5 – Consolidated Children's Profile",
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-5',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => "DSWD / ECCD Council Form 5: Consolidated LGU Child Demographic Masterlist and PhilSys Registry.",
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Consolidated Child Registry',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-6',
            'name' => 'Form 6 – Day Care Worker Profile',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-6',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 6: Child Development Worker / Day Care Worker Accreditation and Qualification Record.',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Worker Accreditation Profile',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-7',
            'name' => 'Form 7 – Day Care Center Profile',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-7',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 7: Child Development Center Facility Accreditation and Learning Environment Audit.',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Center Accreditation Profile',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-8',
            'name' => 'Form 8 – Consolidated Child Development Worker Profile',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-8',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 8: LGU Consolidated Masterlist of Accredited Child Development Workers and Service Providers.',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Consolidated Worker Masterlist',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],
        [
            'id' => 'RES-MAP-FORM-9',
            'name' => 'Form 9 – Consolidated Child Development Center Profile',
            'section' => 'COMMUNITY MAPPING & REGISTRATION',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-FORM-9',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'DSWD / ECCD Council Form 9: LGU Consolidated Masterlist of Public Child Development Centers and Facilities.',
            'authority' => 'DSWD / Early Childhood Care and Development Council',
            'type' => 'Consolidated Center Masterlist',
            'supportedFormats' => 'PDF / Official Scanned Form / DepEd Encrypted XML',
        ],

        // ==========================================
        // SECTION 2: ECCD CHECKLIST
        // ==========================================
        [
            'id' => 'RES-CHK-GUIDE',
            'name' => 'How to Use the ECCD Checklist',
            'section' => 'ECCD CHECKLIST',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-CHK-00-GUIDE',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'National ECCD Council Administration Manual: Standardized Guidelines for Administering the ECCD Checklist.',
            'authority' => 'Early Childhood Care and Development Council',
            'type' => 'Official Administration Manual',
            'supportedFormats' => 'PDF / Official Manual / Document Package',
        ],
        [
            'id' => 'RES-CHK-SCALES',
            'name' => 'ECCD Checklist / Scaled Scores and Standard Scores',
            'section' => 'ECCD CHECKLIST',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-CHK-SCALES',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => 'Official Normative Scaled Score and Standard Score Conversion Tables for the 7 Developmental Domains.',
            'authority' => 'Early Childhood Care and Development Council',
            'type' => 'Normative Score Table',
            'supportedFormats' => 'PDF / Official Scaled Reference Table / JSON Formula Hook',
        ],
        [
            'id' => 'RES-CHK-REC-1',
            'name' => "ECCD Checklist Child's Record 1",
            'section' => 'ECCD CHECKLIST',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-CHK-REC-1',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => "Official Child's Record 1: Baseline Assessment Protocol (Administered at start of school year).",
            'authority' => 'Early Childhood Care and Development Council',
            'type' => "Official Child Assessment Record",
            'supportedFormats' => 'PDF / Official Evaluation Booklet / Electronic Questionnaire',
        ],
        [
            'id' => 'RES-CHK-REC-2',
            'name' => "ECCD Checklist Child's Record 2",
            'section' => 'ECCD CHECKLIST',
            'officialForm' => 'Official Form',
            'code' => 'ECCD-CHK-REC-2',
            'status' => 'Pending Integration',
            'buttonLabel' => 'CONNECT OFFICIAL DOCUMENT',
            'description' => "Official Child's Record 2: Mid-year & End-of-year Progress Evaluation Protocol.",
            'authority' => 'Early Childhood Care and Development Council',
            'type' => "Official Progress Evaluation Record",
            'supportedFormats' => 'PDF / Official Evaluation Booklet / Electronic Questionnaire',
        ],
    ];

    /**
     * GET /api/resources
     */
    public function getResources(array $filters = []): array
    {
        $all = self::$resources;

        if (!empty($filters['section']) && $filters['section'] !== 'all') {
            $all = array_filter($all, fn($r) => $r['section'] === $filters['section']);
        }

        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $all = array_filter($all, function ($r) use ($q) {
                return str_contains(strtolower($r['name']), $q)
                    || str_contains(strtolower($r['code']), $q)
                    || str_contains(strtolower($r['description']), $q);
            });
        }

        return [
            'total' => count($all),
            'resources' => array_values($all),
            'sections' => [
                'COMMUNITY MAPPING & REGISTRATION' => count(array_filter(self::$resources, fn($r) => $r['section'] === 'COMMUNITY MAPPING & REGISTRATION')),
                'ECCD CHECKLIST' => count(array_filter(self::$resources, fn($r) => $r['section'] === 'ECCD CHECKLIST')),
            ],
            'policyNotice' => 'Official ECCD Forms and Checklist Resources reference area. Contents are preserved without fabrication until official DepEd/DSWD files are integrated.',
        ];
    }

    /**
     * GET /api/resources/{id}
     */
    public function getResourceById(string $id): ?array
    {
        foreach (self::$resources as $r) {
            if ($r['id'] === $id || strtolower($r['code']) === strtolower($id)) {
                return $r;
            }
        }
        return null;
    }
}
