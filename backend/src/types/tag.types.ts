/**
 * Tag Types for Request Categorization
 */

export enum TagType {
  CRITICAL = 'CRITICAL',
  INTERESTING = 'INTERESTING',
  SAFE = 'SAFE',
  IDOR = 'IDOR',
  XSS = 'XSS',
  SQLI = 'SQLI',
  SSRF = 'SSRF',
  CUSTOM = 'CUSTOM',
}

export interface TagDefinition {
  id: TagType | string;
  name: string;
  color: string;
  description: string;
}

export const PREDEFINED_TAGS: TagDefinition[] = [
  {
    id: TagType.CRITICAL,
    name: 'Critical',
    color: '#DC2626', // red-600
    description: 'Critical security finding or high-value target',
  },
  {
    id: TagType.INTERESTING,
    name: 'Interesting',
    color: '#F97316', // orange-500
    description: 'Potentially interesting endpoint or behavior',
  },
  {
    id: TagType.SAFE,
    name: 'Safe',
    color: '#16A34A', // green-600
    description: 'Verified safe request, no vulnerabilities',
  },
  {
    id: TagType.IDOR,
    name: 'IDOR',
    color: '#9333EA', // purple-600
    description: 'Insecure Direct Object Reference vulnerability',
  },
  {
    id: TagType.XSS,
    name: 'XSS',
    color: '#EAB308', // yellow-600
    description: 'Cross-Site Scripting vulnerability',
  },
  {
    id: TagType.SQLI,
    name: 'SQLi',
    color: '#3B82F6', // blue-600
    description: 'SQL Injection vulnerability',
  },
  {
    id: TagType.SSRF,
    name: 'SSRF',
    color: '#EC4899', // pink-600
    description: 'Server-Side Request Forgery vulnerability',
  },
];

export interface TagRequest {
  requestIds: string[];
  tag: TagType | string;
}

export interface UntagRequest {
  requestIds: string[];
  tag: TagType | string;
}

export interface TagFilterRequest {
  tags: string[];
  matchAll?: boolean; // true = AND, false = OR (default)
}

export interface TagStats {
  tag: string;
  count: number;
  color: string;
}
