import { redirect} from 'react-router';
import type {MetaFunction} from 'react-router';
import type {ReactNode} from 'react';
import {
  ArrowRightIcon,
  BarChart3Icon,
  CheckIcon,
  FileEditIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  LinkIcon,
  MailIcon,
  MegaphoneIcon,
  MenuIcon,
  PaletteIcon,
  SparklesIcon,
  StarIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion, useInView, useScroll, useTransform} from 'framer-motion';
import {isPlayLinkDomain, lookupCustomDomain} from '../lib/custom-domain.server';
import type {Route} from './+types/home';

interface CloudflareLoadContext {
  cloudflare: {
    env: {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
    };
  };
}

// Handle custom domain routing - if accessing from a custom domain, redirect to the canonical path
export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const hostname = url.hostname;

  if (!isPlayLinkDomain(hostname)) {
    const cf = context as unknown as CloudflareLoadContext;
    if (cf?.cloudflare?.env) {
      const lookup = await lookupCustomDomain(cf.cloudflare.env, hostname);
      if (lookup) {
        // Redirect to the slug route with the canonical path
        throw redirect(`/${lookup.canonicalPath}`);
      }
    }
  }

  return null;
}

export const meta: MetaFunction = () => [
  {title: 'Play.link — Landing pages for your games'},
  {
    name: 'description',
    content:
      'Create beautiful, customizable landing pages for your games — with analytics, email capture, and press kits built in.',
  },
  {property: 'og:title', content: 'Play.link'},
  {property: 'og:description', content: 'Landing pages for your games'},
  {property: 'og:type', content: 'website'},
];

// ─── Scroll-triggered animations ───────────────────────────────────
function FadeUp({children, className, delay = 0}: {children: ReactNode; className?: string; delay?: number}) {
  const ref = useRef(null);
  const inView = useInView(ref, {once: true, margin: '-80px'});
  return (
    <motion.div ref={ref} className={className} initial={{opacity: 0, y: 32}} animate={inView ? {opacity: 1, y: 0} : {opacity: 0, y: 32}} transition={{duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1]}}>
      {children}
    </motion.div>
  );
}

function StaggerItem({children, className, index = 0}: {children: ReactNode; className?: string; index?: number}) {
  const ref = useRef(null);
  const inView = useInView(ref, {once: true, margin: '-60px'});
  return (
    <motion.div ref={ref} className={className} initial={{opacity: 0, y: 24}} animate={inView ? {opacity: 1, y: 0} : {opacity: 0, y: 24}} transition={{duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1]}}>
      {children}
    </motion.div>
  );
}

// ─── Section data ──────────────────────────────────────────────────
const VALUE_PROPS = [
  {icon: PaletteIcon, title: 'Custom Themes', desc: 'Make it yours with custom colors, fonts, and layouts'},
  {icon: BarChart3Icon, title: 'Built-in Analytics', desc: 'Track every click, visit, and conversion'},
  {icon: MailIcon, title: 'Email Subscribers', desc: 'Grow your audience with built-in email capture'},
  {icon: FileTextIcon, title: 'Press Kits', desc: 'One-click press kits for media coverage'},
];

const TESTIMONIALS = [
  {name: 'Alex Rivera', role: 'Indie Developer', avatar: 'A', quote: 'Play.link replaced my entire website. I set up a game page in minutes and it looks incredible on every device.'},
  {name: 'Sarah Kim', role: 'Studio Founder', avatar: 'S', quote: 'The analytics alone are worth it. I can finally see which links my players actually click and optimize my marketing.'},
  {name: 'Marcus Chen', role: 'Game Designer', avatar: 'M', quote: 'Press kits used to take me hours. Now journalists get everything they need from one link. Game changer.'},
  {name: 'Luna Park', role: 'Creative Director', avatar: 'L', quote: 'We moved all our game pages to Play.link. The theming system is exactly what we needed for our brand.'},
];

const FEATURES = [
  {icon: SparklesIcon, title: 'Game Page Builder', desc: 'Build stunning landing pages with custom themes, hero images, and responsive layouts.'},
  {icon: ImageIcon, title: 'Media Gallery', desc: 'Showcase screenshots, trailers, and GIFs in a polished gallery.'},
  {icon: LinkIcon, title: 'Smart Links', desc: 'Store links, social profiles, and custom URLs with click tracking.'},
  {icon: MegaphoneIcon, title: 'Update Feed', desc: 'Post devlogs and announcements directly on your game page.'},
  {icon: UsersIcon, title: 'Studio Profiles', desc: 'A branded studio page that showcases all your games in one place.'},
  {icon: GlobeIcon, title: 'Custom Domains', desc: 'Use your own domain or a clean play.link/your-game URL.'},
];

const BENEFITS = [
  'Unlimited game pages', 'Built-in analytics dashboard', 'Email subscriber capture',
  'One-click press kits', 'Custom themes & fonts', 'Media gallery with video',
  'Studio profile page', 'SEO & social previews',
];

// ─── Page ──────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      <Navbar />
      <Hero />
      <Showcase />
      <ValueProps />
      <Testimonials />
      <FeatureSection />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="w-full px-6 lg:px-10 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-10">
          <a href="/" className="text-[20px] font-bold text-white no-underline tracking-tight">
            Play<span className="text-[#00beff]">.link</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[15px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Features</a>
            <a href="#pricing" className="text-[15px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Pricing</a>
            <a href="#testimonials" className="text-[15px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Testimonials</a>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="/login" className="inline-flex items-center gap-2 text-[15px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">
            <UsersIcon size={16} /> Login
          </a>
          <a href="/signup" className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white bg-[#00beff] hover:bg-[#009dd6] px-6 py-2.5 rounded-full no-underline transition-colors duration-200">
            Start building now <ArrowRightIcon size={15} />
          </a>
        </div>
        <button type="button" className="md:hidden p-2 border-0 bg-transparent text-white cursor-pointer" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden px-6 pb-5 flex flex-col gap-4 bg-[#0a0a0f]/95 border-b border-white/[0.06]">
          <a href="#features" className="text-[15px] text-[#8a8ba7] no-underline py-1" onClick={() => setOpen(false)}>Features</a>
          <a href="#pricing" className="text-[15px] text-[#8a8ba7] no-underline py-1" onClick={() => setOpen(false)}>Pricing</a>
          <a href="#testimonials" className="text-[15px] text-[#8a8ba7] no-underline py-1" onClick={() => setOpen(false)}>Testimonials</a>
          <a href="/login" className="text-[15px] text-[#8a8ba7] no-underline py-1">Login</a>
          <a href="/signup" className="inline-flex items-center justify-center gap-2.5 text-[15px] font-semibold text-white bg-[#00beff] px-6 py-2.5 rounded-full no-underline">
            Start building now <ArrowRightIcon size={15} />
          </a>
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HERO — Dark hero with ghost activity signals
// ═══════════════════════════════════════════════════════════════════

// Ghost signal cards — activity notifications that fade in/out
// 4 card types: sparkline (chart only), stat (number + subtitle), text (message + icon), bars (vertical bars only)

type GhostSignal =
  | {type: 'sparkline'; label: string; points: number[]; color: string; top: string; left: string}
  | {type: 'stat'; label: string; value: string; subtitle: string; Icon: LucideIcon; iconColor: string; top: string; left: string}
  | {type: 'text'; label: string; message: string; Icon: LucideIcon; iconColor: string; top: string; left: string}
  | {type: 'bars'; label: string; bars: number[]; color: string; top: string; left: string};

const GHOST_SIGNALS: GhostSignal[] = [
  // 1. Activity spike — sparkline only, violet
  {type: 'sparkline', label: 'Activity', points: [2, 5, 3, 8, 4, 11, 7, 14, 10, 18], color: '#00beff', top: '18%', left: '10%'},
  // 2. Traffic — "2.4k" bold + "today", small ⚡ icon
  {type: 'stat', label: 'Traffic', value: '2.4k', subtitle: 'today', Icon: ZapIcon, iconColor: '#00beff', top: '26%', left: '76%'},
  // 3. Audience growth — "+124" bold + "this week", person icon
  {type: 'stat', label: 'Audience', value: '+124', subtitle: 'this week', Icon: UserPlusIcon, iconColor: '#5eead4', top: '64%', left: '12%'},
  // 4. Wishlist / interest — text message, star outline
  {type: 'text', label: 'Interest', message: 'New wishlist added', Icon: StarIcon, iconColor: '#94a3b8', top: '58%', left: '74%'},
  // 5. Update published — text message, edit outline
  {type: 'text', label: 'Update', message: 'Patch notes published', Icon: FileEditIcon, iconColor: '#7dd3fc', top: '74%', left: '64%'},
  // 6. Press / creator mention — text message, megaphone outline
  {type: 'text', label: 'Mention', message: 'Featured by a creator', Icon: MegaphoneIcon, iconColor: '#5ad4ff', top: '34%', left: '76%'},
  // 7. Link performance — vertical bars only, no text
  {type: 'bars', label: 'Engagement', bars: [6, 10, 8, 14], color: '#5eead4', top: '72%', left: '22%'},
  // 8. Multi-destination — "5" bold + "active links", link icon
  {type: 'stat', label: 'Destinations', value: '5', subtitle: 'active links', Icon: LinkIcon, iconColor: '#5ad4ff', top: '20%', left: '68%'},
];

// Mini sparkline SVG
function MiniChart({points, color, width = 80, height = 28}: {points: number[]; color: string; width?: number; height?: number}) {
  const max = Math.max(...points);
  const w = width;
  const h = height;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - (p / max) * (h - 2) - 1;
    return `${x},${y}`;
  });
  const line = `M${pts.join(' L')}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  const id = `grad-${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Mini vertical bar chart SVG
function MiniBars({bars, color}: {bars: number[]; color: string}) {
  const max = Math.max(...bars);
  const barWidth = 10;
  const gap = 5;
  const h = 32;
  const w = bars.length * barWidth + (bars.length - 1) * gap;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {bars.map((v, i) => {
        const barH = (v / max) * (h - 2);
        const x = i * (barWidth + gap);
        const y = h - barH;
        return <rect key={i} x={x} y={y} width={barWidth} height={barH} rx={3} fill={color} opacity={0.6 + (v / max) * 0.4} />;
      })}
    </svg>
  );
}

function SignalCard({signal}: {signal: GhostSignal}) {
  switch (signal.type) {
    case 'sparkline':
      return (
        <div className="px-4 py-3.5">
          <p className="text-[10px] text-white/25 font-medium uppercase tracking-[0.12em] mb-2">{signal.label}</p>
          <MiniChart points={signal.points} color={signal.color} width={90} height={32} />
        </div>
      );
    case 'stat':
      return (
        <div className="px-4 py-3.5 min-w-[100px]">
          <div className="flex items-center gap-1.5 mb-2">
            <signal.Icon size={12} style={{color: signal.iconColor}} strokeWidth={2} />
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-[0.12em]">{signal.label}</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[22px] font-bold text-white/80 leading-none">{signal.value}</span>
            <span className="text-[11px] text-white/30 leading-none">{signal.subtitle}</span>
          </div>
        </div>
      );
    case 'text':
      return (
        <div className="px-4 py-3.5 flex items-center gap-3">
          <signal.Icon size={16} style={{color: signal.iconColor}} strokeWidth={1.5} className="shrink-0 opacity-60" />
          <div>
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-[0.12em] mb-1">{signal.label}</p>
            <p className="text-[13px] text-white/60 leading-none">{signal.message}</p>
          </div>
        </div>
      );
    case 'bars':
      return (
        <div className="px-4 py-3.5">
          <p className="text-[10px] text-white/25 font-medium uppercase tracking-[0.12em] mb-2">{signal.label}</p>
          <MiniBars bars={signal.bars} color={signal.color} />
        </div>
      );
  }
}

function Hero() {
  // Each entry: { signalIdx, uniqueId } so we never have duplicate positions
  const [visible, setVisible] = useState<{signalIdx: number; uid: number}[]>([]);
  const nextIdx = useRef(0);
  const uidCounter = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const SHOW_DURATION = 6000; // how long each card stays visible
    const STAGGER = 3000;       // interval between new cards appearing

    const show = () => {
      if (cancelled) return;
      const signalIdx = nextIdx.current;
      const uid = uidCounter.current++;
      nextIdx.current = (nextIdx.current + 1) % GHOST_SIGNALS.length;

      // Don't show if this signal position is already visible
      setVisible((prev) => {
        if (prev.some((v) => v.signalIdx === signalIdx)) return prev;
        return [...prev, {signalIdx, uid}];
      });

      // Remove after duration
      setTimeout(() => {
        if (!cancelled) {
          setVisible((prev) => prev.filter((v) => v.uid !== uid));
        }
      }, SHOW_DURATION);
    };

    // Initial delay, then stagger
    let interval: ReturnType<typeof setInterval>;
    const startTimeout = setTimeout(() => {
      show();
      interval = setInterval(show, STAGGER);
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 overflow-hidden">
      {/* ── Ghost activity signals ── */}
      <div className="absolute inset-0 pointer-events-none hidden sm:block" aria-hidden="true">
        <AnimatePresence>
          {visible.map(({signalIdx, uid}) => {
            const signal = GHOST_SIGNALS[signalIdx];
            return (
              <motion.div
                key={uid}
                className="absolute rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm shadow-xl shadow-black/30"
                style={{top: signal.top, left: signal.left}}
                initial={{opacity: 0, y: 10, scale: 0.92}}
                animate={{opacity: 1, y: 0, scale: 1}}
                exit={{opacity: 0, y: -10, scale: 0.92}}
                transition={{duration: 0.8, ease: 'easeOut'}}
              >
                <SignalCard signal={signal} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Hero content ── */}
      <div className="relative z-10 max-w-[640px] mx-auto text-center">
        <motion.h1
          className="text-[44px] sm:text-[58px] lg:text-[72px] font-bold leading-[1.05] tracking-[-0.035em]"
          initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.1}}
        >
          Your game deserves
          <br />
          <span className="text-[#00beff]">its own home</span>
        </motion.h1>

        <motion.p
          className="mt-6 text-[17px] sm:text-[19px] leading-[1.65] text-[#8a8ba7] max-w-[540px] mx-auto"
          initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.2}}
        >
          Everything you need to launch, grow, and manage your game&apos;s presence from one place.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6, delay: 0.35}}
        >
          <a href="/signup" className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white bg-[#00beff] hover:bg-[#009dd6] px-6 py-2.5 rounded-full no-underline transition-colors duration-200">
            Claim your game link <ArrowRightIcon size={15} />
          </a>
          <a href="#features" className="text-[14px] font-medium text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">
            &rarr; See it in action
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Showcase ─────────────────────────────────────────────────────
// 5-column parallax grid — even columns have desktop screenshots, odd have colored boxes

type ShowcaseCard = {bg: string; h: string; screenshot?: boolean};

const SHOWCASE_COLS: ShowcaseCard[][] = [
  // Col 0 — colored boxes
  [{bg: '#13151e', h: '220px'}, {bg: '#161822', h: '280px'}, {bg: '#141620', h: '200px'}],
  // Col 1 — desktop screenshots
  [{bg: '#111320', h: '260px', screenshot: true}, {bg: '#151724', h: '240px', screenshot: true}, {bg: '#131520', h: '220px', screenshot: true}],
  // Col 2 — colored boxes
  [{bg: '#151721', h: '240px'}, {bg: '#121420', h: '260px'}, {bg: '#161822', h: '220px'}],
  // Col 3 — desktop screenshots
  [{bg: '#121421', h: '280px', screenshot: true}, {bg: '#141622', h: '220px', screenshot: true}, {bg: '#111320', h: '260px', screenshot: true}],
  // Col 4 — colored boxes
  [{bg: '#161820', h: '200px'}, {bg: '#131522', h: '260px'}, {bg: '#151720', h: '240px'}],
];

function DesktopScreenshot({bg, h}: {bg: string; h: string}) {
  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden flex flex-col" style={{backgroundColor: bg, height: h}}>
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
        <div className="w-2 h-2 rounded-full bg-white/10" />
        <div className="w-2 h-2 rounded-full bg-white/10" />
        <div className="w-2 h-2 rounded-full bg-white/10" />
        <div className="flex-1 mx-2 h-4 rounded-md bg-white/[0.04]" />
      </div>
      {/* Content area — fake UI */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        {/* Nav bar */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-2 rounded-full bg-white/[0.08]" />
          <div className="flex gap-2">
            <div className="w-8 h-2 rounded-full bg-white/[0.05]" />
            <div className="w-8 h-2 rounded-full bg-white/[0.05]" />
            <div className="w-8 h-2 rounded-full bg-white/[0.05]" />
          </div>
        </div>
        {/* Hero block */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 mt-2">
          <div className="w-3/4 h-3 rounded-full bg-white/[0.08]" />
          <div className="w-1/2 h-2 rounded-full bg-white/[0.05]" />
          <div className="w-16 h-4 rounded-full bg-[#00beff]/20 mt-2" />
        </div>
        {/* Bottom cards */}
        <div className="flex gap-1.5 mt-auto">
          <div className="flex-1 h-8 rounded-md bg-white/[0.04]" />
          <div className="flex-1 h-8 rounded-md bg-white/[0.04]" />
          <div className="flex-1 h-8 rounded-md bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function Showcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {scrollYProgress} = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const yDown = useTransform(scrollYProgress, [0, 1], ['-40px', '40px']);
  const yUp = useTransform(scrollYProgress, [0, 1], ['40px', '-40px']);

  return (
    <section ref={containerRef} className="py-[40px] sm:py-[60px] overflow-hidden">
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 px-4">
        {SHOWCASE_COLS.map((col, colIdx) => (
          <motion.div
            key={colIdx}
            className="flex flex-col gap-4"
            style={{y: colIdx % 2 === 0 ? yDown : yUp}}
          >
            {col.map((card, cardIdx) =>
              card.screenshot ? (
                <DesktopScreenshot key={cardIdx} bg={card.bg} h={card.h} />
              ) : (
                <div
                  key={cardIdx}
                  className="rounded-xl border border-white/[0.06] overflow-hidden"
                  style={{backgroundColor: card.bg, height: card.h}}
                />
              )
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Value Props ───────────────────────────────────────────────────
function ValueProps() {
  return (
    <section className="py-[80px] sm:py-[100px] px-5">
      <FadeUp>
        <h2 className="text-[28px] sm:text-[36px] font-bold text-center leading-[1.15] mb-3">
          Boost your game&apos;s visibility
        </h2>
        <p className="text-[16px] text-[#8a8ba7] text-center max-w-[480px] mx-auto mb-14">
          It&apos;s time to give your game the presence it deserves
        </p>
      </FadeUp>
      <div className="max-w-[960px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        {VALUE_PROPS.map((prop, i) => (
          <StaggerItem key={prop.title} index={i} className="text-center">
            <div className="w-[64px] h-[64px] mx-auto mb-5 rounded-2xl flex items-center justify-center bg-[#00beff]/10">
              <prop.icon size={28} className="text-[#00beff]" />
            </div>
            <h3 className="text-[15px] font-semibold text-white mb-1.5">{prop.title}</h3>
            <p className="text-[13px] leading-[1.6] text-[#8a8ba7]">{prop.desc}</p>
          </StaggerItem>
        ))}
      </div>
    </section>
  );
}

// ─── Testimonials ──────────────────────────────────────────────────
function Testimonials() {
  return (
    <section id="testimonials" className="py-[80px] sm:py-[100px] px-5">
      <FadeUp>
        <h2 className="text-[28px] sm:text-[36px] font-bold text-center leading-[1.15] mb-14">
          Approved by <span className="text-[#00beff]">professionals</span>
        </h2>
      </FadeUp>
      <div className="max-w-[1060px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <StaggerItem key={t.name} index={i}>
            <div className="bg-[#141418] rounded-xl p-5 border border-white/[0.06] h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white bg-[#00beff] shrink-0">{t.avatar}</div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">{t.name}</p>
                  <p className="text-[12px] text-[#8a8ba7] truncate">{t.role}</p>
                </div>
              </div>
              <p className="text-[13px] leading-[1.7] text-[#a0a1b8] flex-1">&ldquo;{t.quote}&rdquo;</p>
            </div>
          </StaggerItem>
        ))}
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────
function FeatureSection() {
  return (
    <section id="features" className="py-[80px] sm:py-[100px] px-5">
      <FadeUp>
        <h2 className="text-[28px] sm:text-[36px] font-bold text-center leading-[1.15] mb-3">The only platform you need</h2>
        <p className="text-[16px] text-[#8a8ba7] text-center max-w-[460px] mx-auto mb-14">One link for your game. Built-in tools for marketing, analytics, and press.</p>
      </FadeUp>
      <div className="max-w-[960px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <StaggerItem key={f.title} index={i}>
            <div className="bg-[#141418] rounded-xl p-6 border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-200 h-full">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#00beff]/10">
                <f.icon size={20} className="text-[#00beff]" />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-[13px] leading-[1.65] text-[#8a8ba7]">{f.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────
function Pricing() {
  return (
    <section id="pricing" className="py-[80px] sm:py-[100px] px-5">
      <FadeUp>
        <h2 className="text-[28px] sm:text-[36px] font-bold text-center leading-[1.15] mb-3">Simple pricing</h2>
        <p className="text-[16px] text-[#8a8ba7] text-center max-w-[400px] mx-auto mb-14">Start for free. Upgrade when you&apos;re ready.</p>
      </FadeUp>
      <FadeUp delay={0.15}>
        <div className="max-w-[400px] mx-auto">
          <div className="bg-[#141418] rounded-2xl p-8 border border-white/[0.06] relative overflow-hidden">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[#00beff] rounded-full blur-[100px] opacity-[0.07] pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[13px] font-semibold tracking-[0.1em] uppercase text-[#00beff] mb-2">Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[48px] font-bold text-white leading-none">$0</span>
                <span className="text-[15px] text-[#8a8ba7]">/month</span>
              </div>
              <p className="text-[14px] text-[#8a8ba7] mb-8">Everything you need to launch</p>
              <ul className="space-y-3 mb-8">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-[14px] text-[#c4c5d6]">
                    <CheckIcon size={16} className="text-[#00beff] shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <a href="/signup" className="flex items-center justify-center gap-2 w-full text-[15px] font-semibold text-white bg-[#00beff] hover:bg-[#009dd6] py-3.5 rounded-full no-underline transition-colors duration-200">
                Get started <ArrowRightIcon size={15} />
              </a>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Final CTA + Footer ───────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="px-5 sm:px-10 pb-0 pt-[60px] sm:pt-[80px]">
      <FadeUp>
        <div className="max-w-[1200px] mx-auto rounded-3xl bg-[#00beff] relative overflow-hidden px-8 py-14 sm:px-14 sm:py-16">
          {/* Decorative icon */}
          <div className="absolute -top-6 left-10 sm:left-14 text-[64px] sm:text-[80px] leading-none select-none pointer-events-none opacity-80">🎮</div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10 pt-10 sm:pt-8">
            <div>
              <h2 className="text-[28px] sm:text-[36px] font-bold text-white leading-[1.15] mb-2">Claim your game link now</h2>
              <p className="text-[16px] text-white/70">Free forever. No credit card required.</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex text-white/90 text-[16px] tracking-wide">★★★★★</div>
                <span className="text-[13px] text-white/60">on Trustpilot</span>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
              <a href="/signup" className="inline-flex items-center gap-2.5 text-[16px] font-semibold text-[#00beff] bg-white hover:bg-white/90 px-10 py-4 rounded-2xl no-underline transition-colors duration-200 shadow-lg shadow-black/10">
                Claim your game link
              </a>
              <a href="#features" className="text-[14px] text-white/70 no-underline hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                🎁 It&apos;s free
              </a>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

function Footer() {
  return (
    <footer className="pt-16 pb-10 px-5 sm:px-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-8">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <a href="/" className="text-[20px] font-bold text-white no-underline tracking-tight inline-block mb-3">
            Play<span className="text-[#00beff]">.link</span>
          </a>
          <p className="text-[12px] text-[#5a5b73]">© {new Date().getFullYear()} Play.link.<br />All rights reserved.</p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-[13px] font-semibold text-white mb-4">Navigation</h4>
          <ul className="space-y-2.5 list-none p-0 m-0">
            <li><a href="/" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Home</a></li>
            <li><a href="#features" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Features</a></li>
            <li><a href="#pricing" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Pricing</a></li>
            <li><a href="/login" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Login</a></li>
            <li><a href="/signup" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Sign up</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-[13px] font-semibold text-white mb-4">Contact</h4>
          <ul className="space-y-2.5 list-none p-0 m-0">
            <li><a href="mailto:hello@play.link" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200 flex items-center gap-2"><MailIcon size={14} className="shrink-0" /> hello@play.link</a></li>
            <li><a href="#" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200 flex items-center gap-2">𝕏 Twitter</a></li>
            <li><a href="#" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200 flex items-center gap-2">Discord</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-[13px] font-semibold text-white mb-4">Legal</h4>
          <ul className="space-y-2.5 list-none p-0 m-0">
            <li><a href="#" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Privacy Policy</a></li>
            <li><a href="#" className="text-[13px] text-[#8a8ba7] no-underline hover:text-white transition-colors duration-200">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
