import {createAdminClient} from '@play/supabase-client/server';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface CustomDomainLookup {
  targetType: 'studio' | 'game';
  targetId: string;
  canonicalPath: string;
}

interface LookupResult {
  target_type: 'studio' | 'game';
  target_id: string;
  canonical_path: string | null;
}

/**
 * Lookup a custom domain and return routing information.
 * Returns null if the domain is not registered or not verified.
 */
export async function lookupCustomDomain(
  env: Env,
  hostname: string,
): Promise<CustomDomainLookup | null> {
  const supabase = createAdminClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Use the lookup function we created in the migration
  // Type assertion needed until Supabase types are regenerated
  const {data, error} = await supabase.rpc('lookup_custom_domain' as any, {
    p_hostname: hostname.toLowerCase(),
  }) as {data: LookupResult[] | null; error: any};

  if (error) {
    console.error('Custom domain lookup error:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const result = data[0];
  if (!result.canonical_path) {
    return null;
  }

  return {
    targetType: result.target_type,
    targetId: result.target_id,
    canonicalPath: result.canonical_path,
  };
}

/**
 * Check if a hostname is a known Play.link domain (not a custom domain)
 */
export function isPlayLinkDomain(hostname: string): boolean {
  const playLinkDomains = [
    'play.link',
    'www.play.link',
    'localhost',
    '127.0.0.1',
  ];

  // Also allow any *.pages.dev or *.workers.dev for development
  if (hostname.endsWith('.pages.dev') || hostname.endsWith('.workers.dev')) {
    return true;
  }

  return playLinkDomains.includes(hostname.toLowerCase());
}
