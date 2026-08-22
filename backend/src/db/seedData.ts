import { LearningNode, NodeEdge } from '../types.js';
import { validateDAG } from '../engine/graph.js';

export const SEED_NODES: LearningNode[] = [
  // Tier 1: New Business & Underwriting Operations
  {
    id: 'LA-101',
    code: 'LA-101',
    title: 'Intake & KYC Operations',
    description: 'Master policy application processing, Anti-Money Laundering (AML) checks, customer identity verification, and initial compliance clearance.',
    category: '1. New Business & Underwriting',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Know_your_customer',
    wikipediaSummary: 'Know your customer (KYC) guidelines in financial services require professionals to verify the identity, suitability, and risks involved with establishing a business relationship.',
  },
  {
    id: 'LA-102',
    code: 'LA-102',
    title: 'Medical Record (APS) Assembly & Underwriting',
    description: 'Assemble Attending Physician Statements (APS), evaluate mortality risk parameters, MIB queries, and risk classification.',
    category: '1. New Business & Underwriting',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Underwriting',
    wikipediaSummary: 'Insurance underwriting involves evaluating the risk of insuring a home, car, driver, or individual\'s health or life, determining the policy pricing and coverage terms.',
  },
  {
    id: 'LA-103',
    code: 'LA-103',
    title: 'Policy Issuance & Free-Look Management',
    description: 'Manage legal policy contract creation, delivery receipt tracking, and 10-30 day free-look cancellation refund processing.',
    category: '1. New Business & Underwriting',
    estimatedMinutes: 25,
    difficulty: 'beginner',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Free-look_period',
    wikipediaSummary: 'A free-look period is a required window in life insurance allowing contract owners to review policy terms and cancel for a 100% premium refund without penalty.',
  },

  // Tier 2: In-Force Policy Administration
  {
    id: 'LA-201',
    code: 'LA-201',
    title: 'Premium Exceptions, Grace Periods & Lapses',
    description: 'Handle premium payment exceptions, automated 31-day grace period tracking, lapse notifications, and non-forfeiture option execution.',
    category: '2. In-Force Policy Administration',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Grace_period',
    wikipediaSummary: 'A grace period allows policyholders extra time to pay past-due premiums before the contract enters lapse status or non-forfeiture processing.',
  },
  {
    id: 'LA-202',
    code: 'LA-202',
    title: 'Reinstatement Workflows & Evidence of Insurability',
    description: 'Evaluate lapsed policy reinstatement applications, back-interest calculations, and updated evidence of insurability (EOI).',
    category: '2. In-Force Policy Administration',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Reinstatement_(insurance)',
    wikipediaSummary: 'Reinstatement allows a policyholder to restore a lapsed life insurance policy within a specified timeframe by paying back-premiums plus interest and providing proof of insurability.',
  },
  {
    id: 'LA-203',
    code: 'LA-203',
    title: 'Beneficiary & Servicing Updates',
    description: 'Process primary and contingent beneficiary changes, ownership transfers, collateral assignments, and address servicing requests.',
    category: '2. In-Force Policy Administration',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Beneficiary',
    wikipediaSummary: 'A beneficiary in life insurance is the designated person or legal entity entitled to receive the death benefit payout upon the insured event.',
  },
  {
    id: 'LA-204',
    code: 'LA-204',
    title: 'Policy Loans, Collateral & Cash Surrenders',
    description: 'Process cash value loan requests, interest rate tracking, maximum loan capacity calculations, and full policy cash surrenders.',
    category: '2. In-Force Policy Administration',
    estimatedMinutes: 35,
    difficulty: 'advanced',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Cash_surrender_value',
    wikipediaSummary: 'Cash surrender value is the cash amount paid by an insurer to the policy owner upon cancellation of a permanent cash-value life insurance policy prior to maturity.',
  },

  // Tier 3: Annuity Payouts & Claims Adjudication
  {
    id: 'LA-301',
    code: 'LA-301',
    title: 'Annuitization, Income Options & Disbursements',
    description: 'Calculate single premium immediate annuity (SPIA) distributions, structured payouts, life income, joint & survivor annuity options.',
    category: '3. Annuities & Claims',
    estimatedMinutes: 40,
    difficulty: 'advanced',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Annuitization',
    wikipediaSummary: 'Annuitization is the process of converting an annuity investment account into a series of periodic income payments guaranteed for life or a fixed period.',
  },
  {
    id: 'LA-302',
    code: 'LA-302',
    title: 'Death Claims Processing & Contestability Adjudication',
    description: 'Verify proof of death documents, calculate gross death benefits, evaluate 2-year contestability period claims, and tax reporting (1099-R).',
    category: '3. Annuities & Claims',
    estimatedMinutes: 45,
    difficulty: 'advanced',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Contestability_period',
    wikipediaSummary: 'The contestability period allows life insurers to investigate claims occurring within two years of policy issuance for material misrepresentation.',
  },
  {
    id: 'LA-303',
    code: 'LA-303',
    title: 'Unclaimed Property & Regulatory Escheatment',
    description: 'Social Security Death Master File (DMF) matching, due diligence locator workflows, and state-mandated property escheatment compliance.',
    category: '3. Annuities & Claims',
    estimatedMinutes: 35,
    difficulty: 'advanced',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Escheat',
    wikipediaSummary: 'Escheat is a common law doctrine where unclaimed property or benefits transfer to state government ownership when no rightful heirs or beneficiaries can be located.',
  },

  // Tier 4: Operations & SLA Management
  {
    id: 'LA-401',
    code: 'LA-401',
    title: 'Back-Office SLA Tracking & Turnaround Time',
    description: 'Monitor turnaround time (TAT), queue bottlenecks, service level agreements (SLAs), and operational quality audit metrics.',
    category: '4. Operations & SLA Management',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Service-level_agreement',
    wikipediaSummary: 'A service-level agreement (SLA) defines the expected level of service between a service provider and customer, detailing turnaround metrics and quality thresholds.',
  },
  {
    id: 'LA-402',
    code: 'LA-402',
    title: 'High-Volume Straight-Through Processing (STP)',
    description: 'Integrate automated optical character recognition (OCR), auto-adjudication rules, API integrations, and straight-through processing rates.',
    category: '4. Operations & SLA Management',
    estimatedMinutes: 45,
    difficulty: 'advanced',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Straight-through_processing',
    wikipediaSummary: 'Straight-through processing (STP) allows financial and insurance transactions to be processed electronically from end-to-end without manual intervention.',
  },
];

export const SEED_EDGES: NodeEdge[] = [
  // Tier 1 -> Tier 2
  { parentNodeId: 'LA-101', childNodeId: 'LA-102' },
  { parentNodeId: 'LA-101', childNodeId: 'LA-103' },
  { parentNodeId: 'LA-102', childNodeId: 'LA-201' },
  { parentNodeId: 'LA-103', childNodeId: 'LA-201' },
  { parentNodeId: 'LA-101', childNodeId: 'LA-203' },

  // Tier 2 internal & Tier 2 -> Tier 3
  { parentNodeId: 'LA-201', childNodeId: 'LA-202' },
  { parentNodeId: 'LA-201', childNodeId: 'LA-204' },
  { parentNodeId: 'LA-203', childNodeId: 'LA-301' },
  { parentNodeId: 'LA-204', childNodeId: 'LA-301' },
  { parentNodeId: 'LA-202', childNodeId: 'LA-302' },

  // Tier 3 internal & Tier 3 -> Tier 4
  { parentNodeId: 'LA-301', childNodeId: 'LA-302' },
  { parentNodeId: 'LA-302', childNodeId: 'LA-303' },
  { parentNodeId: 'LA-302', childNodeId: 'LA-401' },
  { parentNodeId: 'LA-303', childNodeId: 'LA-402' },

  // Tier 4 convergence
  { parentNodeId: 'LA-401', childNodeId: 'LA-402' },
];

/**
 * Self-correcting seed DAG validation.
 */
export function getValidatedSeedData() {
  const result = validateDAG(SEED_NODES, SEED_EDGES);
  if (result.hasCycle) {
    console.error('🚨 CYCLIC DEPENDENCY DETECTED IN SEED DATA!', result.cyclePath);
    throw new Error(`Knowledge Graph seed data contains a cycle path: ${result.cyclePath?.join(' -> ')}`);
  }
  return { nodes: SEED_NODES, edges: SEED_EDGES };
}
