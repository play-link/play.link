import {createAdminClient} from '@play/supabase-client/server';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface TrackCampaignClickParams {
  campaignId: string;
  request: Request;
}

export async function trackCampaignClick(
  env: Env,
  {campaignId, request}: TrackCampaignClickParams,
): Promise<void> {
  try {
    const supabase = createAdminClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const visitorHash = await hashVisitor(ip, userAgent);

    const cf = (request as RequestWithCf).cf;
    const country = cf?.country as string | undefined;
    const city = cf?.city as string | undefined;

    const deviceType = parseDeviceType(userAgent);
    const referrer = parseReferrer(request.headers.get('referer'));

    await supabase.from('campaign_events').insert({
      campaign_id: campaignId,
      visitor_hash: visitorHash,
      country: country || null,
      city: city || null,
      device_type: deviceType,
      referrer,
    });
  } catch (error) {
    console.error('Failed to track campaign click:', error);
  }
}

interface RequestWithCf extends Request {
  cf?: {
    country?: string;
    city?: string;
  };
}

async function hashVisitor(ip: string, userAgent: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}:${userAgent}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseDeviceType(userAgent: string): string {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|android(?!.*tablet)/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function parseReferrer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.hostname;
  } catch {
    return null;
  }
}
