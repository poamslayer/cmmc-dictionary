/*
  The 14 requirement families of NIST SP 800-171 Rev 2, in the order the
  standard lists them (3.1 through 3.14). `code` is the two-letter key shown
  in the grid and used, lowercased, in the family page URL. `name` is the
  official family name from the standard.
*/

export interface Family {
  code: string;   // "AC"
  number: string; // "3.1"
  name: string;   // "Access Control"
}

export const families: Family[] = [
  { code: 'AC', number: '3.1', name: 'Access Control' },
  { code: 'AT', number: '3.2', name: 'Awareness and Training' },
  { code: 'AU', number: '3.3', name: 'Audit and Accountability' },
  { code: 'CM', number: '3.4', name: 'Configuration Management' },
  { code: 'IA', number: '3.5', name: 'Identification and Authentication' },
  { code: 'IR', number: '3.6', name: 'Incident Response' },
  { code: 'MA', number: '3.7', name: 'Maintenance' },
  { code: 'MP', number: '3.8', name: 'Media Protection' },
  { code: 'PS', number: '3.9', name: 'Personnel Security' },
  { code: 'PE', number: '3.10', name: 'Physical Protection' },
  { code: 'RA', number: '3.11', name: 'Risk Assessment' },
  { code: 'CA', number: '3.12', name: 'Security Assessment' },
  { code: 'SC', number: '3.13', name: 'System and Communications Protection' },
  { code: 'SI', number: '3.14', name: 'System and Information Integrity' },
];
