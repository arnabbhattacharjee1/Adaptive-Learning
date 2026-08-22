import { LearningNode, UserNodeState } from '../types.js';

export interface DynamicQuizQuestion {
  id: string;
  question: string;
  options: Array<{ id: number; text: string; isCorrect: boolean }>;
  explanation: string;
}

export interface GeneratedModuleContent {
  nodeId: string;
  title: string;
  overview: string;
  keyTakeaways: string[];
  adaptiveContext: 'standard' | 'remediation' | 'reinforcement';
  quiz: DynamicQuizQuestion;
}

/**
 * Dynamic Content Generation Engine for L&A Insurance Back-Office Operations.
 * Provides unique, topic-specific questions and explanations for every module.
 */
export function generateDynamicModuleContent(
  node: LearningNode,
  userState?: UserNodeState
): GeneratedModuleContent {
  const status = userState?.status || 'available';
  const isRemediation = status === 'remediation';
  const isReinforcement = status === 'reinforcement';

  const adaptiveContext = isRemediation ? 'remediation' : isReinforcement ? 'reinforcement' : 'standard';

  let overview = node.description;
  let keyTakeaways = [
    `Understand legal compliance and regulatory requirements for ${node.title}.`,
    `Execute accurate operational workflows across ${node.category}.`,
    `Optimize turnaround time while minimizing financial and legal risk.`,
  ];

  if (isRemediation) {
    overview = `[Remediation Review] ${node.description} Let's review the fundamental insurance contract rules and step-by-step back-office procedures to reinforce your understanding.`;
    keyTakeaways = [
      `Review prerequisite statutory guidelines and policy contract clauses.`,
      `Verify document assembly and audit trail verification steps.`,
      `Identify risk factors before final manager sign-off.`,
    ];
  } else if (isReinforcement) {
    overview = `[Lateral Reinforcement] Excellent performance on ${node.title}! Let's apply these operations to high-volume enterprise portfolio exceptions and regulatory audits.`;
    keyTakeaways = [
      `Analyze complex edge-case applications across multiple state jurisdictions.`,
      `Synthesize automated STP validation rules for enterprise back-office scaling.`,
      `Evaluate audit trails for state insurance commissioner examinations.`,
    ];
  }

  const quiz = generateUniqueInsuranceQuiz(node, adaptiveContext);

  return {
    nodeId: node.id,
    title: node.title,
    overview,
    keyTakeaways,
    adaptiveContext,
    quiz,
  };
}

function generateUniqueInsuranceQuiz(node: LearningNode, context: string): DynamicQuizQuestion {
  // 1. Module-Specific Question Knowledge Base
  const uniqueQuizzes: Record<string, { standard: DynamicQuizQuestion; remediation: DynamicQuizQuestion; reinforcement: DynamicQuizQuestion }> = {
    'LA-101': {
      standard: {
        id: 'quiz-LA-101-std',
        question: 'During initial Intake & KYC processing, an applicant\'s SSN triggers a hit on the OFAC Sanctions list. What is the required back-office action?',
        options: [
          { id: 0, text: 'Issue the policy immediately and request clarification later', isCorrect: false },
          { id: 1, text: 'Freeze processing immediately, notify Anti-Money Laundering (AML) Compliance, and file an SAR', isCorrect: true },
          { id: 2, text: 'Cancel the application and refund the premium without logging an audit record', isCorrect: false },
        ],
        explanation: 'OFAC hits require immediate transaction freezing and mandatory reporting to AML Compliance. Issuing or refunding without reporting violates federal banking and insurance regulations.',
      },
      remediation: {
        id: 'quiz-LA-101-rem',
        question: '[Remediation] What is the primary purpose of Know Your Customer (KYC) verification in life insurance intake?',
        options: [
          { id: 0, text: 'To calculate premium interest rates', isCorrect: false },
          { id: 1, text: 'To verify applicant identity and prevent money laundering and identity fraud', isCorrect: true },
          { id: 2, text: 'To determine policy beneficiary tax brackets', isCorrect: false },
        ],
        explanation: 'KYC establishes verified customer identity and guards financial institutions against illicit money laundering activities.',
      },
      reinforcement: {
        id: 'quiz-LA-101-reinf',
        question: '[Reinforcement] How should enterprise intake pipelines handle high-volume KYC identity verification discrepancies across multiple state databases?',
        options: [
          { id: 0, text: 'Auto-approve any match with at least 50% name similarity', isCorrect: false },
          { id: 1, text: 'Route identity discrepancies to secondary manual verification queues while logging immutable audit timestamps', isCorrect: true },
          { id: 2, text: 'Discard applications that do not match on the first automated query', isCorrect: false },
        ],
        explanation: 'Secondary verification queues prevent false rejections while preserving regulatory compliance and audit logs.',
      },
    },

    'LA-102': {
      standard: {
        id: 'quiz-LA-102-std',
        question: 'An Attending Physician Statement (APS) reveals an undisclosed cardiovascular condition during medical underwriting. How is the policy risk classified?',
        options: [
          { id: 0, text: 'Issue at Preferred Best rates', isCorrect: false },
          { id: 1, text: 'Assess substandard debit table rating or issue with medical premium surcharge', isCorrect: true },
          { id: 2, text: 'Transfer policy ownership to the attending physician', isCorrect: false },
        ],
        explanation: 'Uncovered medical impairments incur substandard table ratings or flat extra premiums to offset elevated mortality risk.',
      },
      remediation: {
        id: 'quiz-LA-102-rem',
        question: '[Remediation] What does an Attending Physician Statement (APS) provide to the medical underwriting team?',
        options: [
          { id: 0, text: 'A summary of the applicant\'s credit rating', isCorrect: false },
          { id: 1, text: 'Official clinical records and diagnosis history from the applicant\'s treating physician', isCorrect: true },
          { id: 2, text: 'A list of potential policy beneficiaries', isCorrect: false },
        ],
        explanation: 'APS documents contain authoritative medical diagnostic records required to evaluate mortality risk.',
      },
      reinforcement: {
        id: 'quiz-LA-102-reinf',
        question: '[Reinforcement] How do automated MIB (Medical Information Bureau) query checks integrate into underwriter decision trees?',
        options: [
          { id: 0, text: 'MIB codes replace the need for physician statements entirely', isCorrect: false },
          { id: 1, text: 'MIB codes alert underwriters to medical impairment histories reported by other insurers for cross-validation', isCorrect: true },
          { id: 2, text: 'MIB queries automatically set policy dividend rates', isCorrect: false },
        ],
        explanation: 'MIB alerts highlight prior reported medical conditions, ensuring underwriters cross-check disclosures accurately.',
      },
    },

    'LA-103': {
      standard: {
        id: 'quiz-LA-103-std',
        question: 'A policy owner submits a written cancellation request 14 days after policy delivery during a 20-day Free-Look Period. What refund is mandated?',
        options: [
          { id: 0, text: 'Refund 50% of the premium paid minus administrative fees', isCorrect: false },
          { id: 1, text: 'Refund 100% of all premiums paid without deduction', isCorrect: true },
          { id: 2, text: 'Deny the refund because the policy was already issued', isCorrect: false },
        ],
        explanation: 'Statutory free-look provisions mandate a full 100% refund of all premiums paid if requested within the state-defined window.',
      },
      remediation: {
        id: 'quiz-LA-103-rem',
        question: '[Remediation] What is the legal definition of the Free-Look Period in life insurance contracts?',
        options: [
          { id: 0, text: 'A trial period during which coverage is free of charge', isCorrect: false },
          { id: 1, text: 'A statutory timeframe allowing the policy owner to inspect the policy and cancel for a full refund', isCorrect: true },
          { id: 2, text: 'The timeframe before a policy loan becomes due', isCorrect: false },
        ],
        explanation: 'The free-look period gives policy owners an unconditional right to inspect and return the policy for a complete refund.',
      },
      reinforcement: {
        id: 'quiz-LA-103-reinf',
        question: '[Reinforcement] If a policy owner cancels during the free-look period on a Variable Life Insurance policy, how is the refund calculated in states adopting NAIC model law?',
        options: [
          { id: 0, text: 'Always 100% gross premium regardless of market performance', isCorrect: false },
          { id: 1, text: 'Depending on state regulations, either gross premiums paid or contract account value plus waived fees', isCorrect: true },
          { id: 2, text: 'No refund is permitted for variable investment products', isCorrect: false },
        ],
        explanation: 'State laws vary for variable products: some mandate full gross premium return while others refund current market account value.',
      },
    },

    'LA-201': {
      standard: {
        id: 'quiz-LA-201-std',
        question: 'A policy premium remains unpaid 25 days past the due date. What is the current operational status of the policy contract?',
        options: [
          { id: 0, text: 'Lapsed and terminated without benefit', isCorrect: false },
          { id: 1, text: 'Active within the 31-day statutory Grace Period with full death benefit coverage', isCorrect: true },
          { id: 2, text: 'Escheated to the state Department of Revenue', isCorrect: false },
        ],
        explanation: 'During the 31-day grace period, coverage remains fully in effect. If death occurs during grace, the unpaid premium is deducted from the benefit payout.',
      },
      remediation: {
        id: 'quiz-LA-201-rem',
        question: '[Remediation] What happens if a premium payment is not received before the 31-day grace period expires on a cash-value policy?',
        options: [
          { id: 0, text: 'The policy immediately lapses or executes Automatic Premium Loan (APL) / Non-forfeiture provisions', isCorrect: true },
          { id: 1, text: 'The insurer doubles the face amount automatically', isCorrect: false },
          { id: 2, text: 'The contract is referred to law enforcement', isCorrect: false },
        ],
        explanation: 'When grace expires, the contract lapses unless non-forfeiture options or Automatic Premium Loans (APL) cover the premium.',
      },
      reinforcement: {
        id: 'quiz-LA-201-reinf',
        question: '[Reinforcement] How does an Automatic Premium Loan (APL) clause protect a policyholder upon grace period expiration?',
        options: [
          { id: 0, text: 'It forgives the unpaid premium permanently', isCorrect: false },
          { id: 1, text: 'It automatically borrows against available cash value to pay the overdue premium and keep the policy active', isCorrect: true },
          { id: 2, text: 'It converts the policy to a term policy without interest', isCorrect: false },
        ],
        explanation: 'APL uses accumulated cash value to pay overdue premiums automatically, preventing unintentional policy lapses.',
      },
    },

    'LA-202': {
      standard: {
        id: 'quiz-LA-202-std',
        question: 'A policyholder applies to reinstate a policy that lapsed 18 months ago. What two key statutory conditions must be satisfied?',
        options: [
          { id: 0, text: 'Payment of current month premium only and change of beneficiary', isCorrect: false },
          { id: 1, text: 'Payment of all back-premiums plus interest and satisfactory Evidence of Insurability (EOI)', isCorrect: true },
          { id: 2, text: 'Surrender of all previous cash value and agreement to a lower face amount', isCorrect: false },
        ],
        explanation: 'Reinstatement requires curing overdue financial obligations (back-premiums + interest) and proving current insurability (EOI).',
      },
      remediation: {
        id: 'quiz-LA-202-rem',
        question: '[Remediation] Why is Evidence of Insurability (EOI) required for policy reinstatement after a lapse?',
        options: [
          { id: 0, text: 'To verify the policyholder\'s home address', isCorrect: false },
          { id: 1, text: 'To ensure the insured has not developed severe uninsurable health conditions since the lapse', isCorrect: true },
          { id: 2, text: 'To lower the policy face value', isCorrect: false },
        ],
        explanation: 'EOI prevents adverse selection by confirming the insured still meets underwriting risk standards.',
      },
      reinforcement: {
        id: 'quiz-LA-202-reinf',
        question: '[Reinforcement] What is the legal effect of policy reinstatement on the contract\'s 2-year Contestability Period?',
        options: [
          { id: 0, text: 'The contestability period is eliminated forever', isCorrect: false },
          { id: 1, text: 'A new 2-year contestability period applies specifically to statements made in the reinstatement application', isCorrect: true },
          { id: 2, text: 'The contestability period extends to 10 years', isCorrect: false },
        ],
        explanation: 'Reinstatement restarts a 2-year contestability window specifically regarding information provided on the reinstatement request.',
      },
    },

    'LA-203': {
      standard: {
        id: 'quiz-LA-203-std',
        question: 'A policy owner requests to change an Irrevocable Beneficiary. What authorization is legally required?',
        options: [
          { id: 0, text: 'The policy owner\'s signature alone is sufficient', isCorrect: false },
          { id: 1, text: 'Written consent and signature of the current Irrevocable Beneficiary', isCorrect: true },
          { id: 2, text: 'Approval from the state Insurance Commissioner', isCorrect: false },
        ],
        explanation: 'Irrevocable beneficiaries hold vested contractual rights. Their written consent is mandatory for any beneficiary or ownership change.',
      },
      remediation: {
        id: 'quiz-LA-203-rem',
        question: '[Remediation] What is the operational difference between a Revocable and Irrevocable Beneficiary?',
        options: [
          { id: 0, text: 'Revocable beneficiaries receive payouts in cash, irrevocable in checks', isCorrect: false },
          { id: 1, text: 'Revocable beneficiaries can be changed at any time by the owner; irrevocable beneficiaries require written consent to change', isCorrect: true },
          { id: 2, text: 'Irrevocable beneficiaries cannot be family members', isCorrect: false },
        ],
        explanation: 'Revocable designations allow the owner total freedom to change beneficiaries without third-party approval.',
      },
      reinforcement: {
        id: 'quiz-LA-203-reinf',
        question: '[Reinforcement] How does a Collateral Assignment to a commercial lender impact death claim payout distribution?',
        options: [
          { id: 0, text: 'The lender receives 100% of the death benefit regardless of debt balance', isCorrect: false },
          { id: 1, text: 'The lender is paid first up to the outstanding debt balance; remaining proceeds go to designated beneficiaries', isCorrect: true },
          { id: 2, text: 'The assignment voids the death benefit policy contract', isCorrect: false },
        ],
        explanation: 'Collateral assignment prioritizes the lender\'s verified debt balance first, distributing remaining proceeds to beneficiaries.',
      },
    },

    'LA-204': {
      standard: {
        id: 'quiz-LA-204-std',
        question: 'A policy owner requests full Cash Surrender on a $100,000 policy with $30,000 cash value, $5,000 surrender penalty, and $8,000 loan balance. What is the net payout?',
        options: [
          { id: 0, text: '$30,000', isCorrect: false },
          { id: 1, text: '$17,000 ($30,000 - $5,000 - $8,000)', isCorrect: true },
          { id: 2, text: '$22,000 ($30,000 - $8,000)', isCorrect: false },
        ],
        explanation: 'Net Cash Surrender Value = Account Cash Value ($30k) minus Surrender Charges ($5k) minus Outstanding Loan Principal & Interest ($8k) = $17,000.',
      },
      remediation: {
        id: 'quiz-LA-204-rem',
        question: '[Remediation] What happens to policy death benefits if a policy loan remains unpaid at the time of the insured\'s death?',
        options: [
          { id: 0, text: 'The death benefit is completely forfeited', isCorrect: false },
          { id: 1, text: 'The outstanding loan principal and interest are deducted from the gross death benefit payout', isCorrect: true },
          { id: 2, text: 'The insurer sues the beneficiary for loan repayment', isCorrect: false },
        ],
        explanation: 'Policy loans act as advances against cash values; unpaid balances are deducted from final death claim proceeds.',
      },
      reinforcement: {
        id: 'quiz-LA-204-reinf',
        question: '[Reinforcement] What critical risk occurs if outstanding policy loan interest causes total debt to exceed accumulated account cash value?',
        options: [
          { id: 0, text: 'The insurer converts the policy into a mutual fund', isCorrect: false },
          { id: 1, text: 'The policy enters loan lapse status, triggering tax liabilities on gains if not cured within 31 days', isCorrect: true },
          { id: 2, text: 'The interest rate automatically drops to 0%', isCorrect: false },
        ],
        explanation: 'Excess loan debt causes policy termination and potentially severe taxable income events on previously untaxed gains.',
      },
    },

    'LA-301': {
      standard: {
        id: 'quiz-LA-301-std',
        question: 'An annuitant selects a "Life with 10-Year Period Certain" income option and passes away after 4 years of payouts. What happens to remaining payments?',
        options: [
          { id: 0, text: 'Payouts cease immediately with zero refund', isCorrect: false },
          { id: 1, text: 'Payments continue to the designated beneficiary for the remaining 6 years', isCorrect: true },
          { id: 2, text: 'The remaining 6 years are paid double to the state treasury', isCorrect: false },
        ],
        explanation: 'Period Certain guarantees payouts for a minimum term (10 years). If death occurs in year 4, 6 remaining years must be paid to the beneficiary.',
      },
      remediation: {
        id: 'quiz-LA-301-rem',
        question: '[Remediation] What is the core definition of Annuitization in life & annuity administration?',
        options: [
          { id: 0, text: 'Depositing monthly premiums into a savings account', isCorrect: false },
          { id: 1, text: 'Converting an accumulated account value into a guaranteed series of periodic income payments', isCorrect: true },
          { id: 2, text: 'Cancelling an annuity contract for immediate cash', isCorrect: false },
        ],
        explanation: 'Annuitization converts accumulation cash values into stream-of-income distribution payments.',
      },
      reinforcement: {
        id: 'quiz-LA-301-reinf',
        question: '[Reinforcement] How does a "Joint and 100% Survivor" annuity option differ from a "Straight Life Single Annuitant" option in monthly payout calculation?',
        options: [
          { id: 0, text: 'Joint & Survivor option provides higher monthly payments due to shorter risk', isCorrect: false },
          { id: 1, text: 'Joint & Survivor provides lower initial monthly payments because coverage spans two combined life expectancies', isCorrect: true },
          { id: 2, text: 'Payout amounts are identical regardless of payout option', isCorrect: false },
        ],
        explanation: 'Spanning two lives increases total expected payout duration, resulting in lower calculated monthly payment figures.',
      },
    },

    'LA-302': {
      standard: {
        id: 'quiz-LA-302-std',
        question: 'A death claim occurs 14 months after policy issuance. Medical records reveal material misrepresentation of tobacco use on the application. What is the claim outcome?',
        options: [
          { id: 0, text: 'Pay 100% of death benefit regardless of application fraud', isCorrect: false },
          { id: 1, text: 'Rescind contract within 2-year Contestability Period, deny death claim, and refund premiums paid', isCorrect: true },
          { id: 2, text: 'Pay double indemnity death benefits', isCorrect: false },
        ],
        explanation: 'Within the 2-year contestability window, material misrepresentation allows the insurer to rescind the contract and refund premiums in lieu of death benefit.',
      },
      remediation: {
        id: 'quiz-LA-302-rem',
        question: '[Remediation] What document is required as primary legal proof before a death claim can be adjudicated?',
        options: [
          { id: 0, text: 'The insured\'s driver\'s license copy', isCorrect: false },
          { id: 1, text: 'A certified copy of the Official Death Certificate stating cause of death', isCorrect: true },
          { id: 2, text: 'A bank statement from the beneficiary', isCorrect: false },
        ],
        explanation: 'A certified death certificate is the mandatory legal document required to establish proof of death and initiate claim adjudication.',
      },
      reinforcement: {
        id: 'quiz-LA-302-reinf',
        question: '[Reinforcement] How are IRS Form 1099-R tax reporting obligations handled for death benefits versus annuity income payouts?',
        options: [
          { id: 0, text: 'Both lump-sum death benefits and annuity earnings are 100% taxable as ordinary income', isCorrect: false },
          { id: 1, text: 'Lump-sum life insurance death benefits are generally income-tax free (1099-R gross), whereas annuity growth earnings are taxable', isCorrect: true },
          { id: 2, text: 'Neither life insurance benefits nor annuity payouts require 1099-R filings', isCorrect: false },
        ],
        explanation: 'IRC Sec. 101(a) excludes life insurance death proceeds from gross income, while annuity interest earnings are taxable under Sec. 72.',
      },
    },

    'LA-303': {
      standard: {
        id: 'quiz-LA-303-std',
        question: 'A Death Master File (DMF) query matches an insured record, but beneficiaries cannot be located after 3-5 years of mandated due diligence. What regulatory step is required?',
        options: [
          { id: 0, text: 'Transfer proceeds into executive bonus reserves', isCorrect: false },
          { id: 1, text: 'Escheat unclaimed policy proceeds to the state treasury of the policyholder\'s last known address', isCorrect: true },
          { id: 2, text: 'Cancel the death benefit obligation permanently', isCorrect: false },
        ],
        explanation: 'State Unclaimed Property laws mandate escheatment of unclaimed life proceeds to the appropriate state treasury after required search periods.',
      },
      remediation: {
        id: 'quiz-LA-303-rem',
        question: '[Remediation] What is the purpose of Social Security Death Master File (DMF) matching in life insurance operations?',
        options: [
          { id: 0, text: 'To collect unpaid credit card debts', isCorrect: false },
          { id: 1, text: 'To proactively identify deceased policyholders whose beneficiaries have not filed a claim', isCorrect: true },
          { id: 2, text: 'To check applicant credit scores', isCorrect: false },
        ],
        explanation: 'DMF matching ensures insurers proactively locate beneficiaries of deceased insureds rather than waiting indefinitely for claims.',
      },
      reinforcement: {
        id: 'quiz-LA-303-reinf',
        question: '[Reinforcement] Under the NCOIL Unclaimed Life Insurance Benefits Model Act, what operational frequency is required for DMF database matching?',
        options: [
          { id: 0, text: 'Once every 10 years', isCorrect: false },
          { id: 1, text: 'Semi-annually or quarterly comparison of all in-force policies against the complete DMF database', isCorrect: true },
          { id: 2, text: 'Only when a physical written claim is received', isCorrect: false },
        ],
        explanation: 'Model state legislation requires regular (semi-annual/quarterly) automated cross-matching of in-force records against the DMF database.',
      },
    },

    'LA-401': {
      standard: {
        id: 'quiz-LA-401-std',
        question: 'Back-office turnaround time (TAT) for policy reinstatements rises from 3 days to 14 days due to medical records bottleneck. What operational SLA metric is breached?',
        options: [
          { id: 0, text: 'Loss Ratio Threshold', isCorrect: false },
          { id: 1, text: 'Service Level Agreement (SLA) Processing Window / Turnaround Time Target', isCorrect: true },
          { id: 2, text: 'Gross Premium Reserve Capital', isCorrect: false },
        ],
        explanation: 'TAT breaches directly violate processing window SLAs established for policyholder servicing and regulatory compliance.',
      },
      remediation: {
        id: 'quiz-LA-401-rem',
        question: '[Remediation] Why is back-office SLA tracking critical in life insurance operations?',
        options: [
          { id: 0, text: 'To eliminate the need for customer service representatives', isCorrect: false },
          { id: 1, text: 'To ensure timely processing, avoid regulatory fines, and maintain customer satisfaction standards', isCorrect: true },
          { id: 2, text: 'To increase policy loan interest rates', isCorrect: false },
        ],
        explanation: 'SLA monitoring guarantees operational compliance timelines and prevents customer service backlogs.',
      },
      reinforcement: {
        id: 'quiz-LA-401-reinf',
        question: '[Reinforcement] How should operations management reallocate back-office queue resources when claim volume spikes 300% following a regional catastrophe?',
        options: [
          { id: 0, text: 'Shut down all operations until queues clear naturally', isCorrect: false },
          { id: 1, text: 'Dynamically reassign cross-trained underwriters and administrators to fast-track claim triage queues', isCorrect: true },
          { id: 2, text: 'Deny 50% of claims automatically to reduce queue size', isCorrect: false },
        ],
        explanation: 'Cross-functional resource allocation enables operational elasticity during unexpected claim volume spikes.',
      },
    },

    'LA-402': {
      standard: {
        id: 'quiz-LA-402-std',
        question: 'An automated Straight-Through Processing (STP) engine evaluates a term life application ($250k face amount, clean KYC, standard BMI, no APS red flags). What is the automated outcome?',
        options: [
          { id: 0, text: 'Route to senior medical underwriter for manual review', isCorrect: false },
          { id: 1, text: 'Auto-approve and issue policy contract instantaneously without human intervention', isCorrect: true },
          { id: 2, text: 'Decline application due to lack of manual signature', isCorrect: false },
        ],
        explanation: 'Clean applications meeting all automated rules-engine criteria achieve Straight-Through Processing (STP) auto-issuance.',
      },
      remediation: {
        id: 'quiz-LA-402-rem',
        question: '[Remediation] What is the core definition of Straight-Through Processing (STP) in back-office operations?',
        options: [
          { id: 0, text: 'Manually typing paper applications into a database', isCorrect: false },
          { id: 1, text: 'End-to-end automated processing of transactions without manual human intervention', isCorrect: true },
          { id: 2, text: 'Mailing paper policy documents via certified mail', isCorrect: false },
        ],
        explanation: 'STP automates workflow execution from intake to issuance or payout without requiring human manual entry.',
      },
      reinforcement: {
        id: 'quiz-LA-402-reinf',
        question: '[Reinforcement] What fallback mechanism must be designed into high-volume STP engines to prevent systemic underwriting errors?',
        options: [
          { id: 0, text: 'Disable all error logging to maximize speed', isCorrect: false },
          { id: 1, text: 'Automated exception handling queues that kick out non-conforming applications for specialist review', isCorrect: true },
          { id: 2, text: 'Automatically approve all rejected applications after 24 hours', isCorrect: false },
        ],
        explanation: 'Exception handling safety nets ensure non-standard or risky transactions exit automated pipelines for human underwriting oversight.',
      },
    },
  };

  const quizSet = uniqueQuizzes[node.id] || {
    standard: {
      id: `quiz-${node.id}-std`,
      question: `What is the primary operational requirement when executing ${node.title}?`,
      options: [
        { id: 0, text: 'Delay processing to maximize float', isCorrect: false },
        { id: 1, text: `Ensure accurate policy contract administration and compliance for ${node.category}`, isCorrect: true },
        { id: 2, text: 'Eliminate statutory recordkeeping', isCorrect: false },
      ],
      explanation: `Operational accuracy and compliance protect policyholders in ${node.category}.`,
    },
    remediation: {
      id: `quiz-${node.id}-rem`,
      question: `[Remediation Review] In ${node.title}, what procedure ensures legal compliance?`,
      options: [
        { id: 0, text: 'Bypass verification to meet speed targets', isCorrect: false },
        { id: 1, text: 'Verify audit trails, statutory guidelines, and policy contract clauses', isCorrect: true },
        { id: 2, text: 'Cancel policy contracts without notice', isCorrect: false },
      ],
      explanation: 'Statutory compliance requires adherence to contract terms and verifiable audit trails.',
    },
    reinforcement: {
      id: `quiz-${node.id}-reinf`,
      question: `[Reinforcement] How does operations optimize ${node.title} for enterprise scaling?`,
      options: [
        { id: 0, text: 'Disable error logging', isCorrect: false },
        { id: 1, text: 'Implement Straight-Through Processing (STP) rules with exception queues for complex cases', isCorrect: true },
        { id: 2, text: 'Require manual two-person sign-off on 100% of routine items', isCorrect: false },
      ],
      explanation: 'STP auto-adjudicates routine transactions while routing exceptions to specialists.',
    },
  };

  if (context === 'remediation') return quizSet.remediation;
  if (context === 'reinforcement') return quizSet.reinforcement;
  return quizSet.standard;
}
