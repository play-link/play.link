import {useCallback, useState} from 'react';
import type {Tables} from '@play/supabase-client';
import {GamePageContent} from '@play/game-renderer';
import type {GamePageTheme} from '@play/game-renderer';

type GameLink = Tables<'game_links'>;
type GameMedia = Tables<'game_media'>;

export interface GameUpdate {
  id: string;
  title: string;
  body: string;
  cta_url: string | null;
  cta_label: string | null;
  published_at: string | null;
}

function trackLinkClick(gameId: string, linkId: string) {
  navigator.sendBeacon(
    '/api/track',
    JSON.stringify({gameId, eventType: 'link_click', linkId}),
  );
}

function getStudioBaseUrl() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3010';
  }

  return 'https://studio.play.link';
}

interface GamePageViewProps {
  game: Tables<'games'>;
  page: Tables<'game_pages'>;
  canClaimOwnership: boolean;
  links: GameLink[];
  media: GameMedia[];
  updates: GameUpdate[];
}

export function GamePageView({
  game,
  page,
  canClaimOwnership,
  links,
  media,
  updates,
}: GamePageViewProps) {
  const themeConfig = (page.page_config as Record<string, unknown> | null)?.theme as
    | Record<string, string>
    | undefined;
  const bgColor = themeConfig?.bgColor || '#030712';
  const textColor = themeConfig?.textColor || '#ffffff';
  const linkColor = themeConfig?.linkColor || '#818cf8';
  const secondaryColor = themeConfig?.secondaryColor || textColor;

  const theme: GamePageTheme = {
    bgColor,
    textColor,
    linkColor,
    buttonStyle: (themeConfig?.buttonStyle || 'glass') as GamePageTheme['buttonStyle'],
    buttonRadius: (themeConfig?.buttonRadius || 'full') as GamePageTheme['buttonRadius'],
    secondaryColor,
    fontFamily: themeConfig?.fontFamily,
  };

  // Subscribe state
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<
    'impersonation' | 'trademark' | 'fraud' | 'abuse' | 'other'
  >('impersonation');
  const [reportDetails, setReportDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = useCallback(async () => {
    if (!subEmail.trim()) return;
    setSubStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({gameId: game.id, email: subEmail.trim()}),
      });
      if (!res.ok) throw new Error('Subscribe failed');
      setSubStatus('success');
    } catch {
      setSubStatus('error');
    }
  }, [subEmail, game.id]);

  const handleLinkClick = useCallback(
    (linkId: string) => trackLinkClick(game.id, linkId),
    [game.id],
  );

  const handleSubmitReport = useCallback(async () => {
    setReportStatus('loading');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          pageId: page.id,
          reportType,
          details: reportDetails.trim() || null,
          reporterEmail: reporterEmail.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to report');
      }

      setReportStatus('success');
    } catch {
      setReportStatus('error');
    }
  }, [page.id, reportType, reportDetails, reporterEmail]);
  const claimHref = `${getStudioBaseUrl()}/?claim=1&claimSlug=${encodeURIComponent(page.slug)}`;

  return (
    <>
      <GamePageContent
        game={game}
        links={links}
        media={media}
        theme={theme}
        fullScreen
        onLinkClick={handleLinkClick}
        headerActions={
          <button
            type="button"
            onClick={() => { setShowSubscribe(true); setSubStatus('idle'); }}
            title="Get updates"
            style={{
              flexShrink: 0,
              marginTop: '0.75rem',
              padding: '0.375rem 0.75rem',
              borderRadius: theme.buttonRadius === 'sm' ? '0' : theme.buttonRadius === 'md' ? '0.5rem' : theme.buttonRadius === 'lg' ? '0.75rem' : '9999px',
              border: `1px solid ${theme.buttonStyle === 'solid' ? 'transparent' : theme.buttonStyle === 'outline' ? `color-mix(in srgb, ${textColor} 30%, transparent)` : `color-mix(in srgb, ${secondaryColor} 30%, transparent)`}`,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: theme.buttonStyle === 'solid' ? secondaryColor : theme.buttonStyle === 'outline' ? 'transparent' : `color-mix(in srgb, ${secondaryColor} 18%, transparent)`,
              color: secondaryColor,
              fontSize: '0.8125rem',
              fontWeight: 500,
              transition: 'opacity 0.15s',
              backdropFilter: theme.buttonStyle === 'glass' || !theme.buttonStyle ? 'blur(12px)' : undefined,
              WebkitBackdropFilter: theme.buttonStyle === 'glass' || !theme.buttonStyle ? 'blur(12px)' : undefined,
            } as React.CSSProperties}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Get updates
          </button>
        }
      >
        {/* Updates */}
        {updates.length > 0 && (
          <div style={{marginTop: '2rem'}}>
            <h2 style={{fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem'}}>Latest Updates</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {updates.map((u) => (
                <div
                  key={u.id}
                  style={{
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    background: `color-mix(in srgb, ${textColor} 5%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${textColor} 10%, transparent)`,
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem'}}>
                    <h3 style={{fontWeight: 600, fontSize: '0.9375rem', margin: 0}}>{u.title}</h3>
                    {u.published_at && (
                      <span style={{fontSize: '0.75rem', flexShrink: 0, color: textColor, opacity: 0.4}}>
                        {new Date(u.published_at).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <p style={{fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, color: textColor, opacity: 0.75}}>
                    {u.body.length > 300 ? `${u.body.slice(0, 300)}...` : u.body}
                  </p>
                  {u.cta_url && (
                    <a
                      href={u.cta_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        color: linkColor,
                      }}
                    >
                      {u.cta_label || 'Learn more'} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap'}}>
          {canClaimOwnership && (
            <a
              href={claimHref}
              style={{
                border: 0,
                background: 'transparent',
                color: textColor,
                opacity: 0.7,
                fontSize: '0.75rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Claim ownership
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setShowReport(true);
              setReportStatus('idle');
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: textColor,
              opacity: 0.55,
              fontSize: '0.75rem',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Report
          </button>
        </div>
      </GamePageContent>

      {/* Subscribe Modal */}
      {showSubscribe && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowSubscribe(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '24rem',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              background: bgColor,
              border: `1px solid color-mix(in srgb, ${textColor} 15%, transparent)`,
              color: textColor,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSubscribe(false)}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                opacity: 0.6,
                padding: '0.25rem',
                color: textColor,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {subStatus === 'success' ? (
              <div style={{textAlign: 'center', padding: '1rem 0'}}>
                <p style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem'}}>You're subscribed!</p>
                <p style={{fontSize: '0.875rem', margin: 0, color: textColor, opacity: 0.6}}>
                  You'll receive updates about {game.title}.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem'}}>Get updates</h3>
                <p style={{fontSize: '0.875rem', marginBottom: '1rem', color: textColor, opacity: 0.6}}>
                  Subscribe to receive news about {game.title}.
                </p>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: 0,
                      fontSize: '0.875rem',
                      outline: 'none',
                      background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                      color: textColor,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={subStatus === 'loading' || !subEmail.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 0,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: 'white',
                      background: linkColor,
                      opacity: (subStatus === 'loading' || !subEmail.trim()) ? 0.5 : 1,
                    }}
                  >
                    {subStatus === 'loading' ? '...' : 'Subscribe'}
                  </button>
                </div>
                {subStatus === 'error' && (
                  <p style={{fontSize: '0.875rem', marginTop: '0.5rem', color: '#ef4444'}}>
                    Something went wrong. Please try again.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowReport(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '30rem',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              background: bgColor,
              border: `1px solid color-mix(in srgb, ${textColor} 15%, transparent)`,
              color: textColor,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowReport(false)}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                opacity: 0.6,
                padding: '0.25rem',
                color: textColor,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            {reportStatus === 'success' ? (
              <div style={{padding: '0.5rem 0'}}>
                <h3 style={{fontSize: '1.05rem', fontWeight: 600, margin: 0}}>Report submitted</h3>
                <p style={{fontSize: '0.875rem', margin: '0.5rem 0 0', opacity: 0.7}}>
                  Thanks. We will review this claim.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{fontSize: '1.05rem', fontWeight: 600, margin: 0}}>Report this page</h3>
                <p style={{fontSize: '0.875rem', margin: '0.5rem 0 1rem', opacity: 0.7}}>
                  If this page looks suspicious, you can submit a claim for review.
                </p>

                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as typeof reportType)}
                    style={{
                      width: '100%',
                      border: 0,
                      borderRadius: '0.5rem',
                      padding: '0.625rem 0.75rem',
                      background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                      color: textColor,
                    }}
                  >
                    <option value="impersonation">Impersonation</option>
                    <option value="trademark">Trademark issue</option>
                    <option value="fraud">Fraud / scam</option>
                    <option value="abuse">Abuse</option>
                    <option value="other">Other</option>
                  </select>

                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Add details (optional)"
                    rows={4}
                    style={{
                      width: '100%',
                      border: 0,
                      borderRadius: '0.5rem',
                      padding: '0.625rem 0.75rem',
                      background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                      color: textColor,
                      resize: 'vertical',
                    }}
                  />

                  <input
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="Email (optional)"
                    style={{
                      width: '100%',
                      border: 0,
                      borderRadius: '0.5rem',
                      padding: '0.625rem 0.75rem',
                      background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                      color: textColor,
                    }}
                  />
                </div>

                {reportStatus === 'error' && (
                  <p style={{fontSize: '0.875rem', margin: '0.75rem 0 0', color: '#ef4444'}}>
                    Could not submit this report. Try again.
                  </p>
                )}

                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem'}}>
                  <button
                    type="button"
                    onClick={() => setShowReport(false)}
                    style={{
                      border: 0,
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.875rem',
                      cursor: 'pointer',
                      background: `color-mix(in srgb, ${textColor} 10%, transparent)`,
                      color: textColor,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={reportStatus === 'loading'}
                    style={{
                      border: 0,
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.875rem',
                      cursor: 'pointer',
                      color: 'white',
                      background: linkColor,
                      opacity: reportStatus === 'loading' ? 0.6 : 1,
                    }}
                  >
                    {reportStatus === 'loading' ? 'Submitting...' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
