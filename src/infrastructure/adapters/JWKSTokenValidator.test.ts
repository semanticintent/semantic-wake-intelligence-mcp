/**
 * 🎯 SEMANTIC INTENT: Unit tests for JWKSTokenValidator adapter
 *
 * PURPOSE: Verify Signet-issued JWT verification — valid tokens accepted, every failure
 * mode (expired, wrong audience, wrong issuer, tampered signature, malformed token, JWKS
 * fetch failure) rejected. This is the concrete enforcement point for RFC 8707 audience
 * binding, so the wrong-audience case matters as much as signature verification itself.
 *
 * TEST STRATEGY:
 * - Generate a real ES256 keypair locally, sign test JWTs with it directly (no dependency on
 *   the separate Signet repo — this is intentional test-only duplication of the JWT format)
 * - Mock global fetch to serve that keypair's public JWKS
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JWKSTokenValidator } from './JWKSTokenValidator';

const ISSUER = 'https://signet-test.example.com';
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;
const AUDIENCE = 'wake';
const KID = 'test-key-1';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateTestKeyPair() {
  const keyPair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { privateKey: keyPair.privateKey, jwks: { keys: [{ ...publicJwk, kid: KID, use: 'sig', alg: 'ES256' }] } };
}

async function signTestJWT(privateKey: CryptoKey, claims: Record<string, unknown>): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT', kid: KID };
  const encoder = new TextEncoder();
  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, encoder.encode(signingInput));
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function validClaims(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return { sub: 'owner-1', aud: AUDIENCE, iss: ISSUER, scope: 'mcp:invoke', iat: now, exp: now + 600, jti: 'jti-1', ...overrides };
}

describe('JWKSTokenValidator', () => {
  let privateKey: CryptoKey;
  let jwks: { keys: unknown[] };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // The token cache is a `static` field by design (see JWKSTokenValidator's own comment) so
    // it survives across per-request instances in production — but that means it must be
    // explicitly reset between tests, since each test here generates a fresh keypair.
    JWKSTokenValidator.resetCacheForTesting();

    const generated = await generateTestKeyPair();
    privateKey = generated.privateKey;
    jwks = generated.jwks;

    fetchMock = vi.fn(async (url: string) => {
      if (url === JWKS_URL) {
        return new Response(JSON.stringify(jwks), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts a validly signed, unexpired, correctly audience-bound token', async () => {
    const jwt = await signTestJWT(privateKey, validClaims());
    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);

    const result = await validator.validate(jwt, AUDIENCE);

    expect(result.valid).toBe(true);
    expect(result.claims?.sub).toBe('owner-1');
  });

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const jwt = await signTestJWT(privateKey, validClaims({ exp: now - 3600 }));
    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);

    const result = await validator.validate(jwt, AUDIENCE);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('rejects a token issued for a different resource (audience mismatch) — the RFC 8707 enforcement point', async () => {
    const jwt = await signTestJWT(privateKey, validClaims({ aud: 'some-other-mcp-server' }));
    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);

    const result = await validator.validate(jwt, AUDIENCE);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('resource');
  });

  it('rejects a token from an unexpected issuer', async () => {
    const jwt = await signTestJWT(privateKey, validClaims({ iss: 'https://attacker.example.com' }));
    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);

    const result = await validator.validate(jwt, AUDIENCE);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('issuer');
  });

  it('rejects a token with a tampered payload (signature no longer matches)', async () => {
    const jwt = await signTestJWT(privateKey, validClaims());
    const [encodedHeader, , encodedSignature] = jwt.split('.');

    const tamperedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(validClaims({ scope: 'mcp:admin' }))));
    const tamperedJwt = `${encodedHeader}.${tamperedPayload}.${encodedSignature}`;

    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);
    const result = await validator.validate(tamperedJwt, AUDIENCE);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('signature');
  });

  it('rejects a malformed token (wrong number of segments)', async () => {
    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);
    const result = await validator.validate('not-a-real-jwt', AUDIENCE);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('malformed');
  });

  it('fails closed when the JWKS endpoint is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('internal error', { status: 500 })),
    );

    const jwt = await signTestJWT(privateKey, validClaims());
    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);
    const result = await validator.validate(jwt, AUDIENCE);

    expect(result.valid).toBe(false);
  });

  it('rejects a token referencing an unknown kid', async () => {
    const jwt = await signTestJWT(privateKey, validClaims());
    const [, encodedPayload, encodedSignature] = jwt.split('.');
    const forgedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: 'unknown-kid' })));
    const forgedJwt = `${forgedHeader}.${encodedPayload}.${encodedSignature}`;

    const validator = new JWKSTokenValidator(JWKS_URL, ISSUER);
    const result = await validator.validate(forgedJwt, AUDIENCE);

    expect(result.valid).toBe(false);
  });
});
