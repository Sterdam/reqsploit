import forge from 'node-forge';
import { PrismaClient, CertificateType } from '@prisma/client';
import crypto from 'crypto';
import { CertificateError } from '../../utils/errors.js';
import { certLogger } from '../../utils/logger.js';

const prisma = new PrismaClient();

interface CertificateKeyPair {
  cert: string; // PEM format
  key: string; // PEM format
}

interface CertificateCache {
  cert: string;
  key: string;
  expiresAt: Date;
}

// LRU Cache for domain certificates (in-memory)
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);
    // Remove oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Certificate Manager
 * Handles SSL/TLS certificate generation for MITM proxy
 */
export class CertificateManager {
  private domainCertCache: LRUCache<string, CertificateCache>;
  private encryptionKey: Buffer;

  constructor() {
    this.domainCertCache = new LRUCache<string, CertificateCache>(1000);
    // Generate encryption key for certificate private keys
    this.encryptionKey = crypto.scryptSync(
      process.env.JWT_SECRET || 'dev-secret',
      'cert-salt',
      32
    );
  }

  /**
   * Generate Root CA certificate for a user
   */
  async generateRootCA(userId: string): Promise<CertificateKeyPair> {
    certLogger.info('Generating Root CA', { userId });

    try {
      // Check if Root CA already exists
      const existing = await prisma.certificate.findFirst({
        where: {
          userId,
          type: CertificateType.ROOT_CA,
        },
      });

      if (existing) {
        certLogger.info('Root CA already exists', { userId });
        return {
          cert: existing.certPem,
          key: this.decryptPrivateKey(existing.keyPem),
        };
      }

      // Generate RSA key pair
      const keys = forge.pki.rsa.generateKeyPair(2048);

      // Create certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = this.generateSerialNumber();

      // Set validity (10 years)
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

      // Set subject and issuer
      const attrs = [
        { name: 'commonName', value: `ReqSploit Proxy CA (User: ${userId.slice(0, 8)})` },
        { name: 'countryName', value: 'US' },
        { name: 'organizationName', value: 'ReqSploit' },
        { shortName: 'OU', value: 'Security Testing' },
      ];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);

      // Set extensions for CA
      cert.setExtensions([
        {
          name: 'basicConstraints',
          cA: true,
          critical: true,
        },
        {
          name: 'keyUsage',
          keyCertSign: true,
          cRLSign: true,
          critical: true,
        },
        {
          name: 'subjectKeyIdentifier',
        },
      ]);

      // Self-sign certificate
      cert.sign(keys.privateKey, forge.md.sha256.create());

      // Convert to PEM
      const certPem = forge.pki.certificateToPem(cert);
      const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

      // Encrypt private key for storage
      const encryptedKey = this.encryptPrivateKey(keyPem);

      // Store in database
      await prisma.certificate.create({
        data: {
          userId,
          certPem,
          keyPem: encryptedKey,
          type: CertificateType.ROOT_CA,
          expiresAt: cert.validity.notAfter,
        },
      });

      certLogger.info('Root CA generated successfully', { userId });

      return { cert: certPem, key: keyPem };
    } catch (error) {
      certLogger.error('Failed to generate Root CA', { userId, error });
      throw new CertificateError('Failed to generate Root CA certificate');
    }
  }

  /**
   * Generate domain certificate signed by user's Root CA
   */
  async generateDomainCert(
    domain: string,
    userId: string
  ): Promise<CertificateKeyPair> {
    certLogger.debug('Generating domain certificate', { domain, userId });

    try {
      // Check cache first
      const cacheKey = `${userId}:${domain}`;
      const cached = this.domainCertCache.get(cacheKey);

      if (cached && cached.expiresAt > new Date()) {
        certLogger.debug('Domain certificate found in cache', { domain });
        return { cert: cached.cert, key: cached.key };
      }

      // Check database
      const existing = await prisma.certificate.findFirst({
        where: {
          userId,
          type: CertificateType.DOMAIN,
          domain,
        },
      });

      if (existing && existing.expiresAt > new Date()) {
        const keyPem = this.decryptPrivateKey(existing.keyPem);

        // Update cache
        this.domainCertCache.set(cacheKey, {
          cert: existing.certPem,
          key: keyPem,
          expiresAt: existing.expiresAt,
        });

        return { cert: existing.certPem, key: keyPem };
      }

      // Get Root CA
      const rootCA = await this.getRootCAForUser(userId);
      if (!rootCA) {
        throw new CertificateError('Root CA not found');
      }

      // Parse Root CA
      const caCert = forge.pki.certificateFromPem(rootCA.cert);
      const caKey = forge.pki.privateKeyFromPem(rootCA.key);

      // Generate new key pair for domain
      const keys = forge.pki.rsa.generateKeyPair(2048);

      // Create certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = this.generateSerialNumber();

      // Set validity (365 days)
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + 365);

      // Set subject
      cert.setSubject([
        { name: 'commonName', value: domain },
        { name: 'countryName', value: 'US' },
        { name: 'organizationName', value: 'ReqSploit' },
      ]);

      // Set issuer (from CA)
      cert.setIssuer(caCert.subject.attributes);

      // Set extensions
      cert.setExtensions([
        {
          name: 'basicConstraints',
          cA: false,
        },
        {
          name: 'keyUsage',
          digitalSignature: true,
          keyEncipherment: true,
        },
        {
          name: 'extKeyUsage',
          serverAuth: true,
        },
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: domain }, // DNS
            { type: 2, value: `*.${domain}` }, // Wildcard
          ],
        },
      ]);

      // Sign with CA key
      cert.sign(caKey, forge.md.sha256.create());

      // Convert to PEM
      const certPem = forge.pki.certificateToPem(cert);
      const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

      // Encrypt private key
      const encryptedKey = this.encryptPrivateKey(keyPem);

      // Store in database
      await prisma.certificate.create({
        data: {
          userId,
          certPem,
          keyPem: encryptedKey,
          type: CertificateType.DOMAIN,
          domain,
          expiresAt: cert.validity.notAfter,
        },
      });

      // Update cache
      this.domainCertCache.set(cacheKey, {
        cert: certPem,
        key: keyPem,
        expiresAt: cert.validity.notAfter,
      });

      certLogger.info('Domain certificate generated', { domain, userId });

      return { cert: certPem, key: keyPem };
    } catch (error) {
      certLogger.error('Failed to generate domain certificate', { domain, userId, error });
      throw new CertificateError(`Failed to generate certificate for ${domain}`);
    }
  }

  /**
   * Get Root CA for user
   */
  async getRootCAForUser(userId: string): Promise<CertificateKeyPair | null> {
    const cert = await prisma.certificate.findFirst({
      where: {
        userId,
        type: CertificateType.ROOT_CA,
      },
    });

    if (!cert) {
      return null;
    }

    return {
      cert: cert.certPem,
      key: this.decryptPrivateKey(cert.keyPem),
    };
  }

  /**
   * Export Root CA for user download (.crt format)
   */
  async exportRootCAForDownload(userId: string): Promise<Buffer> {
    const rootCA = await this.getRootCAForUser(userId);

    if (!rootCA) {
      throw new CertificateError('Root CA not found');
    }

    // Return certificate in PEM format (can be saved as .crt)
    return Buffer.from(rootCA.cert, 'utf-8');
  }

  /**
   * Generate random serial number for certificate
   */
  private generateSerialNumber(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Encrypt private key for database storage
   */
  private encryptPrivateKey(keyPem: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

    let encrypted = cipher.update(keyPem, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt private key from database
   */
  private decryptPrivateKey(encryptedKey: string): string {
    const [ivHex, encrypted] = encryptedKey.split(':');
    if (!ivHex || !encrypted) {
      throw new CertificateError('Invalid encrypted key format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.domainCertCache.clear();
    certLogger.info('Certificate cache cleared');
  }
}

// Singleton instance
export const certificateManager = new CertificateManager();
