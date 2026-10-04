/**
 * ECCD CARE — Official ECCD Checklist Service
 * Connects Child 360° Profile, Central Data Store, Development Assessments, Timeline, and Follow-ups.
 * Fully compliant with official ECCD Council standards and lookup tables:
 * - ECCD-Checklist_Table-of-Score.pdf (Child's Record 1 & Child's Record 2)
 * - Scaled Scores (1 - 19)
 * - Standard Scores (Mean 100, SD 15)
 * - Automated Delay Cutoff (< 79 Standard Score or <= 6 Scaled Score)
 * - Direct Dispatch to Urgent Follow-ups Queue
 */

import { centralDataStore } from './centralDataStore.js';
import { followUpService } from './followUpService.js';
import { getPhilippinesDate, getPhilippinesDateTime, addDaysPHT } from '../utils/phTime.js';
import { CHECKLIST_RECORD_1, CHECKLIST_RECORD_2, HOW_TO_USE_MANUAL } from '../data/officialChecklistData.js';
import {
  rawToScaledScore,
  sumToStandardScore,
  getStandardScoreInterpretation,
  DOMAIN_MAX_ITEMS,
} from '../data/officialEccdNorms.js';

export const officialChecklistService = {
  /**
   * Determine whether Child's Record 1 or 2 applies based on child age
   */
  getAppropriateRecord(child) {
    if (!child) return CHECKLIST_RECORD_1;

    let ageInMonths = child.ageMonths;
    if (ageInMonths === undefined || ageInMonths === null) {
      if (child.birthDate) {
        const bdate = new Date(child.birthDate);
        const today = new Date();
        ageInMonths = (today.getFullYear() - bdate.getFullYear()) * 12 + (today.getMonth() - bdate.getMonth());
      } else {
        ageInMonths = (child.ageYears || 3) * 12;
      }
    }

    // 0 to 36 months = Child's Record 1 (0 to 3.0 years)
    // 37 months and up = Child's Record 2 (3 years 1 month to 5 years 11 months)
    return ageInMonths <= 36 ? CHECKLIST_RECORD_1 : CHECKLIST_RECORD_2;
  },

  /**
   * Get manual instructions and materials
   */
  getManual() {
    return HOW_TO_USE_MANUAL;
  },

  /**
   * Calculate raw score for a domain (number of items marked present)
   */
  calculateDomainRawScore(domain, answers) {
    let rawScore = 0;
    domain.sections.forEach((section) => {
      section.items.forEach((item) => {
        if (answers[item.id]?.present) {
          rawScore++;
        }
      });
    });
    return rawScore;
  },

  /**
   * Domain Max Item Counts from Official ECCD Council Manual
   */
  getDomainMaxItems(recordType) {
    if (recordType === "Child's Record 1" || recordType === 'record1') {
      return {
        'Gross Motor Domain': DOMAIN_MAX_ITEMS.record1.grossMotor,
        'Fine Motor Domain': DOMAIN_MAX_ITEMS.record1.fineMotor,
        'Self-Help Domain': DOMAIN_MAX_ITEMS.record1.selfHelp,
        'Receptive Language Domain': DOMAIN_MAX_ITEMS.record1.receptiveLanguage,
        'Expressive Language Domain': DOMAIN_MAX_ITEMS.record1.expressiveLanguage,
        'Cognitive Domain': DOMAIN_MAX_ITEMS.record1.cognitive,
        'Social-Emotional Domain': DOMAIN_MAX_ITEMS.record1.socialEmotional,
      };
    }
    // Child's Record 2 (Age 3.1 - 5.11 years)
    return {
      'Gross Motor Domain': DOMAIN_MAX_ITEMS.record2.grossMotor,
      'Fine Motor Domain': DOMAIN_MAX_ITEMS.record2.fineMotor,
      'Self-Help Domain': DOMAIN_MAX_ITEMS.record2.selfHelp,
      'Receptive Language Domain': DOMAIN_MAX_ITEMS.record2.receptiveLanguage,
      'Expressive Language Domain': DOMAIN_MAX_ITEMS.record2.expressiveLanguage,
      'Cognitive Domain': DOMAIN_MAX_ITEMS.record2.cognitive,
      'Social-Emotional Domain': DOMAIN_MAX_ITEMS.record2.socialEmotional,
    };
  },

  /**
   * Convert domain raw scores to standard Scaled Scores (1-19) using official ECCD tables,
   * Calculate Sum of Scaled Scores, and derive overall Standard Score (Mean 100, SD 15).
   * Evaluate for developmental delay cutoff (Scaled Score <= 6 or Standard Score < 79).
   */
  calculateScores({
    domainRawScores = {},
    recordType = "Child's Record 2",
    childAgeMonths = null,
    child = null,
  }) {
    const isRecord1 = recordType === "Child's Record 1" || recordType === 'record1';
    const maxItems = this.getDomainMaxItems(recordType);
    const domainScaledScores = {};
    const domainDetails = [];
    let sumScaledScores = 0;
    let anyDomainDelayed = false;
    const delayedDomains = [];

    // Resolve age in months accurately
    let effectiveAgeMonths = childAgeMonths;
    if (effectiveAgeMonths === null || effectiveAgeMonths === undefined) {
      if (child) {
        if (child.birthDate) {
          const bdate = new Date(child.birthDate);
          const today = new Date();
          effectiveAgeMonths = (today.getFullYear() - bdate.getFullYear()) * 12 + (today.getMonth() - bdate.getMonth());
        } else if (child.ageMonths !== undefined) {
          effectiveAgeMonths = child.ageMonths;
        } else if (child.ageYears !== undefined) {
          effectiveAgeMonths = child.ageYears * 12;
        }
      }
    }
    if (effectiveAgeMonths === null || effectiveAgeMonths === undefined) {
      effectiveAgeMonths = isRecord1 ? 24 : 48; // Default representative age
    }

    // Official ECCD Domains list in standard order
    const domainsList = [
      'Gross Motor Domain',
      'Fine Motor Domain',
      'Self-Help Domain',
      'Receptive Language Domain',
      'Expressive Language Domain',
      'Cognitive Domain',
      'Social-Emotional Domain',
    ];

    domainsList.forEach((domName) => {
      // Find matching key in domainRawScores (case-insensitive & whitespace trimmed)
      const matchingKey = Object.keys(domainRawScores).find(
        (k) => k.toLowerCase().replace(' domain', '').trim() === domName.toLowerCase().replace(' domain', '').trim()
      ) || domName;

      const rawScore = Number(domainRawScores[matchingKey] || 0);
      const max = maxItems[domName] || 20;

      // Official conversion from raw score to Scaled Score (1 - 19)
      const scaledScore = rawToScaledScore(rawScore, domName, effectiveAgeMonths, recordType);
      domainScaledScores[domName] = scaledScore;
      sumScaledScores += scaledScore;

      // ECCD Council Cutoff: Scaled Score <= 6 indicates significant developmental risk
      const isAlert = scaledScore <= 6;
      if (isAlert) {
        anyDomainDelayed = true;
        delayedDomains.push({ name: domName, scaledScore, rawScore, max });
      }

      domainDetails.push({
        name: domName,
        score: rawScore,
        rawScore,
        scaledScore,
        max,
        alert: isAlert,
      });
    });

    // Derive Standard Score (Mean 100, SD 15) using official sum-to-standard table
    const standardScore = sumToStandardScore(sumScaledScores, recordType);

    // Official ECCD Council Delay Cutoff:
    // Any domain Scaled Score <= 6 OR overall Standard Score < 79
    const isStandardScoreDelayed = standardScore < 79;
    const isDelayed = anyDomainDelayed || isStandardScoreDelayed;

    // Official ECCD Council Interpretation
    const interpretation = getStandardScoreInterpretation(standardScore, anyDomainDelayed);

    const delayReason =
      'Developmental Delay detected: Standard Score < 79 (or domain scaled score <= 6) per ECCD Council Norms.';

    return {
      domainScaledScores,
      domainDetails,
      sumScaledScores,
      standardScore,
      scaledScore: standardScore, // Legacy alias for standardScore
      isDelayed,
      anyDomainDelayed,
      isStandardScoreDelayed,
      delayedDomains,
      interpretation,
      delayReason,
      ageInMonths: effectiveAgeMonths,
    };
  },

  /**
   * Save a completed assessment into centralized data store, child 360 profile, timeline,
   * and dispatch directly into the Urgent Follow-ups Queue if delay is detected.
   */
  async saveChecklistAssessment({
    childId,
    recordType,
    evaluator,
    assessmentDate,
    placeAdministered,
    answers,
    domainRawScores,
    totalRawScore,
    qualitativeNotes,
    assessmentCycle,
    requiresFollowUp,
    followUpReason,
    followUpPriority,
  }) {
    const child = centralDataStore.getChildById(childId);
    if (!child) throw new Error(`Child with ID ${childId} not found.`);

    const assessmentId = `DEV-ASSESS-${Date.now()}`;
    const formattedDate = assessmentDate || getPhilippinesDate();
    const examinerName = evaluator || 'Maria Santos, CDW I';
    const effectiveRecordType = recordType || (child.ageYears <= 3 ? "Child's Record 1" : "Child's Record 2");

    // 1. Calculate official ECCD scores and automated delay cutoff
    const scoreCalc = this.calculateScores({
      domainRawScores,
      recordType: effectiveRecordType,
      child,
    });

    // 2. Automated Scoring & Delay Detection Rule:
    // If any domain Scaled Score is <= 6, OR if the overall Standard Score is < 79:
    // Automatically flag requiresFollowUp = true.
    // Auto-assign Priority to 'Urgent' with official reason.
    const autoFollowUpRequired = Boolean(scoreCalc.isDelayed || requiresFollowUp);
    const finalPriority = scoreCalc.isDelayed ? 'Urgent' : (followUpPriority || 'High');
    const finalReason = scoreCalc.isDelayed
      ? scoreCalc.delayReason
      : (followUpReason || `Follow-up evaluation recommended following ${effectiveRecordType} administration.`);

    // Build assessment record
    const newAssessment = {
      id: assessmentId,
      cycle: assessmentCycle || 'Cycle 1 (Baseline - SY 2026–2027)',
      recordType: effectiveRecordType,
      date: formattedDate,
      evaluator: examinerName,
      placeAdministered: placeAdministered || `${child.dayCareCenter || 'Child Development Center'}, ${child.barangay}`,
      totalRawScore,
      domainScores: domainRawScores,
      domainScaledScores: scoreCalc.domainScaledScores,
      sumScaledScores: scoreCalc.sumScaledScores,
      standardScore: scoreCalc.standardScore,
      scaledScore: scoreCalc.standardScore, // Official derived standard score (Mean 100, SD 15)
      interpretation: scoreCalc.interpretation,
      isDelayed: scoreCalc.isDelayed,
      answers,
      qualitativeNotes: qualitativeNotes || {},
      status: autoFollowUpRequired ? 'Follow-up Required (Urgent)' : 'Assessment Completed',
      createdAt: getPhilippinesDateTime(),
    };

    // 3. Update child record in central data store with standard scores
    const currentAssessments = child.developmentAssessments || [];
    const updatedAssessments = [
      {
        cycle: newAssessment.cycle,
        date: newAssessment.date,
        evaluator: newAssessment.evaluator,
        scaledScore: scoreCalc.standardScore,
        standardScore: scoreCalc.standardScore,
        sumScaledScores: scoreCalc.sumScaledScores,
        interpretation: scoreCalc.interpretation,
        rawScores: domainRawScores,
        domainScaledScores: scoreCalc.domainScaledScores,
        recordType: newAssessment.recordType,
        assessmentId: newAssessment.id,
        isDelayed: scoreCalc.isDelayed,
        domains: scoreCalc.domainDetails,
      },
      ...currentAssessments,
    ];

    // 4. Add event to child timeline
    const currentTimeline = child.timeline || [];
    const newTimelineEvent = {
      id: `TL-DEV-${Date.now()}`,
      title: `Completed Official ECCD Checklist (${newAssessment.recordType})`,
      category: 'development',
      date: formattedDate,
      officer: examinerName,
      notes: `Administered official ECCD Checklist assessment. Standard Score: ${scoreCalc.standardScore} (${scoreCalc.interpretation}). Raw Score: ${totalRawScore} items demonstrated across 7 domains.`,
    };

    // 5. Create and dispatch directly into the Urgent Follow-ups Queue
    let followUpCase = null;
    if (autoFollowUpRequired) {
      const followUpId = `FLW-${Date.now()}`;
      followUpCase = {
        id: followUpId,
        title: `Developmental Follow-up (${child.fullName})`,
        issue: finalReason,
        priority: finalPriority,
        status: 'Open',
        dueDate: addDaysPHT(14),
        assignedWorker: examinerName,
        createdAt: formattedDate,
      };

      const currentFollowUps = child.followUpCases || [];
      child.followUpCases = [followUpCase, ...currentFollowUps];

      // Add timeline event for follow-up case
      currentTimeline.unshift({
        id: `TL-FLW-${Date.now()}`,
        title: scoreCalc.isDelayed
          ? 'URGENT Follow-up Case Opened (ECCD Council Delay Cutoff)'
          : 'Follow-up Case Opened (Developmental Monitoring)',
        category: 'followup',
        date: formattedDate,
        officer: examinerName,
        notes: `Follow-up required: ${finalReason} (Priority: ${finalPriority})`,
      });

      // Dispatch directly into centralized Follow-Up Service Queue
      try {
        const delayedDomainNames = scoreCalc.delayedDomains
          .map((d) => `${d.name.replace(' Domain', '')} (Scaled: ${d.scaledScore})`)
          .join(', ');

        const followUpPayload = {
          childId: child.id,
          childName: child.fullName || `${child.firstName} ${child.lastName}`,
          barangay: child.barangay || 'City of San Fernando',
          dayCareCenter: child.dayCareCenter || 'Child Development Center',
          reason: finalReason,
          assignedWorker: examinerName,
          workerContact: child.workerContact || '0917-555-0100',
          dueDate: followUpCase.dueDate,
          category: 'Needs Attention',
          status: 'Needs Attention',
          actionType: 'Follow-up',
          notes: `Automated ECCD Council Delay Alert: Standard Score = ${scoreCalc.standardScore} (${scoreCalc.interpretation}). ${delayedDomainNames ? 'Delayed domains: ' + delayedDomainNames : ''}`,
        };

        await followUpService.createFollowUp(followUpPayload);
      } catch (err) {
        console.warn('Failed to dispatch follow-up to FollowUpService queue:', err);
      }
    }

    // 6. Update child pillars and store
    child.developmentAssessments = updatedAssessments;
    child.timeline = [newTimelineEvent, ...currentTimeline];
    if (child.statusPillars?.development) {
      child.statusPillars.development.status = scoreCalc.isDelayed
        ? 'Developmental Delay Detected'
        : 'Assessment Completed';
      child.statusPillars.development.scaledScore = scoreCalc.standardScore;
      child.statusPillars.development.lastAssessmentDate = formattedDate;
    }
    if (child.statusPillars?.followUp && autoFollowUpRequired) {
      child.statusPillars.followUp.status = finalPriority === 'Urgent' ? 'Urgent Action Required' : 'Active Case';
      child.statusPillars.followUp.priority = finalPriority;
      child.statusPillars.followUp.dueDate = followUpCase ? followUpCase.dueDate : formattedDate;
      child.statusPillars.followUp.issue = finalReason;
    }

    centralDataStore.updateChild(child.id, child);

    // Save full detailed responses in localStorage for retrieval and print
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`eccd_checklist_${assessmentId}`, JSON.stringify(newAssessment));
        window.localStorage.setItem(`eccd_checklist_latest_${child.id}`, JSON.stringify(newAssessment));
      }
    } catch (e) {
      console.warn('Failed to cache assessment in localStorage:', e);
    }

    return newAssessment;
  },

  /**
   * Get historical checklist assessment
   */
  getDetailedAssessment(assessmentId) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(`eccd_checklist_${assessmentId}`);
        if (stored) return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return null;
  },

  /**
   * Get all completed assessments for a specific child
   */
  getChildAssessmentHistory(childId) {
    const child = centralDataStore.getChildById(childId);
    return child?.developmentAssessments || [];
  },
};

export default officialChecklistService;
