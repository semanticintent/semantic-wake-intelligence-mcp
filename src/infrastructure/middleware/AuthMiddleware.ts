/**
 * 🎯 SEMANTIC INTENT: Bearer Token Enforcement Middleware
 *
 * PURPOSE: Reject requests without a valid, audience-bound Signet-issued access token.
 *
 * Deliberately an instantiable class with a constructor-injected ITokenValidator, unlike
 * CORSMiddleware's static-class shape — this middleware now has a real dependency to inject,
 * where CORS policy is static, stateless data.
 */

import type { ITokenValidator } from '../../application/ports/ITokenValidator';

export class AuthMiddleware {
	constructor(private readonly tokenValidator: ITokenValidator) {}

	/** Returns null if the request is authorized; otherwise the 401 Response to send. */
	async enforce(request: Request, expectedAudience: string): Promise<Response | null> {
		const authHeader = request.headers.get('Authorization');

		if (!authHeader?.startsWith('Bearer ')) {
			return this.unauthorized('missing bearer token');
		}

		const token = authHeader.slice('Bearer '.length);
		const result = await this.tokenValidator.validate(token, expectedAudience);

		if (!result.valid) {
			return this.unauthorized(result.reason ?? 'invalid token');
		}

		return null;
	}

	private unauthorized(reason: string): Response {
		return new Response(JSON.stringify({ error: 'invalid_token', error_description: reason }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
				'WWW-Authenticate': `Bearer error="invalid_token", error_description="${reason}"`,
			},
		});
	}
}
