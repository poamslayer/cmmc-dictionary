/*
  PLACEHOLDER DATA
  This module stands in for the content collection until the data layer lands.
  It exposes exactly one named export, `requirements`, so the route can swap the
  import for the real collection query without touching anything else. The
  entries are hand-written samples and are not corpus content.
*/

export interface Claim {
  text: string;          // may contain <strong> and <code>, already escaped and safe
  objectives: string[];  // e.g. ["a", "c"]. May be empty.
}

export interface Objective {
  letter: string;        // "a" .. "p"
  text: string;
}

export interface Requirement {
  id: string;            // "3.1.1"
  family: string;        // "AC" .. "SI", one of 14
  title: string;         // "Authorized Access Control"
  points: string;        // "1" | "3" | "5" | "3 or 5"   NEVER a number
  poam_eligible: boolean;
  confidence: 'high' | 'medium' | 'low';
  requirement: string;   // the quoted regulation text
  objectives: Objective[];
  sections: {
    Sufficient: Claim[];
    Insufficient: Claim[];
    'Over-engineering': Claim[];
    'Edge cases': Claim[];
    'Evidence examples': Claim[];
  };
  related: string[];         // ["3.1.2", "3.5.3"]
  public_sources: string[];  // "NIST SP 800-171A, 3.1.1: https://csrc.nist.gov/pubs/sp/800/171/a/final"
}

export const requirements: Requirement[] = [
  {
    id: '3.1.1',
    family: 'AC',
    title: 'Authorized Access Control',
    points: '5',
    poam_eligible: false,
    confidence: 'high',
    requirement:
      'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).',
    objectives: [
      { letter: 'a', text: 'Authorized users are identified.' },
      { letter: 'b', text: 'Processes acting on behalf of authorized users are identified.' },
      { letter: 'c', text: 'Devices (and other systems) authorized to connect to the system are identified.' },
      { letter: 'd', text: 'System access is limited to authorized users.' },
      { letter: 'e', text: 'System access is limited to processes acting on behalf of authorized users.' },
      { letter: 'f', text: 'System access is limited to authorized devices (including other systems).' },
    ],
    sections: {
      Sufficient: [
        {
          text: 'A maintained list of every account in the CUI enclave, each one tied to a named person and an approval record, with a quarterly review that shows who was removed and when.',
          objectives: ['a', 'd'],
        },
        {
          text: 'Device inventory exported from the MDM, joined to a Conditional Access policy that blocks sign-in from anything not in the inventory. The assessor walked one device end to end.',
          objectives: ['c', 'f'],
        },
        {
          text: 'Service accounts documented with an owner, the process they run, and the scopes they hold. <code>Get-MgServicePrincipal</code> output stapled to the register was accepted.',
          objectives: ['b', 'e'],
        },
      ],
      Insufficient: [
        {
          text: 'An account list with no approval trail. The list proved <strong>who has access</strong>, not that they were <strong>authorized</strong> to have it.',
          objectives: ['a'],
        },
        {
          text: 'A policy that says only company devices may connect, with nothing that enforces it. The assessor asked for the enforcing configuration and there was none.',
          objectives: ['f'],
        },
      ],
      'Over-engineering': [
        {
          text: 'A privileged access management product bought for a twelve-person shop. The objective is met by a list and a review; the product was never asked about.',
          objectives: ['a', 'd'],
        },
      ],
      'Edge cases': [
        {
          text: 'Shared kiosk accounts on the shop floor. One assessor accepted them with a sign-in sheet; another treated each as an unidentified user. Both readings are recorded here.',
          objectives: ['a'],
        },
      ],
      'Evidence examples': [
        {
          text: 'Screenshot of the Conditional Access policy in report-only and then enforced mode, plus the sign-in log entry showing an unmanaged device blocked.',
          objectives: ['c', 'f'],
        },
        {
          text: 'The access review export with reviewer name, date, and the decision per account.',
          objectives: ['a', 'd'],
        },
      ],
    },
    related: ['3.1.2', '3.5.1', '3.5.2'],
    public_sources: [
      'NIST SP 800-171A, 3.1.1: https://csrc.nist.gov/pubs/sp/800/171/a/final',
      'NIST SP 800-171 Rev 2, 3.1.1: https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final',
      'DoD Assessment Methodology v1.2.1 scoring table',
    ],
  },
  {
    id: '3.5.3',
    family: 'IA',
    title: 'Multifactor Authentication',
    points: '3 or 5',
    poam_eligible: false,
    confidence: 'medium',
    requirement:
      'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.',
    objectives: [
      { letter: 'a', text: 'Privileged accounts are identified.' },
      { letter: 'b', text: 'Multifactor authentication is implemented for local access to privileged accounts.' },
      { letter: 'c', text: 'Multifactor authentication is implemented for network access to privileged accounts.' },
      { letter: 'd', text: 'Multifactor authentication is implemented for network access to non-privileged accounts.' },
    ],
    sections: {
      Sufficient: [
        {
          text: 'Conditional Access requiring MFA for all users on every cloud app, with the sign-in log showing the MFA claim on a sampled non-privileged sign-in.',
          objectives: ['d'],
        },
        {
          text: 'Windows Hello for Business or a FIDO2 key for local administrator sign-in on domain-joined workstations, demonstrated live.',
          objectives: ['b'],
        },
      ],
      Insufficient: [
        {
          text: 'MFA on the cloud tenant only. Local administrator sign-in to servers and workstations still took a password alone, so the requirement scored the <strong>5-point</strong> deduction, not the 3.',
          objectives: ['b'],
        },
      ],
      'Over-engineering': [],
      'Edge cases': [
        {
          text: 'Whether the 3-point partial score applies at all. The methodology allows 3 points when MFA covers general users but not privileged local access; assessors have differed on how much local coverage is enough to claim it.',
          objectives: ['b', 'c'],
        },
      ],
      'Evidence examples': [
        {
          text: 'Sign-in log export filtered to <code>authenticationRequirement eq multiFactorAuthentication</code> for a sampled week.',
          objectives: ['c', 'd'],
        },
      ],
    },
    related: ['3.5.1', '3.5.2', '3.1.1'],
    public_sources: [
      'NIST SP 800-171A, 3.5.3: https://csrc.nist.gov/pubs/sp/800/171/a/final',
    ],
  },
  {
    id: '3.1.9',
    family: 'AC',
    title: 'Privacy and Security Notices',
    points: '1',
    poam_eligible: true,
    confidence: 'low',
    requirement: 'Provide privacy and security notices consistent with applicable CUI rules.',
    objectives: [
      { letter: 'a', text: 'Privacy and security notices required by CUI-specified rules are identified, consistent, and associated with the specific CUI category.' },
      { letter: 'b', text: 'Privacy and security notices are displayed.' },
    ],
    sections: {
      Sufficient: [
        {
          text: 'A logon banner pushed by policy to every enclave endpoint, with a screenshot of the banner as displayed before sign-in.',
          objectives: ['b'],
        },
      ],
      Insufficient: [],
      'Over-engineering': [],
      'Edge cases': [],
      'Evidence examples': [],
    },
    related: ['3.1.1'],
    public_sources: [
      'NIST SP 800-171A, 3.1.9: https://csrc.nist.gov/pubs/sp/800/171/a/final',
    ],
  },
];
