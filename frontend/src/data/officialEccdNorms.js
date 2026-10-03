/**
 * ECCD CARE — Official ECCD Council Norms & Scoring Tables
 * Reference: ECCD Checklist Table of Scaled Scores and Standard Scores
 * (DepEd / DOH / DSWD / ECCD Council / UNICEF Official Tables)
 *
 * Child's Record 1 (Ages 0 to 3.0 years / 0 to 36 months)
 * Child's Record 2 (Ages 3.1 to 5.11 years / 37 to 71 months)
 */

export const DOMAIN_MAX_ITEMS = {
  record1: {
    grossMotor: 22,
    fineMotor: 14,
    selfHelp: 10,
    receptiveLanguage: 15,
    expressiveLanguage: 22,
    cognitive: 18,
    socialEmotional: 14,
  },
  record2: {
    grossMotor: 13,
    fineMotor: 11,
    selfHelp: 27,
    receptiveLanguage: 5,
    expressiveLanguage: 8,
    cognitive: 21,
    socialEmotional: 24,
  },
};

/**
 * Standard Score Equivalent of Sum of Scaled Scores — Child's Record 2
 * Source: Page 7 of ECCD-Checklist_Table-of-Score.pdf
 */
export const SUM_TO_STANDARD_RECORD_2 = {
  29: 37, 30: 38, 31: 40, 32: 41, 33: 43, 34: 44, 35: 45, 36: 47, 37: 48, 38: 50,
  39: 51, 40: 53, 41: 54, 42: 56, 43: 57, 44: 59, 45: 60, 46: 62, 47: 63, 48: 65,
  49: 66, 50: 67, 51: 69, 52: 70, 53: 72, 54: 73, 55: 75, 56: 76, 57: 78, 58: 79,
  59: 81, 60: 82, 61: 84, 62: 85, 63: 86, 64: 88, 65: 89, 66: 91, 67: 92, 68: 94,
  69: 95, 70: 97, 71: 98, 72: 100, 73: 101, 74: 103, 75: 104, 76: 105, 77: 107,
  78: 108, 79: 110, 80: 111, 81: 113, 82: 114, 83: 116, 84: 117, 85: 119, 86: 120,
  87: 122, 88: 123, 89: 124, 90: 126, 91: 127, 92: 129, 93: 130, 94: 132, 95: 133,
  96: 135, 97: 136, 98: 138,
};

/**
 * Standard Score Equivalent of Sum of Scaled Scores — Child's Record 1
 * Source: Page 4 of ECCD-Checklist_Table-of-Score.pdf
 */
export const SUM_TO_STANDARD_RECORD_1 = {
  21: 39, 22: 40, 23: 42, 24: 43, 25: 44, 26: 45, 27: 46, 28: 48, 29: 49, 30: 50,
  31: 51, 32: 53, 33: 54, 34: 55, 35: 56, 36: 57, 37: 59, 38: 60, 39: 61, 40: 62,
  41: 64, 42: 65, 43: 66, 44: 67, 45: 68, 46: 70, 47: 71, 48: 72, 49: 73, 50: 75,
  51: 76, 52: 77, 53: 78, 54: 79, 55: 81, 56: 82, 57: 83, 58: 84, 59: 86, 60: 87,
  61: 88, 62: 89, 63: 90, 64: 92, 65: 93, 66: 94, 67: 95, 68: 96, 69: 98, 70: 99,
  71: 100, 72: 101, 73: 103, 74: 104, 75: 105, 76: 106, 77: 107, 78: 109, 79: 110,
  80: 111, 81: 112, 82: 114, 83: 115, 84: 116, 85: 117, 86: 118, 87: 120, 88: 121,
  89: 122, 90: 123, 91: 125, 92: 126, 93: 127, 94: 128, 95: 129, 96: 131, 97: 132,
  98: 133, 99: 134, 100: 135, 101: 137, 102: 138, 103: 139, 104: 140, 105: 142,
  106: 143, 107: 144, 108: 145, 109: 146, 110: 148, 112: 150,
};

/**
 * Child's Record 2 Raw Score -> Scaled Score Table (Page 6)
 * Format: [minRaw, maxRaw, scaledScore]
 */
export const RAW_TO_SCALED_RECORD_2 = {
  '3.1-4.0': {
    grossMotor: [
      [0, 3, 1], [4, 4, 2], [5, 5, 3], [6, 6, 5], [7, 7, 6],
      [8, 8, 7], [9, 9, 8], [10, 10, 10], [11, 11, 11], [12, 12, 12], [13, 13, 14],
    ],
    fineMotor: [
      [0, 3, 2], [4, 4, 4], [5, 5, 5], [6, 6, 7], [7, 7, 9],
      [8, 8, 10], [9, 9, 12], [10, 10, 14], [11, 11, 15],
    ],
    selfHelp: [
      [0, 9, 1], [10, 10, 2], [11, 11, 3], [12, 12, 4], [13, 14, 5],
      [15, 15, 6], [16, 16, 7], [17, 17, 8], [18, 19, 9], [20, 20, 10],
      [21, 21, 11], [22, 22, 12], [23, 24, 13], [25, 25, 14], [26, 26, 15], [27, 27, 16],
    ],
    receptiveLanguage: [
      [0, 1, 3], [2, 2, 5], [3, 3, 7], [4, 4, 10], [5, 5, 12],
    ],
    expressiveLanguage: [
      [0, 2, 1], [3, 3, 3], [4, 4, 4], [5, 5, 6], [6, 6, 8], [7, 7, 10], [8, 8, 12],
    ],
    cognitive: [
      [0, 0, 3], [1, 1, 4], [2, 3, 5], [4, 4, 6], [5, 5, 7], [6, 6, 8],
      [7, 7, 9], [8, 9, 10], [10, 10, 11], [11, 11, 12], [12, 12, 13],
      [13, 14, 14], [15, 15, 15], [16, 16, 16], [17, 17, 17], [18, 18, 18], [19, 21, 19],
    ],
    socialEmotional: [
      [0, 9, 1], [10, 11, 2], [12, 12, 3], [13, 13, 4], [14, 14, 5],
      [15, 15, 6], [16, 16, 7], [17, 18, 8], [19, 19, 9], [20, 20, 10],
      [21, 21, 11], [22, 22, 12], [23, 23, 13], [24, 24, 14],
    ],
  },
  '4.1-5.0': {
    grossMotor: [
      [0, 5, 1], [6, 6, 2], [7, 7, 4], [8, 8, 5], [9, 9, 7],
      [10, 10, 8], [11, 11, 10], [12, 12, 11], [13, 13, 13],
    ],
    fineMotor: [
      [0, 3, 1], [4, 4, 2], [5, 5, 4], [6, 6, 5], [7, 7, 7],
      [8, 8, 9], [9, 9, 10], [10, 10, 12], [11, 11, 14],
    ],
    selfHelp: [
      [0, 15, 1], [16, 16, 2], [17, 17, 3], [18, 18, 4], [19, 19, 5],
      [20, 20, 6], [21, 21, 8], [22, 22, 9], [23, 23, 10], [24, 24, 11],
      [25, 25, 12], [26, 26, 13], [27, 27, 14],
    ],
    receptiveLanguage: [
      [0, 1, 1], [2, 2, 3], [3, 3, 6], [4, 4, 9], [5, 5, 11],
    ],
    expressiveLanguage: [
      [0, 5, 2], [6, 6, 5], [7, 7, 8], [8, 8, 11],
    ],
    cognitive: [
      [0, 0, 1], [1, 1, 2], [2, 3, 3], [4, 4, 4], [5, 5, 5], [6, 7, 6],
      [8, 8, 7], [9, 10, 8], [11, 11, 9], [12, 12, 10], [13, 14, 11],
      [15, 15, 12], [16, 17, 13], [18, 18, 14], [19, 20, 15], [21, 21, 16],
    ],
    socialEmotional: [
      [0, 13, 1], [14, 14, 2], [15, 15, 3], [16, 16, 4], [17, 17, 5],
      [18, 18, 7], [19, 19, 8], [20, 20, 9], [21, 21, 10], [22, 22, 11],
      [23, 23, 12], [24, 24, 13],
    ],
  },
  '5.1-5.11': {
    grossMotor: [
      [0, 10, 1], [11, 11, 4], [12, 12, 7], [13, 13, 11],
    ],
    fineMotor: [
      [0, 5, 1], [6, 6, 3], [7, 7, 5], [8, 8, 7], [9, 9, 8],
      [10, 10, 10], [11, 11, 12],
    ],
    selfHelp: [
      [0, 19, 2], [20, 20, 3], [21, 21, 4], [22, 22, 6], [23, 23, 7],
      [24, 24, 9], [25, 25, 10], [26, 26, 12], [27, 27, 13],
    ],
    receptiveLanguage: [
      [0, 2, 1], [3, 3, 4], [4, 4, 8], [5, 5, 11],
    ],
    expressiveLanguage: [
      [0, 7, 5], [8, 8, 11],
    ],
    cognitive: [
      [0, 9, 1], [10, 10, 2], [11, 11, 3], [12, 12, 4], [13, 13, 5],
      [14, 14, 6], [15, 15, 7], [16, 16, 8], [17, 17, 9], [18, 18, 10],
      [19, 19, 11], [20, 20, 12], [21, 21, 13],
    ],
    socialEmotional: [
      [0, 15, 1], [16, 16, 2], [17, 17, 3], [18, 18, 5], [19, 19, 6],
      [20, 20, 7], [21, 21, 9], [22, 22, 10], [23, 23, 11], [24, 24, 13],
    ],
  },
};

/**
 * Child's Record 1 Raw Score -> Scaled Score Table (Page 2 & 3)
 */
export const RAW_TO_SCALED_RECORD_1 = {
  '0-3m': {
    grossMotor: [[0, 0, 7], [1, 1, 9], [2, 2, 10], [3, 3, 12], [4, 4, 13], [5, 5, 14], [6, 6, 16], [7, 7, 17], [8, 22, 18]],
    fineMotor: [[0, 0, 8], [1, 1, 10], [2, 2, 13], [3, 3, 15], [4, 14, 18]],
    selfHelp: [[0, 0, 2], [1, 1, 10], [2, 10, 18]],
    receptiveLanguage: [[0, 0, 6], [1, 1, 7], [2, 2, 9], [3, 3, 10], [4, 4, 12], [5, 5, 13], [6, 6, 14], [7, 7, 16], [8, 15, 17]],
    expressiveLanguage: [[0, 0, 1], [1, 1, 9], [2, 2, 11], [3, 3, 12], [4, 4, 14], [5, 5, 15], [6, 6, 16], [7, 22, 18]],
    cognitive: [[0, 0, 7], [1, 1, 8], [2, 2, 10], [3, 3, 11], [4, 4, 13], [5, 5, 15], [6, 6, 16], [7, 7, 17], [8, 18, 19]],
    socialEmotional: [[0, 0, 7], [1, 1, 8], [2, 2, 10], [3, 3, 11], [4, 4, 13], [5, 5, 15], [6, 6, 16], [7, 7, 18], [8, 14, 19]],
  },
  '4-6m': {
    grossMotor: [[0, 1, 1], [2, 2, 3], [3, 3, 4], [4, 4, 6], [5, 5, 8], [6, 6, 9], [7, 7, 11], [8, 8, 13], [9, 9, 14], [10, 10, 16], [11, 11, 17], [12, 22, 19]],
    fineMotor: [[0, 0, 4], [1, 1, 6], [2, 2, 7], [3, 3, 9], [4, 4, 11], [5, 5, 12], [6, 6, 14], [7, 7, 15], [8, 8, 17], [9, 14, 18]],
    selfHelp: [[0, 0, 5], [1, 1, 7], [2, 2, 9], [3, 3, 11], [4, 4, 13], [5, 5, 15], [6, 6, 17], [7, 10, 19]],
    receptiveLanguage: [[0, 2, 1], [3, 3, 4], [4, 4, 6], [5, 5, 9], [6, 6, 11], [7, 7, 14], [8, 8, 16], [9, 15, 19]],
    expressiveLanguage: [[0, 0, 3], [1, 1, 5], [2, 2, 6], [3, 3, 8], [4, 4, 9], [5, 5, 10], [6, 6, 11], [7, 7, 12], [8, 8, 13], [9, 9, 14], [10, 10, 16], [11, 11, 17], [12, 12, 18], [13, 22, 19]],
    cognitive: [[0, 0, 2], [1, 1, 3], [2, 2, 5], [3, 3, 6], [4, 4, 7], [5, 5, 8], [6, 6, 9], [7, 7, 10], [8, 8, 11], [9, 9, 12], [10, 10, 14], [11, 11, 15], [12, 12, 17], [13, 18, 19]],
    socialEmotional: [[0, 0, 3], [1, 1, 4], [2, 2, 5], [3, 3, 6], [4, 4, 7], [5, 5, 8], [6, 6, 9], [7, 7, 10], [8, 8, 11], [9, 9, 12], [10, 10, 13], [11, 11, 14], [12, 12, 15], [13, 13, 16], [14, 14, 17]],
  },
  '7-9m': {
    grossMotor: [[0, 5, 4], [6, 6, 5], [7, 7, 7], [8, 8, 8], [9, 9, 9], [10, 10, 10], [11, 11, 11], [12, 12, 12], [13, 13, 13], [14, 14, 14], [15, 15, 15], [16, 16, 16], [17, 17, 17], [18, 18, 18], [19, 22, 19]],
    fineMotor: [[0, 1, 4], [2, 2, 5], [3, 3, 6], [4, 4, 7], [5, 5, 9], [6, 6, 10], [7, 7, 11], [8, 8, 12], [9, 9, 14], [10, 10, 15], [11, 11, 16], [12, 12, 17], [13, 14, 19]],
    selfHelp: [[0, 1, 1], [2, 2, 4], [3, 3, 6], [4, 4, 8], [5, 5, 11], [6, 6, 13], [7, 7, 15], [8, 10, 17]],
    receptiveLanguage: [[0, 3, 2], [4, 4, 4], [5, 5, 7], [6, 6, 9], [7, 7, 11], [8, 8, 13], [9, 9, 16], [10, 15, 18]],
    expressiveLanguage: [[0, 0, 2], [1, 1, 3], [2, 2, 4], [3, 3, 5], [4, 4, 6], [5, 5, 7], [6, 6, 8], [7, 7, 9], [8, 8, 10], [9, 9, 11], [10, 10, 12], [11, 11, 13], [12, 12, 14], [13, 13, 15], [14, 14, 16], [15, 22, 17]],
    cognitive: [[0, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 5], [5, 5, 6], [6, 6, 7], [7, 7, 8], [8, 8, 9], [9, 9, 10], [10, 10, 11], [11, 11, 12], [12, 12, 13], [13, 13, 14], [14, 14, 15], [15, 15, 16], [16, 16, 17], [17, 17, 18], [18, 18, 19]],
    socialEmotional: [[0, 2, 1], [3, 3, 2], [4, 4, 4], [5, 5, 5], [6, 6, 6], [7, 7, 7], [8, 8, 8], [9, 9, 9], [10, 10, 10], [11, 11, 11], [12, 12, 12], [13, 13, 13], [14, 14, 14]],
  },
  '10-12m': {
    grossMotor: [[0, 7, 1], [8, 8, 3], [9, 9, 4], [10, 10, 5], [11, 11, 6], [12, 12, 8], [13, 13, 9], [14, 14, 10], [15, 15, 11], [16, 16, 12], [17, 17, 14], [18, 18, 15], [19, 19, 16], [20, 20, 18], [21, 22, 19]],
    fineMotor: [[0, 1, 2], [2, 2, 3], [3, 3, 4], [4, 4, 5], [5, 5, 7], [6, 6, 8], [7, 7, 9], [8, 8, 10], [9, 9, 11], [10, 10, 12], [11, 11, 13], [12, 12, 14], [13, 13, 16], [14, 14, 17]],
    selfHelp: [[0, 2, 1], [3, 3, 4], [4, 4, 6], [5, 5, 8], [6, 6, 11], [7, 7, 13], [8, 8, 15], [9, 10, 18]],
    receptiveLanguage: [[0, 3, 2], [4, 4, 3], [5, 5, 5], [6, 6, 7], [7, 7, 9], [8, 8, 11], [9, 9, 13], [10, 10, 15], [11, 15, 17]],
    expressiveLanguage: [[0, 2, 1], [3, 3, 2], [4, 4, 3], [5, 5, 4], [6, 6, 5], [7, 7, 6], [8, 8, 8], [9, 9, 9], [10, 10, 10], [11, 11, 11], [12, 12, 12], [13, 13, 13], [14, 14, 14], [15, 22, 15]],
    cognitive: [[0, 2, 1], [3, 3, 2], [4, 4, 3], [5, 5, 4], [6, 6, 5], [7, 7, 6], [8, 8, 7], [9, 9, 8], [10, 10, 9], [11, 11, 10], [12, 12, 11], [13, 13, 12], [14, 14, 13], [15, 15, 14], [16, 16, 15], [17, 18, 16]],
    socialEmotional: [[0, 4, 1], [5, 5, 2], [6, 6, 3], [7, 7, 5], [8, 8, 6], [9, 9, 7], [10, 11, 9], [12, 12, 11], [13, 13, 13], [14, 14, 14]],
  },
  '13-18m': {
    grossMotor: [[0, 11, 1], [12, 12, 2], [13, 13, 3], [14, 14, 5], [15, 15, 6], [16, 16, 7], [17, 17, 9], [18, 18, 10], [19, 19, 11], [20, 20, 13], [21, 21, 14], [22, 22, 15]],
    fineMotor: [[0, 6, 2], [7, 7, 4], [8, 8, 5], [9, 9, 7], [10, 10, 8], [11, 11, 10], [12, 12, 12], [13, 13, 13], [14, 14, 15]],
    selfHelp: [[0, 3, 1], [4, 4, 3], [5, 5, 5], [6, 6, 7], [7, 7, 9], [8, 8, 11], [9, 9, 13], [10, 10, 15]],
    receptiveLanguage: [[0, 4, 2], [5, 5, 4], [6, 6, 5], [7, 7, 7], [8, 8, 8], [9, 9, 9], [10, 10, 11], [11, 11, 12], [12, 12, 14], [13, 13, 15], [14, 14, 16], [15, 15, 18]],
    expressiveLanguage: [[0, 7, 1], [8, 8, 2], [9, 9, 4], [10, 10, 5], [11, 11, 7], [12, 12, 8], [13, 13, 10], [14, 14, 11], [15, 15, 13], [16, 16, 14], [17, 17, 16], [18, 18, 17], [19, 22, 19]],
    cognitive: [[0, 6, 1], [7, 7, 2], [8, 8, 4], [9, 9, 5], [10, 10, 6], [11, 11, 7], [12, 12, 8], [13, 13, 9], [14, 14, 10], [15, 15, 11], [16, 16, 12], [17, 17, 13], [18, 18, 15]],
    socialEmotional: [[0, 8, 1], [9, 9, 3], [10, 10, 5], [11, 11, 7], [12, 12, 9], [13, 13, 11], [14, 14, 12]],
  },
  '19-24m': {
    grossMotor: [[0, 15, 1], [16, 16, 3], [17, 17, 5], [18, 18, 7], [19, 19, 9], [20, 20, 11], [21, 21, 13], [22, 22, 15]],
    fineMotor: [[0, 7, 1], [8, 8, 3], [9, 9, 5], [10, 10, 6], [11, 11, 8], [12, 12, 10], [13, 13, 11], [14, 14, 13]],
    selfHelp: [[0, 6, 3], [7, 7, 5], [8, 8, 8], [9, 9, 11], [10, 10, 14]],
    receptiveLanguage: [[0, 6, 3], [7, 7, 4], [8, 8, 6], [9, 9, 7], [10, 10, 8], [11, 11, 10], [12, 12, 11], [13, 13, 12], [14, 14, 13], [15, 15, 15]],
    expressiveLanguage: [[0, 7, 1], [8, 8, 2], [9, 9, 3], [10, 10, 4], [11, 11, 5], [12, 12, 6], [13, 13, 7], [14, 14, 9], [15, 15, 10], [16, 16, 11], [17, 17, 12], [18, 18, 13], [19, 19, 14], [20, 20, 15], [21, 21, 16], [22, 22, 17]],
    cognitive: [[0, 8, 1], [9, 9, 2], [10, 10, 3], [11, 11, 5], [12, 12, 6], [13, 13, 7], [14, 14, 9], [15, 15, 10], [16, 16, 11], [17, 17, 12], [18, 18, 14]],
    socialEmotional: [[0, 10, 2], [11, 11, 5], [12, 12, 7], [13, 13, 10], [14, 14, 12]],
  },
  '25-30m': {
    grossMotor: [[0, 16, 1], [17, 17, 3], [18, 18, 5], [19, 19, 8], [20, 20, 10], [21, 21, 12], [22, 22, 14]],
    fineMotor: [[0, 8, 1], [9, 9, 3], [10, 10, 5], [11, 11, 7], [12, 12, 8], [13, 13, 10], [14, 14, 12]],
    selfHelp: [[0, 7, 4], [8, 8, 7], [9, 9, 10], [10, 10, 13]],
    receptiveLanguage: [[0, 7, 1], [8, 8, 3], [9, 9, 4], [10, 10, 6], [11, 11, 7], [12, 12, 9], [13, 13, 10], [14, 14, 12], [15, 15, 13]],
    expressiveLanguage: [[0, 10, 1], [11, 11, 2], [12, 12, 3], [13, 13, 4], [14, 14, 5], [15, 15, 6], [16, 16, 7], [17, 17, 8], [18, 18, 9], [19, 19, 10], [20, 20, 11], [21, 21, 13], [22, 22, 14]],
    cognitive: [[0, 13, 2], [14, 14, 4], [15, 15, 6], [16, 16, 9], [17, 17, 11], [18, 18, 13]],
    socialEmotional: [[0, 11, 2], [12, 12, 6], [13, 13, 9], [14, 14, 12]],
  },
  '31-36m': {
    grossMotor: [[0, 17, 2], [18, 18, 5], [19, 19, 7], [20, 20, 9], [21, 21, 11], [22, 22, 14]],
    fineMotor: [[0, 10, 4], [11, 11, 6], [12, 12, 8], [13, 13, 10], [14, 14, 12]],
    selfHelp: [[0, 7, 1], [8, 8, 5], [9, 9, 9], [10, 10, 13]],
    receptiveLanguage: [[0, 8, 2], [9, 9, 3], [10, 10, 5], [11, 11, 6], [12, 12, 8], [13, 13, 9], [14, 14, 11], [15, 15, 12]],
    expressiveLanguage: [[0, 14, 1], [15, 15, 3], [16, 16, 4], [17, 17, 6], [18, 18, 7], [19, 19, 8], [20, 20, 10], [21, 21, 11], [22, 22, 12]],
    cognitive: [[0, 13, 1], [14, 14, 4], [15, 15, 6], [16, 16, 8], [17, 17, 10], [18, 18, 12]],
    socialEmotional: [[0, 11, 1], [12, 12, 5], [13, 13, 8], [14, 14, 12]],
  },
};

/**
 * Helper to normalize domain key from string
 */
export function normalizeDomainKey(name) {
  const clean = String(name || '').toLowerCase().replace(/ domain$/, '').trim();
  if (clean.includes('gross')) return 'grossMotor';
  if (clean.includes('fine')) return 'fineMotor';
  if (clean.includes('self')) return 'selfHelp';
  if (clean.includes('receptive')) return 'receptiveLanguage';
  if (clean.includes('expressive')) return 'expressiveLanguage';
  if (clean.includes('cog')) return 'cognitive';
  if (clean.includes('soc')) return 'socialEmotional';
  return 'grossMotor';
}

/**
 * Determine age bracket from age in months and record type
 */
export function getAgeBracket(ageInMonths = 48, isRecord1 = false) {
  const m = Number(ageInMonths) || 48;
  if (isRecord1 || m <= 36) {
    if (m <= 3) return '0-3m';
    if (m <= 6) return '4-6m';
    if (m <= 9) return '7-9m';
    if (m <= 12) return '10-12m';
    if (m <= 18) return '13-18m';
    if (m <= 24) return '19-24m';
    if (m <= 30) return '25-30m';
    return '31-36m';
  }

  // Child's Record 2 (37 to 71 months)
  if (m <= 48) return '3.1-4.0';
  if (m <= 60) return '4.1-5.0';
  return '5.1-5.11';
}

/**
 * Convert Domain Raw Score to Scaled Score (1 - 19)
 */
export function rawToScaledScore(rawScore, domainName, ageInMonths = 48, recordType = "Child's Record 2") {
  const isRec1 = recordType === "Child's Record 1" || recordType === 'record1';
  const ageBracket = getAgeBracket(ageInMonths, isRec1);
  const domainKey = normalizeDomainKey(domainName);
  const table = isRec1 ? RAW_TO_SCALED_RECORD_1[ageBracket] : RAW_TO_SCALED_RECORD_2[ageBracket];

  const raw = Number(rawScore) || 0;
  if (!table || !table[domainKey]) {
    // Fallback proportional mapping if table missing
    const max = (isRec1 ? DOMAIN_MAX_ITEMS.record1[domainKey] : DOMAIN_MAX_ITEMS.record2[domainKey]) || 20;
    return Math.max(1, Math.min(19, Math.round(1 + (raw / max) * 18)));
  }

  const entries = table[domainKey];
  for (const [minR, maxR, scaled] of entries) {
    if (raw >= minR && raw <= maxR) {
      return scaled;
    }
  }

  // If raw score is outside ranges, clamp to closest entry
  if (raw <= entries[0][0]) return entries[0][2];
  const lastEntry = entries[entries.length - 1];
  if (raw >= lastEntry[1]) return lastEntry[2];

  // Between gaps: find nearest
  for (let i = 0; i < entries.length - 1; i++) {
    const cur = entries[i];
    const nxt = entries[i + 1];
    if (raw > cur[1] && raw < nxt[0]) {
      return cur[2]; // Conservatively assign the previous scaled score
    }
  }

  return 10; // Default neutral
}

/**
 * Convert Sum of Scaled Scores (7 domains) to Standard Score (Mean 100, SD 15)
 */
export function sumToStandardScore(sumScaled, recordType = "Child's Record 2") {
  const isRec1 = recordType === "Child's Record 1" || recordType === 'record1';
  const table = isRec1 ? SUM_TO_STANDARD_RECORD_1 : SUM_TO_STANDARD_RECORD_2;
  const s = Math.round(Number(sumScaled) || 70);

  if (table[s] !== undefined) {
    return table[s];
  }

  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  const minKey = keys[0];
  const maxKey = keys[keys.length - 1];

  if (s < minKey) {
    const slope = isRec1 ? 1.25 : 1.45;
    return Math.max(20, Math.round(table[minKey] - (minKey - s) * slope));
  }

  if (s > maxKey) {
    const slope = isRec1 ? 1.25 : 1.45;
    return Math.min(160, Math.round(table[maxKey] + (s - maxKey) * slope));
  }

  // Linear interpolation for any missing keys in between
  let lower = minKey, upper = maxKey;
  for (const k of keys) {
    if (k <= s) lower = k;
    if (k >= s && upper === maxKey) { upper = k; break; }
  }
  const ratio = (s - lower) / ((upper - lower) || 1);
  return Math.round(table[lower] + ratio * (table[upper] - table[lower]));
}

/**
 * Interpretation per ECCD Council Norms (Child's Record 1 & 2)
 */
export function getStandardScoreInterpretation(standardScore, anyDomainDelayed = false) {
  const ss = Number(standardScore);
  if (ss < 79 || anyDomainDelayed) {
    if (ss <= 69) {
      return 'Suggests Significant Developmental Delay';
    }
    return 'Suggests Developmental Delay / Requires Monitoring';
  }
  if (ss >= 130) {
    return 'Suggests Highly Advanced Development';
  }
  if (ss >= 120) {
    return 'Suggests Advanced Development';
  }
  return 'Average / Normal Development';
}
