/**
 * 🎯 SEMANTIC INTENT: JWT Verification Adapter (Signet OAuth 2.1)
 *
 * PURPOSE: Implement ITokenValidator by verifying ES256-signed JWTs against Signet's
 * published JWKS — replaces the prior static shared-secret bearer check entirely. There is
 * no secret shared between this Worker and Signet anymore, only a public key to verify
 * against.
 *
 * HEXAGONAL ARCHITECTURE:
 * - This is an ADAPTER (infrastructure implementation)
 * - Implements PORT (ITokenValidator interface)
 *
 * FAILS CLOSED: any error fetching/parsing the JWKS, or verifying the token, results in
 * `valid: false` — never a fallback to accepting the request.
 *
 * CACHING: the JWKS response is cached as a `static` field, not an instance field — wake's
 * composition root constructs a fresh adapter instance per request, so an instance-scoped
 * cache would be cold every time. A `static` field is shared across instances within the same
 * Worker isolate, giving the cache a real chance to persist between requests.
 */

import type { ITokenValidator, TokenValidationResult } from '../../application/ports/ITokenValidator';

const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — signing keys rotate rarely
const CLOCK_SKEW_SECONDS = 60;

interface AccessTokenClaims {
	sub: string;
	aud: string;
	iss: string;
	scope: string;
	iat: number;
	exp: number;
	jti: string;
}

export class JWKSTokenValidator implements ITokenValidator {
	private static cachedKeys: Map<string, CryptoKey> | null = null;
	private static cacheFetchedAt = 0;

	constructor(
		private readonly jwksUrl: string,
		private readonly expectedIssuer: string,
	) {}

	async validate(token: string, expectedAudience: string): Promise<TokenValidationResult> {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return { valid: false, reason: 'malformed token' };
		}
		const [encodedHeader, encodedPayload, encodedSignature] = parts;

		let header: { kid?: string; alg?: string };
		let claims: AccessTokenClaims;
		try {
			header = JSON.parse(decodeBase64UrlToString(encodedHeader));
			claims = JSON.parse(decodeBase64UrlToString(encodedPayload));
		} catch {
			return { valid: false, reason: 'malformed token' };
		}

		if (!header.kid) {
			return { valid: false, reason: 'token header is missing kid' };
		}

		let publicKey: CryptoKey;
		try {
			publicKey = await this.getPublicKey(header.kid);
		} catch (error) {
			// Fail closed: a JWKS fetch failure or unknown kid must never be treated as valid.
			console.error('JWKS lookup failed:', error);
			return { valid: false, reason: 'unable to verify token signature' };
		}

		const encoder = new TextEncoder();
		const isValidSignature = await crypto.subtle.verify(
			{ name: 'ECDSA', hash: 'SHA-256' },
			publicKey,
			decodeBase64Url(encodedSignature),
			encoder.encode(`${encodedHeader}.${encodedPayload}`),
		);

		if (!isValidSignature) {
			return { valid: false, reason: 'invalid signature' };
		}

		const now = Math.floor(Date.now() / 1000);
		if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_SECONDS < now) {
			return { valid: false, reason: 'token expired' };
		}

		if (claims.iss !== this.expectedIssuer) {
			return { valid: false, reason: 'unexpected issuer' };
		}

		// The concrete RFC 8707 resource-indicator enforcement: a token issued for a different
		// resource server must not validate here, even with a perfectly valid signature.
		if (claims.aud !== expectedAudience) {
			return { valid: false, reason: 'token was not issued for this resource' };
		}

		return {
			valid: true,
			claims: { sub: claims.sub, aud: claims.aud, iss: claims.iss, scope: claims.scope, exp: claims.exp },
		};
	}

	/** Test-only escape hatch for the static cache — production code never calls this. */
	static resetCacheForTesting(): void {
		JWKSTokenValidator.cachedKeys = null;
		JWKSTokenValidator.cacheFetchedAt = 0;
	}

	private async getPublicKey(kid: string): Promise<CryptoKey> {
		const isStale = Date.now() - JWKSTokenValidator.cacheFetchedAt > JWKS_CACHE_TTL_MS;
		if (!JWKSTokenValidator.cachedKeys || isStale) {
			await this.refreshJWKS();
		}

		const key = JWKSTokenValidator.cachedKeys?.get(kid);
		if (!key) {
			throw new Error(`unknown kid: ${kid}`);
		}
		return key;
	}

	private async refreshJWKS(): Promise<void> {
		const response = await fetch(this.jwksUrl);
		if (!response.ok) {
			throw new Error(`JWKS fetch failed with status ${response.status}`);
		}

		const jwks = await response.json<{ keys: (JsonWebKey & { kid?: string })[] }>();
		const keys = new Map<string, CryptoKey>();

		for (const jwk of jwks.keys) {
			if (!jwk.kid) continue;
			const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
			keys.set(jwk.kid, key);
		}

		JWKSTokenValidator.cachedKeys = keys;
		JWKSTokenValidator.cacheFetchedAt = Date.now();
	}
}

function decodeBase64Url(value: string): Uint8Array {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/');
	const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
	const binary = atob(withPadding);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

function decodeBase64UrlToString(value: string): string {
	return new TextDecoder().decode(decodeBase64Url(value));
}
