export interface AptitudeSeedItem {
  category: 'Quantitative Aptitude' | 'Logical Reasoning' | 'Verbal Ability' | 'Data Interpretation';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  tags: string[];
}

export const APTITUDE_BANK: AptitudeSeedItem[] = [
  // ── Quantitative Aptitude ────────────────────────────────────────────────
  {
    category: 'Quantitative Aptitude',
    difficulty: 'easy',
    question: 'A train 180 meters long is traveling at a speed of 54 km/h. How many seconds will it take to pass an electric pole?',
    options: ['10 seconds', '12 seconds', '15 seconds', '18 seconds'],
    correct_index: 1,
    explanation: 'Speed = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 180 / 15 = 12 seconds.',
    tags: ['speed', 'distance', 'trains'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'medium',
    question: 'Two pipes A and B can fill a reservoir in 15 hours and 20 hours respectively. If both pipes are opened simultaneously, how much time will it take to fill the reservoir?',
    options: ['7.5 hours', '8.57 hours', '9.2 hours', '10 hours'],
    correct_index: 1,
    explanation: 'Combined rate = (1/15) + (1/20) = 7/60. Time taken = 60/7 ≈ 8.57 hours.',
    tags: ['pipes-cisterns', 'time-work'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'hard',
    question: 'In how many different ways can the letters of the word "ENGINEERING" be arranged such that all 3 E\'s are always together?',
    options: ['30,240', '60,480', '15,120', '120,960'],
    correct_index: 2,
    explanation: 'Treat the 3 E\'s as 1 unit. Total units = 9. Arrangements = 9! / (3! * 2! * 2!) = 15,120.',
    tags: ['permutations', 'combinatorics'],
  },
  {
    category: 'Quantitative Aptitude',
    difficulty: 'medium',
    question: 'A sum of money invested at compound interest doubles itself in 4 years. In how many years will it become 8 times of itself at the same rate?',
    options: ['8 years', '12 years', '16 years', '20 years'],
    correct_index: 1,
    explanation: 'Since it doubles in 4 years, to become 8 times (2^3), it will take 3 * 4 = 12 years.',
    tags: ['finance', 'compound-interest'],
  },

  // ── Logical Reasoning ────────────────────────────────────────────────────
  {
    category: 'Logical Reasoning',
    difficulty: 'easy',
    question: 'Find the missing number in the sequence: 4, 9, 19, 39, 79, ?',
    options: ['149', '159', '169', '179'],
    correct_index: 1,
    explanation: 'Pattern: (previous number * 2) + 1. (79 * 2) + 1 = 159.',
    tags: ['number-series', 'pattern-recognition'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'medium',
    question: 'At what angle are the hands of a clock inclined when the time is 4:40 PM?',
    options: ['90°', '100°', '110°', '120°'],
    correct_index: 1,
    explanation: 'Angle = |(30 * H) - (11/2 * M)| = |(30 * 4) - (11/2 * 40)| = |120 - 220| = 100°.',
    tags: ['clock-angles', 'geometry'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'hard',
    question: 'Six colleagues (A, B, C, D, E, F) sit around a circular table facing the center. A sits second to the left of D. B sits adjacent to D. E sits opposite to A. C does not sit next to D. Who sits between A and B?',
    options: ['C', 'F', 'D', 'E'],
    correct_index: 1,
    explanation: 'The clockwise circular order is A, F, B, D, E, C. Thus, F sits between A and B.',
    tags: ['seating-arrangement', 'puzzle'],
  },
  {
    category: 'Logical Reasoning',
    difficulty: 'medium',
    question: 'If "CLOUD" is coded as "ENQWF", how is "SOLAR" coded in the same cipher language?',
    options: ['UQNDT', 'UQNCT', 'VRODU', 'TPMBS'],
    correct_index: 1,
    explanation: 'Shift each letter by +2 positions in the alphabet: S->U, O->Q, L->N, A->C, R->T. So, "UQNCT".',
    tags: ['coding-decoding', 'ciphers'],
  },

  // ── Verbal Ability ───────────────────────────────────────────────────────
  {
    category: 'Verbal Ability',
    difficulty: 'easy',
    question: 'Select the word that is most nearly OPPOSITE in meaning to "PRAGMATIC".',
    options: ['Realistic', 'Idealistic', 'Practical', 'Logical'],
    correct_index: 1,
    explanation: 'Pragmatic means being realistic and practical. The opposite is idealistic.',
    tags: ['vocabulary', 'antonyms'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'medium',
    question: 'Identify the sentence with the correct grammatical subject-verb agreement.',
    options: [
      'Neither the backend microservices nor the database were corrupted.',
      'Neither the backend microservices nor the database was corrupted.',
      'Neither the backend microservices or the database were corrupted.',
      'Neither of the systems have failed the health check.',
    ],
    correct_index: 1,
    explanation: 'In a "neither... nor" structure, the verb agrees with the subject closest to it ("the database" is singular -> "was").',
    tags: ['grammar', 'subject-verb-agreement'],
  },
  {
    category: 'Verbal Ability',
    difficulty: 'hard',
    question: 'Identify the rhetorical fallacy in this statement: "If we don\'t rewrite our entire frontend monolith in Rust this quarter, our company will inevitably lose all our enterprise contracts and go bankrupt."',
    options: ['Straw Man', 'Ad Hominem', 'False Dilemma / Slippery Slope', 'Red Herring'],
    correct_index: 2,
    explanation: 'The statement asserts an extreme, catastrophic sequence of events without realistic causation (Slippery Slope).',
    tags: ['critical-thinking', 'logical-fallacies'],
  },

  // ── Data Interpretation ──────────────────────────────────────────────────
  {
    category: 'Data Interpretation',
    difficulty: 'easy',
    question: 'A company\'s engineering headcount across 4 quarters is: Q1: 120, Q2: 150, Q3: 180, Q4: 210. What is the percentage growth in headcount from Q1 to Q4?',
    options: ['50%', '65%', '75%', '80%'],
    correct_index: 2,
    explanation: 'Growth = ((210 - 120) / 120) * 100 = 75%.',
    tags: ['headcount', 'percentage-growth'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'medium',
    question: 'A SaaS platform logs daily API requests (in millions): Mon: 40, Tue: 48, Wed: 52, Thu: 60, Fri: 70, Sat: 30, Sun: 20. What is the average weekday (Mon-Fri) API request volume?',
    options: ['50 Million', '54 Million', '56 Million', '60 Million'],
    correct_index: 1,
    explanation: 'Weekday total = 40+48+52+60+70 = 270. Average = 270 / 5 = 54 Million.',
    tags: ['averages', 'statistics'],
  },
  {
    category: 'Data Interpretation',
    difficulty: 'hard',
    question: 'In a candidate assessment batch of 500 applicants: 320 passed Quantitative Aptitude, 300 passed Coding, and 80 failed both. How many candidates passed BOTH?',
    options: ['160', '180', '200', '220'],
    correct_index: 2,
    explanation: 'Passed at least one = 500 - 80 = 420. Both = 320 + 300 - 420 = 200.',
    tags: ['set-theory', 'venn-diagrams'],
  },
];
