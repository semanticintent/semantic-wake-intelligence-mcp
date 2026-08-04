/**
 * PORT (interface) — infrastructure provides the ADAPTER (JWKSTokenValidator).
 *
 * Replaces the prior static shared-secret bearer check with real OAuth 2.1 token
 * verification against a Signet-issued, audience-bound JWT.
 */
export interface TokenValidationResult {
	valid: boolean;
	reason?: string;
	claims?: {
		sub: string;
		aud: string;
		iss: string;
		scope: string;
		exp: number;
	};
}

export interface ITokenValidator {
	/**
	 * @param token - the bearer token presented by the caller
	 * @param expectedAudience - this resource server's own identifier (RFC 8707) — a token
	 *   issued for a different resource must fail here, not just pass signature/expiry checks
	 */
	validate(token: string, expectedAudience: string): Promise<TokenValidationResult>;
}
