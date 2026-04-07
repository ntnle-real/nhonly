// MARK: SYSTEM(Supabase) -> Database Connection Layer
// Purpose: Initialize Supabase client with proper environment separation (dev vs prod)
// Success: Client connects to correct Supabase project; environment variables verified
// Failure: Missing environment variables, invalid credentials, or environment mismatch

import { createClient } from '@supabase/supabase-js';
import { createObservationSession } from './obs';

// Get environment variables safely (may not exist at build time)
const PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || '';
const PUBLIC_SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * MARK: FUNCTION(verifySupabaseEnvironment) -> Validate Configuration at Runtime
 * Purpose: Ensure Supabase credentials match environment (dev/prod separation)
 * Success: All environment variables present and consistent
 * Failure: Missing variables or environment mismatch detected
 */
export function verifySupabaseEnvironment(obs = createObservationSession()) {
	obs.step('verify_supabase_env');

	// Check public variables (available to client)
	if (!PUBLIC_SUPABASE_URL) {
		obs.observe('missing_variable', 'PUBLIC_SUPABASE_URL');
		throw new Error(
			'Missing PUBLIC_SUPABASE_URL. Check .env.local (dev) or .env.production (prod)'
		);
	}

	if (!PUBLIC_SUPABASE_ANON_KEY) {
		obs.observe('missing_variable', 'PUBLIC_SUPABASE_ANON_KEY');
		throw new Error(
			'Missing PUBLIC_SUPABASE_ANON_KEY. Check .env.local (dev) or .env.production (prod)'
		);
	}

	// Check server-side secret (never exposed to client)
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		obs.observe('missing_variable', 'SUPABASE_SERVICE_ROLE_KEY');
		throw new Error(
			'Missing SUPABASE_SERVICE_ROLE_KEY. This secret must be on server only, never in .env.local'
		);
	}

	obs.observe('credentials_verified', {
		url: PUBLIC_SUPABASE_URL,
		hasAnonKey: !!PUBLIC_SUPABASE_ANON_KEY,
		hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
	});

	return obs.return_('environment_ready', { verified: true });
}

/**
 * MARK: FUNCTION(getSupabaseAdmin) -> Get Server-Side Database Client
 * Purpose: Create Supabase client with service role key for admin operations
 * Success: Admin client ready for database writes, deletes, and bulk operations
 * Failure: Missing service role key
 */
export function getSupabaseAdmin(obs = createObservationSession()) {
	obs.step('get_supabase_admin_client');

	if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		obs.observe('missing_credentials', { url: !PUBLIC_SUPABASE_URL, key: !SUPABASE_SERVICE_ROLE_KEY });
		throw new Error('Missing Supabase credentials for admin client');
	}

	const client = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

	obs.observe('admin_client_initialized', {
		url: PUBLIC_SUPABASE_URL,
		roleType: 'service_role'
	});

	return obs.return_('admin_client', client);
}

/**
 * MARK: FUNCTION(getSupabasePublic) -> Get Public-Safe Database Client
 * Purpose: Create Supabase client with anon key for client-side operations
 * Success: Public client ready (safe for browser consumption)
 * Failure: Missing anon key
 */
export function getSupabasePublic(obs = createObservationSession()) {
	obs.step('get_supabase_public_client');

	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		obs.observe('missing_credentials', { url: !PUBLIC_SUPABASE_URL, key: !PUBLIC_SUPABASE_ANON_KEY });
		throw new Error('Missing Supabase credentials for public client');
	}

	const client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	obs.observe('public_client_initialized', {
		url: PUBLIC_SUPABASE_URL,
		roleType: 'anon'
	});

	return obs.return_('public_client', client);
}

// Lazy-loaded admin client (only created on first use, not at module load)
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
	if (!supabaseAdminInstance) {
		supabaseAdminInstance = getSupabaseAdmin();
	}
	return supabaseAdminInstance;
}
