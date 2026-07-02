import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getOrganizationProfile, businessSubtypes, educationSubtypes, type ModuleKey, type OrganizationTypeKey } from '../organizationConfig';
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  Menu,
  ShieldCheck,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  User,
  Users,
  Upload,
  X,
  Sliders,
  Activity,
  Send,
  HelpCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Truck,
  History
} from 'lucide-react';

interface LandingPageProps {
  setAuthMode: (mode: 'login' | 'signup') => void;
  setAppMode: (mode: 'auth' | 'app' | 'onboarding') => void;
}

interface AuthPageProps {
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authName: string;
  authEmail: string;
  authPassword: string;
  setAuthName: (value: string) => void;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  setAppMode: (mode: 'auth' | 'app' | 'onboarding') => void;
}

interface OnboardingWizardProps {
  onComplete: (config: {
    profileType: OrganizationTypeKey;
    name: string;
    industry: string;
    subtype: string;
    location: string;
    currency: string;
    contactEmail: string;
    contactPhone: string;
    staffCount: number;
    modules: ModuleKey[];
    logoUrl: string;
  }) => void;
  setAppMode: (mode: 'auth' | 'app' | 'onboarding') => void;
}

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-[20px] border border-neutral-200 bg-white ${className}`}>{children}</div>;
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-black sm:text-3xl">{title}</h2>
      {copy ? <p className="mt-4 text-base leading-7 text-neutral-600">{copy}</p> : null}
    </div>
  );
}

function SidebarNavButton({ label, icon: Icon, active, onClick, badge }: { label: string; icon: any; active: boolean; onClick: () => void; badge?: number | string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
        active ? 'bg-[#8EE5C2]/15 border-l-2 border-[#8EE5C2] font-semibold text-black pl-2.5 shadow-mint-glow-sm' : 'text-black hover:bg-neutral-50 font-normal'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {badge !== undefined && badge !== null && badge !== '' ? (
        <span className="rounded-full bg-[#8EE5C2] px-2 py-0.5 text-[10px] font-semibold text-black">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function AppHeader({
  ownerName,
  currentOperatorId,
  staff,
  lowStockCount,
  loading,
  isDesktop,
  setMenuOpen,
  loadAllData,
  onOpenTagPage,
  tagCount,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectSearchResult,
  searchOpen,
  setSearchOpen
}: {
  ownerName: string;
  currentOperatorId: string;
  staff: Array<{ id: string; name: string; online: boolean }>;
  lowStockCount: number;
  loading: boolean;
  isDesktop: boolean;
  setMenuOpen: (value: boolean) => void;
  loadAllData: () => void;
  onOpenTagPage: () => void;
  tagCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: Array<{ id: string; label: string; hint: string; category: string; tab: string }>;
  onSelectSearchResult: (item: { id: string; label: string; hint: string; category: string; tab: string }) => void;
  searchOpen: boolean;
  setSearchOpen: (value: boolean) => void;
}) {
  const onlineMembers = [{ id: 'owner', name: ownerName, online: true }, ...staff.filter((member) => member.online)]
    .filter((member, index, list) => list.findIndex((item) => item.id === member.id) === index)
    .slice(0, 4);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-100 bg-white/95 px-3 backdrop-blur sm:px-5">
        <div className="flex items-center gap-2">
          {!isDesktop && (
            <button
              onClick={() => setMenuOpen(true)}
              className="-ml-1 rounded p-1 text-black transition-colors hover:bg-neutral-50"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {!isDesktop && (
            <div className="flex items-center gap-2">
              <img src="https://i.ibb.co/1f3mhnj4/file-000000009c0871f4a926f8036d1d614e.png" alt="Logo" className="h-5 w-5 object-contain" referrerPolicy="no-referrer" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold uppercase tracking-wider text-black">EENVOQ</span>
              </div>
            </div>
          )}
          {isDesktop && (
            <div className="relative">
              <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 text-neutral-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search everything"
                  className="w-44 border-0 bg-transparent text-sm text-black outline-none placeholder:text-neutral-400 sm:w-56"
                />
              </div>
              {searchQuery.trim().length > 0 && searchResults.length > 0 && (
                <div className="absolute left-0 top-full z-[70] mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectSearchResult(item)}
                      className="flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-neutral-50"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-black">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-neutral-500">{item.hint}</span>
                      </span>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {onlineMembers.map((member) => (
              <div
                key={member.id}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold text-black ${currentOperatorId === member.id ? 'border-black bg-black text-white' : 'border-[#8EE5C2] bg-[#F7FFF9]'}`}
                title={member.name}
              >
                {member.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </div>
            ))}
          </div>
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-black transition-colors hover:bg-neutral-100"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenTagPage}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 text-[11px] font-semibold text-black transition-colors hover:bg-neutral-100"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tag</span>
            {tagCount > 0 && (
              <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[#8EE5C2] px-1.5 py-0.5 text-[10px] font-semibold text-black">
                {tagCount}
              </span>
            )}
          </button>
          {lowStockCount > 0 && (
            <span className="hidden text-xs font-semibold text-black underline decoration-1 decoration-black whitespace-nowrap sm:inline">
              {lowStockCount} Warnings
            </span>
          )}
          <RefreshCw
            onClick={loadAllData}
            className={`h-4 w-4 cursor-pointer text-black transition-transform hover:rotate-45 ${loading ? 'animate-spin' : ''}`}
          />
        </div>
      </header>
      {!isDesktop && searchOpen && (
        <>
          <div className="fixed inset-0 top-14 z-50 bg-black/20 backdrop-blur-sm" onClick={handleCloseSearch} />
          <div className="fixed inset-x-0 top-14 z-[60] mx-2 rounded-b-2xl border border-neutral-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.15)]">
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
              <Search className="h-4 w-4 text-neutral-500" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search everything"
                className="flex-1 border-0 bg-transparent text-sm text-black outline-none placeholder:text-neutral-400"
              />
              <button type="button" onClick={handleCloseSearch} className="rounded-full p-1 text-neutral-500 transition-colors hover:bg-white hover:text-black" aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </div>
            {searchQuery.trim().length > 0 && searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSearchResult(item)}
                    className="flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-neutral-50"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-black">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-neutral-500">{item.hint}</span>
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.trim().length > 0 && searchResults.length === 0 && (
              <div className="mt-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-500">
                No results yet. Try a product, customer, supplier, or page label.
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function MetricCard({ label, value, accent = true }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bg-white shadow-sm border border-neutral-200/60 rounded-lg p-3 relative overflow-hidden">
      {accent && <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#8EE5C2]"></div>}
      <p className="text-xs font-normal text-neutral-400 pl-1">{label}</p>
      <div className="text-sm font-semibold text-black pl-1">{value}</div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(142,229,194,0.18),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f6f7f7_100%)] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.04)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.02)_50%,transparent_100%)]" />
      <div className="relative grid gap-3">
        <div className="rounded-[24px] border border-neutral-200 bg-white/90 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Operations</p>
              <p className="mt-1 text-sm font-semibold text-black">Command Center</p>
            </div>
            <div className="rounded-full border border-[#8EE5C2]/30 bg-[#8EE5C2]/10 px-3 py-1 text-[11px] font-medium text-neutral-700">Live</div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['Stock Ledger', 'Sales Orders', 'Eenvoq AI'].map((label) => (
              <div key={label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{label}</p>
                <div className="mt-2 h-2 rounded-full bg-neutral-200">
                  <div className="h-2 w-3/4 rounded-full bg-[#8EE5C2]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-neutral-200 bg-white/90 p-4">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#8EE5C2]" />
              <p className="text-sm font-semibold text-black">Predictive demand flow</p>
            </div>
            <div className="mt-4 flex items-end gap-2">
              {[48, 72, 54, 84, 64].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-full bg-neutral-200" style={{ height: `${height}px` }}>
                  <div className="rounded-t-full bg-[#8EE5C2]" style={{ height: `${height - 16}px` }} />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-[#111111] p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">Team view</p>
                <p className="mt-1 text-sm font-semibold">Operators aligned</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-neutral-300">Live</div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div className="flex-1 rounded-[20px] border border-white/10 bg-white/10 p-3">
                <div className="h-16 w-16 rounded-full border border-[#8EE5C2]/50 bg-[radial-gradient(circle_at_center,_#8EE5C2_0%,_#111_70%)]" />
                <p className="mt-3 text-sm font-semibold">Mina</p>
                <p className="text-xs text-neutral-400">Operations Lead</p>
              </div>
              <div className="flex-1 rounded-[20px] border border-white/10 bg-white/10 p-3">
                <div className="h-16 w-16 rounded-full border border-[#8EE5C2]/50 bg-[radial-gradient(circle_at_center,_#c8f5e1_0%,_#111_70%)]" />
                <p className="mt-3 text-sm font-semibold">Jules</p>
                <p className="text-xs text-neutral-400">Inventory Ops</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ step, title, copy }: { step: string; title: string; copy: string }) {
  return (
    <div className="rounded-[22px] border border-neutral-200 bg-white p-5 transition duration-300 hover:-translate-y-1">
      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">{step}</p>
      <h3 className="mt-3 text-lg font-semibold text-black">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-neutral-600">{copy}</p>
    </div>
  );
}

function LandingPage({ setAuthMode, setAppMode }: LandingPageProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroTitleRef = useRef<HTMLHeadingElement | null>(null);
  const heroVisualRef = useRef<HTMLDivElement | null>(null);
  const heroCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(heroTitleRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo(heroVisualRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.1, ease: 'power3.out' });
      gsap.to(heroCardRefs.current.filter(Boolean) as Array<HTMLElement>, {
        y: (index: number) => ([-8, 8, -5][index] ?? 0),
        rotation: (index: number) => ([-2, 2, 1][index] ?? 0),
        ease: 'none',
        scrollTrigger: { trigger: heroSectionRef.current, start: 'top 90%', end: 'bottom 10%', scrub: true },
      });
      const sectionBodies = Array.from(document.querySelectorAll<HTMLElement>('[data-section-body]'));
      sectionBodies.forEach((body) => {
        gsap.fromTo(body, { opacity: 0, y: 36, scale: 0.985 }, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: body,
            start: 'top 88%',
            end: 'bottom 20%',
            scrub: 1.2,
          },
        });
      });
      gsap.fromTo('.stat-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.stat-card', start: 'top 90%', once: true } });
      gsap.fromTo(ctaRef.current, { scale: 0.98, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: ctaRef.current, start: 'top 90%', once: true } });
    }, pageRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const sections = [
    {
      eyebrow: 'ALL-IN-ONE BUSINESS OPERATING SYSTEM',
      title: 'Run Your Entire Organization From One Intelligent Workspace',
      description: 'Sales. Inventory. Payments. Customers. Reports.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <p className="text-lg leading-8 text-neutral-700">Everything your team needs to operate efficiently, organized inside one beautifully simple platform.</p>
          <p className="mt-5 text-lg leading-8 text-neutral-700">Whether you run a retail store, school, warehouse, distribution business, or service company, Eenvoq helps you replace scattered records and manual processes with one connected space.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {['Easy setup', 'Friendly onboarding support', 'Secure cloud access', 'Built for growing organizations'].map((item) => (
              <div key={item} className="rounded-full border border-[#E6ECEA] bg-[#F3FFF9] px-3 py-2 text-sm text-[#1d7a53]">✓ {item}</div>
            ))}
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'THE CHALLENGE',
      title: 'Most Organizations Are Running On Fragments',
      description: 'Inventory is stored in one spreadsheet. Sales are recorded somewhere else. Payments are tracked manually.',
      content: (
        <div className="grid gap-6 rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:grid-cols-[1fr_0.95fr] lg:p-8">
          <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">The hidden cost</p>
            <p className="mt-4 text-lg leading-8 text-neutral-700">The biggest threat to operational growth isn\'t lack of customers. It\'s lack of visibility.</p>
            <p className="mt-4 text-lg leading-8 text-neutral-700">When your information lives in different places, you spend more time managing records than managing the business itself.</p>
          </div>
          <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#1d7a53]">Before Eenvoq</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
              {['Multiple spreadsheets', 'Paper records', 'Disconnected systems', 'Manual calculations', 'Endless searching', 'Delayed reporting'].map((item) => (
                <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.25em] text-[#1d7a53]">After Eenvoq</p>
            <ul className="mt-3 space-y-3 text-sm leading-7 text-neutral-700">
              {['One platform', 'One source of truth', 'Real-time updates', 'Automated reporting', 'Instant visibility', 'Better decisions'].map((item) => (
                <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'THE SOLUTION',
      title: 'One Platform. Complete Visibility.',
      description: 'Every part of your organization stays connected, creating clarity across the business.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
              <p className="text-lg leading-8 text-neutral-700">Imagine making a sale and instantly seeing inventory update. Imagine receiving a payment and having reports refresh automatically. Imagine viewing a customer profile and immediately seeing their entire history.</p>
              <p className="mt-5 text-lg leading-8 text-neutral-700">That\'s how Eenvoq works.</p>
            </div>
            <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#1d7a53]">What happens inside Eenvoq?</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                {['Sales update inventory', 'Inventory updates reporting', 'Payments update customer balances', 'Customer records update automatically', 'Reports generate in real time', 'Every action creates clarity across your organization'].map((item) => (
                  <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'INVENTORY INTELLIGENCE',
      title: 'Always Know Exactly What You Have In Stock',
      description: 'Inventory problems rarely appear overnight, which is why Eenvoq helps you stay ahead of them.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">With Eenvoq you can</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                {['Track inventory quantities in real time', 'Monitor stock movement across locations', 'Receive automatic low-stock alerts', 'View complete product history', 'Track inventory valuation', 'Manage purchases more confidently'].map((item) => (
                  <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
              <p className="text-lg leading-8 text-neutral-700">Instead of discovering shortages after customers complain, you\'ll know exactly when products are running low and what needs attention.</p>
              <p className="mt-5 text-lg leading-8 text-neutral-700">Better stock control. Better purchasing decisions. Better customer experiences.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'SALES OPERATIONS',
      title: 'Capture Every Sale. Understand Every Trend.',
      description: 'Every transaction tells a story, and Eenvoq helps you see it clearly.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Record sales effortlessly</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                {['Process transactions quickly', 'Generate receipts instantly', 'Track sales performance in real time', 'Monitor revenue growth', 'View historical sales activity', 'Analyze top-performing products'].map((item) => (
                  <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
              <p className="text-lg leading-8 text-neutral-700">See today\'s revenue. Track best-selling products. Monitor transaction volume. Identify trends early.</p>
              <p className="mt-5 text-lg leading-8 text-neutral-700">Sales information shouldn\'t be buried inside spreadsheets. It should be visible, understandable, and actionable.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'PAYMENTS & CASH FLOW',
      title: 'Get Paid Faster. Stay In Control.',
      description: 'Bring invoices, payment records, balances, and follow-up into one central system.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Create professional invoices in minutes</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                {['Generate invoices instantly', 'Customize billing details', 'Track payment status automatically', 'Record partial payments', 'Maintain complete payment histories', 'Keep all financial records organized and accessible'].map((item) => (
                  <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
              <p className="text-lg leading-8 text-neutral-700">Instead of chasing information across notebooks, spreadsheets, and messages, you can instantly see who has paid, who still owes, and what is overdue.</p>
              <p className="mt-5 text-lg leading-8 text-neutral-700">Healthy cash flow keeps organizations moving forward.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'PEOPLE MANAGEMENT',
      title: 'Every Relationship. One Complete Record.',
      description: 'Whether you\'re serving customers, students, or clients, Eenvoq keeps everything connected.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Keep everything connected</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                {['Contact information', 'Registration details', 'Payment history', 'Purchase records', 'Attendance information', 'Notes and activity logs', 'Outstanding balances', 'Historical interactions'].map((item) => (
                  <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
              <p className="text-lg leading-8 text-neutral-700">Need to check a customer\'s payment history or a student\'s tuition records? Everything is available in seconds.</p>
              <p className="mt-5 text-lg leading-8 text-neutral-700">When information is organized, service improves and relationships become stronger.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'BUSINESS INTELLIGENCE',
      title: 'Ask Questions. Get Instant Answers.',
      description: 'Most organizations have valuable data; Eenvoq helps you turn it into useful decisions.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Ask questions naturally</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
              {['Which products are running low?', 'Who still owes payments this month?', 'What were our best-selling products last week?', 'How much revenue did we generate this quarter?', 'What inventory should we reorder?'].map((item) => (
                <div key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">“{item}”</div>
              ))}
            </div>
            <p className="mt-5 text-lg leading-8 text-neutral-700">The assistant instantly reviews your records and provides simple, understandable answers—no formulas, no technical expertise required.</p>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'REPORTING',
      title: 'Turn Daily Activity Into Clear Decisions',
      description: 'Data is only valuable when people can understand it, and Eenvoq presents it clearly.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Monitor what matters most</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-neutral-700">
                {['Revenue growth', 'Sales performance', 'Inventory movement', 'Product performance', 'Payment collections', 'Outstanding balances', 'Customer activity', 'Operational trends'].map((item) => (
                  <li key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
              <p className="text-lg leading-8 text-neutral-700">Instead of spending hours building reports manually, generate meaningful insights in seconds and make better strategic decisions.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'WHO EENVOQ SERVES',
      title: 'One Platform. Multiple Industries.',
      description: 'Every organization manages information, but the challenge looks different from industry to industry.',
      content: (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { title: 'Retail Stores', copy: 'Track inventory, monitor sales performance, manage customers, and improve operational efficiency.' },
            { title: 'Schools', copy: 'Manage student records, tuition payments, attendance, administrative processes, and reporting from one system.' },
            { title: 'Retail & Service Businesses', copy: 'Track customers, inventory, payments, and operational performance with greater visibility.' },
            { title: 'Warehouses', copy: 'Monitor inventory movement, stock levels, fulfillment workflows, and operational performance.' },
            { title: 'Distributors', copy: 'Manage purchasing, inventory, customers, deliveries, and revenue across multiple locations.' },
            { title: 'Service Businesses', copy: 'Track clients, payments, invoices, appointments, and operational performance from one workspace.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-[#E6ECEA] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
              <p className="text-base font-semibold text-black">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-neutral-600">{item.copy}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      eyebrow: 'REAL RESULTS',
      title: 'Less Administrative Chaos. More Operational Control.',
      description: 'The true value of software is found in outcomes, not features.',
      content: (
        <div className="grid gap-4 lg:grid-cols-4">
          {[
            { value: '38%', label: 'fewer inventory shortages' },
            { value: '26%', label: 'faster operational processing' },
            { value: '11+ Hours', label: 'saved every week' },
            { value: '99%', label: 'greater record accuracy' },
          ].map((item) => (
            <div key={item.label} className="stat-card rounded-[24px] border border-[#E6ECEA] bg-white p-6 text-center shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
              <p className="text-4xl font-semibold tracking-[-0.03em] text-black">{item.value}</p>
              <p className="mt-2 text-sm text-neutral-600">{item.label}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'stories',
      eyebrow: 'REAL ORGANIZATIONS. REAL RESULTS.',
      title: 'From Scattered Records To Complete Visibility.',
      description: 'Different organizations. Different challenges. One outcome: greater clarity and control.',
      content: (
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: 'Retail Business Owner', before: 'We tracked inventory in spreadsheets and recorded sales in separate systems.', after: 'Inventory levels began updating automatically with every sale and low-stock alerts helped the team stay ahead of demand.', result: 'Inventory shortages dropped significantly and staff spent less time checking stock levels.' },
            { title: 'School Administrator', before: 'Student records, tuition payments, and attendance information were stored across multiple files and notebooks.', after: 'The school centralized student information, tuition records, attendance history, and reporting inside Eenvoq.', result: 'Administrative work became dramatically easier and leadership gained real-time visibility.' },
            { title: 'Retail Operations Team', before: 'Customer information, inventory counts, and sales records were managed manually.', after: 'Everything was moved into a single organized system.', result: 'Staff gained greater visibility while reducing administrative workload and improving customer service.' },
          ].map((story) => (
            <div key={story.title} className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-5">
              <p className="text-base font-semibold text-black">{story.title}</p>
              <p className="mt-3 text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Before</p>
              <p className="mt-2 text-sm leading-7 text-neutral-700">{story.before}</p>
              <p className="mt-5 text-sm font-medium uppercase tracking-[0.25em] text-[#1d7a53]">After</p>
              <p className="mt-2 text-sm leading-7 text-neutral-700">{story.after}</p>
              <p className="mt-5 text-sm font-semibold text-black">Result</p>
              <p className="mt-2 text-sm leading-7 text-neutral-700">{story.result}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      eyebrow: 'SECURITY YOU CAN DEPEND ON',
      title: 'Built For Organizations That Cannot Afford Mistakes',
      description: 'Your records deserve protection, and security is built into every layer of Eenvoq.',
      content: (
        <div className="rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Automatic daily backups', copy: 'Your information is continuously protected to help prevent data loss and maintain business continuity.' },
              { title: 'Activity logs', copy: 'Track important actions across your organization and maintain complete visibility into operational changes.' },
              { title: 'Role-based permissions', copy: 'Control who can access specific information and ensure employees only see what they need.' },
              { title: 'Secure cloud infrastructure', copy: 'Access your data safely from anywhere while maintaining high levels of protection and reliability.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[20px] border border-[#E6ECEA] bg-[#FAFAF8] p-5">
                <p className="text-base font-semibold text-black">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      eyebrow: 'THE EENVOQ ADVANTAGE',
      title: 'Most Software Stores Information. Eenvoq Helps You Use It.',
      description: 'The difference may seem small; the impact is enormous.',
      content: (
        <div className="grid gap-6 rounded-[30px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:grid-cols-2 lg:p-8">
          <div className="rounded-[24px] border border-[#E6ECEA] bg-[#FAFAF8] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Traditional software</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              {['Stores data', 'Requires users to constantly monitor reports', 'Creates additional administrative work', 'Shows isolated information', 'Designed primarily for technical users'].map((item) => (
                <div key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-[#42E8B4]/20 bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F8FAF9_100%)] p-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#1d7a53]">Eenvoq</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-700">
              {['Transforms data into actionable insights', 'Proactively highlights important issues', 'Automates repetitive processes and reduces workload', 'Connects sales, inventory, payments, customers, and reporting into one ecosystem', 'Designed for everyday teams, managers, administrators, and business owners'].map((item) => (
                <div key={item} className="rounded-[14px] border border-[#E6ECEA] bg-white px-4 py-3">{item}</div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const sectionImages: Record<string, { src: string; alt: string }> = {
    'Run Your Entire Organization From One Intelligent Workspace': { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', alt: 'A collaborative workspace showing connected operations and planning' },
    'Most Organizations Are Running On Fragments': { src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80', alt: 'A modern office desk with scattered documents and devices' },
    'One Platform. Complete Visibility.': { src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80', alt: 'An organized workspace with a clean desk and elegant lighting' },
    'Always Know Exactly What You Have In Stock': { src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', alt: 'Warehouse shelving and organized inventory stock' },
    'Capture Every Sale. Understand Every Trend.': { src: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80', alt: 'A dashboard showing sales and financial information' },
    'Get Paid Faster. Stay In Control.': { src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80', alt: 'A polished finance workspace with invoices and receipts' },
    'Every Relationship. One Complete Record.': { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80', alt: 'A warm team environment focused on relationships and service' },
    'Ask Questions. Get Instant Answers.': { src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', alt: 'An assistant-style interface for operational guidance' },
    'Turn Daily Activity Into Clear Decisions': { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80', alt: 'A dashboard view with analytics and reporting visuals' },
    'One Platform. Multiple Industries.': { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', alt: 'A collaborative planning room with multiple organization contexts' },
    'Less Administrative Chaos. More Operational Control.': { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80', alt: 'A professional reviewing growth metrics and goals' },
    'From Scattered Records To Complete Visibility.': { src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80', alt: 'A professional sharing a success story in a calm workspace' },
    'Built For Organizations That Cannot Afford Mistakes': { src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80', alt: 'A secure and carefully organized workspace with confidence' },
    'Most Software Stores Information. Eenvoq Helps You Use It.': { src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', alt: 'A thoughtful team exploring a better workflow together' },
  };

  const pricingPlans = [
    { name: 'Starter', price: '$0', description: 'Perfect for teams that want a calm first step.', features: ['1 workspace', 'Core stock and sales visibility', 'Email support'] },
    { name: 'Growth', price: '$49', description: 'For growing teams that need more coordination.', features: ['Unlimited workspaces', 'Advanced reporting', 'Priority support'] },
    { name: 'Scale', price: '$149', description: 'For multi-location or high-volume organizations.', features: ['Multi-team access', 'Automation workflows', 'Dedicated onboarding'] },
    { name: 'Enterprise', price: '$299', description: 'For organizations that need deeper control.', features: ['Custom permissions', 'Advanced integrations', 'Strategic success support'] },
  ];

  const faqs = [
    { question: 'Who is Eenvoq built for?', answer: 'Growing businesses and schools that want more clarity without more complexity.' },
    { question: 'How quickly can a team get started?', answer: 'Most teams can begin with a simple workspace setup in a single afternoon.' },
    { question: 'Can Eenvoq replace multiple tools?', answer: 'Yes. It brings stock, sales, people, payments, and daily operations into one clear experience.' },
    { question: 'Is the experience comfortable for non-technical users?', answer: 'Absolutely. The interface is designed to feel calm, readable, and approachable from day one.' },
    { question: 'How secure is sensitive information?', answer: 'Your records are protected with daily backups, secure history logging, and encryption.' },
    { question: 'Can we use it for a school?', answer: 'Yes. It works beautifully for tuition tracking, attendance, and operational planning.' },
    { question: 'Does it support invoices and payments?', answer: 'Yes. You can organize invoices, receipts, and revenue trends in one clean place.' },
    { question: 'Can multiple people use the same workspace?', answer: 'Yes. Teams can collaborate with shared visibility and simple permission controls.' },
    { question: 'Is there a free option?', answer: 'Yes. The Starter plan is free so teams can begin comfortably.' },
    { question: 'What happens after onboarding?', answer: 'You keep a calm, structured system that helps your team make better decisions every day.' },
    { question: 'Can I manage inventory across multiple locations?', answer: 'Yes. Eenvoq helps teams monitor stock movement, inventory status, and fulfillment across different sites.' },
    { question: 'What kinds of reports can I generate?', answer: 'You can review revenue, product performance, payment status, inventory movement, and overall operational trends in clear dashboards.' },
  ];

  return (
    <div ref={pageRef} className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-black">
      <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-[#f7faf8]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/1f3mhnj4/file-000000009c0871f4a926f8036d1d614e.png" alt="Eenvoq logo" className="h-10 w-10 object-contain" referrerPolicy="no-referrer" />
            <div>
              <p className="text-base font-semibold tracking-tight">Eenvoq</p>
              <p className="text-xs text-neutral-500">Operations, simplified</p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-neutral-600 md:flex">
            <a href="#hero" className="transition hover:text-black">Home</a>
            <a href="#stories" className="transition hover:text-black">Stories</a>
            <a href="#faq" className="transition hover:text-black">FAQ</a>
            <button onClick={() => { setAuthMode('login'); setAppMode('auth'); }} className="transition text-neutral-600 hover:text-black">Login</button>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-neutral-300 bg-white text-black md:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => { setAuthMode('login'); setAppMode('auth'); }} className="hidden rounded-[4px] border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-black transition hover:border-[#4b7a6f] hover:text-[#1d7a53] sm:inline-flex">Log In</button>
            <button onClick={() => { setAuthMode('signup'); setAppMode('auth'); }} className="rounded-[4px] bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f1f1f]">Get Started</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-black/5 bg-[#f7faf8]/95 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm text-neutral-700">
              <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="transition hover:text-black">Home</a>
              <a href="#stories" onClick={() => setMobileMenuOpen(false)} className="transition hover:text-black">Stories</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="transition hover:text-black">FAQ</a>
              <button onClick={() => { setMobileMenuOpen(false); setAuthMode('login'); setAppMode('auth'); }} className="text-left transition hover:text-black">Login</button>
              <button onClick={() => { setMobileMenuOpen(false); setAuthMode('signup'); setAppMode('auth'); }} className="rounded-[4px] bg-black px-4 py-2 text-left text-sm font-medium text-white">Get Started</button>
            </div>
          </div>
        )}
      </header>

      <main className="flex flex-col pb-20">
        <section id="hero" ref={heroSectionRef} className="w-full border-b border-[#E6ECEA] bg-[radial-gradient(circle_at_top_left,_rgba(66,232,180,0.16),_transparent_38%),linear-gradient(135deg,_#FCFCFA_0%,_#F7FAF8_100%)] px-6 pt-4 pb-10 sm:px-8 sm:pt-8 sm:pb-14 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8E4] bg-[#F3FFF9] px-3 py-1 text-sm text-[#1d7a53]">
                <span className="h-2 w-2 rounded-full bg-[#42E8B4]" />
                ALL-IN-ONE BUSINESS OPERATING SYSTEM
              </div>
              <h1 ref={heroTitleRef} className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-black sm:text-5xl lg:text-6xl">
                Run Your Entire Organization From One Intelligent Workspace
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600">
                Whether you run a retail store, school, warehouse, distribution business, or service company, Eenvoq helps you replace scattered records, disconnected tools, and manual processes with one connected space.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => { setAuthMode('signup'); setAppMode('auth'); }} className="rounded-[4px] bg-[#42E8B4] px-5 py-2.75 text-sm font-semibold text-black transition hover:bg-[#2ddca8]">Start Free Trial</button>
                <button onClick={() => { setAuthMode('login'); setAppMode('auth'); }} className="rounded-[4px] border border-[#E6ECEA] bg-white px-5 py-2.75 text-sm font-semibold text-neutral-700 transition hover:border-[#42E8B4]">Book a Demo</button>
              </div>
              <div className="mt-7 flex flex-wrap gap-3 text-sm text-neutral-700">
                {['No complicated setup', 'Friendly onboarding support', 'Secure cloud access', 'Built for growing organizations'].map((item) => (
                  <div key={item} className="rounded-full border border-[#E6ECEA] bg-white/80 px-3 py-2">✓ {item}</div>
                ))}
              </div>
            </div>

            <div ref={heroVisualRef} className="rounded-[8px] border border-[#E6ECEA] bg-white p-4 shadow-[0_24px_90px_rgba(0,0,0,0.05)]">
              <div className="mb-3 overflow-hidden rounded-[8px] border border-[#E6ECEA]">
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80" alt="A calm workspace showing key operations modules" loading="lazy" decoding="async" className="h-44 w-full object-cover" />
              </div>
              <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                <div ref={(element) => { heroCardRefs.current[0] = element; }} className="rounded-[8px] border border-[#E6ECEA] bg-[#F3FFF9] p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Sales overview</p>
                  <div className="mt-4 rounded-[18px] border border-[#E6ECEA] bg-white p-4">
                    <p className="text-sm font-semibold text-black">Revenue this week</p>
                    <p className="mt-2 text-2xl font-semibold text-black">$12.4k</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div ref={(element) => { heroCardRefs.current[1] = element; }} className="rounded-[8px] border border-[#E6ECEA] bg-[#FAFAF8] p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Inventory status</p>
                    <div className="mt-3 flex items-center justify-between rounded-[6px] border border-[#E6ECEA] bg-white px-3 py-3 text-sm text-neutral-700">
                      <span>Low stock alerts</span>
                      <span className="text-[#1d7a53]">3 items</span>
                    </div>
                  </div>
                  <div ref={(element) => { heroCardRefs.current[2] = element; }} className="rounded-[8px] border border-[#0D0D0D] bg-[#0D0D0D] p-5 text-white">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#42E8B4]">AI assistant</p>
                    <div className="mt-3 rounded-[6px] border border-white/10 bg-white/10 px-3 py-3 text-sm text-neutral-300">Which products are running low?</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {sections.map((section, index) => {
          const image = sectionImages[section.title];

          return (
            <section key={section.title} id={section.id} className={`w-full px-6 py-16 sm:px-8 lg:px-12 lg:py-24 ${index % 2 === 1 ? 'bg-white/70' : ''}`}>
              <div ref={(element) => { sectionRefs.current[index] = element; }} className="mx-auto max-w-7xl">
                <div className="mx-auto mb-8 max-w-3xl text-center">
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">{section.eyebrow}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">{section.title}</h2>
                  {section.description ? <p className="mt-4 text-lg leading-8 text-neutral-600">{section.description}</p> : null}
                </div>
                <div data-section-body className="w-full">
                  {image ? (
                    <div className="mb-8 overflow-hidden rounded-[8px] border border-[#dfe8e3] bg-white p-1 shadow-[0_18px_60px_rgba(0,0,0,0.04)]">
                      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="h-64 w-full rounded-[8px] object-cover sm:h-80" />
                    </div>
                  ) : null}
                  {section.content}
                </div>
              </div>
            </section>
          );
        })}

        <section ref={ctaRef} className="w-full px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl rounded-[8px] border border-[#E6ECEA] bg-[linear-gradient(135deg,_#F3FFF9_0%,_#F9FCFA_100%)] p-8 shadow-[0_20px_70px_rgba(0,0,0,0.04)] lg:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">READY TO SIMPLIFY OPERATIONS?</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">Everything Your Organization Needs. One Connected Platform.</h2>
              <p className="mt-4 text-lg leading-8 text-neutral-600">Whether you manage a retail business, a school, a warehouse, a distribution company, or a growing service organization, Eenvoq gives your team the tools, visibility, and intelligence needed to operate with confidence.</p>
              <div data-section-body className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={() => { setAuthMode('signup'); setAppMode('auth'); }} className="rounded-[6px] bg-[#42E8B4] px-5 py-2.75 text-sm font-semibold text-black transition hover:bg-[#2ddca8]">Start Your Free Trial</button>
                <button onClick={() => { setAuthMode('login'); setAppMode('auth'); }} className="rounded-[6px] border border-[#E6ECEA] bg-white px-5 py-2.75 text-sm font-semibold text-neutral-700 transition hover:border-[#42E8B4]">Book A Personalized Demo</button>
              </div>
              <div data-section-body className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-neutral-600">
                <span>✓ Setup assistance included</span>
                <span>✓ Secure cloud platform</span>
                <span>✓ Friendly onboarding support</span>
                <span>✓ No technical expertise required</span>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="w-full px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl rounded-[8px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] lg:p-8">
            <div className="mx-auto mb-8 max-w-3xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Helpful answers</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">Common questions before you get started.</h2>
            </div>
            <div data-section-body className="grid gap-4 md:grid-cols-2">
              {faqs.map((item) => (
                <div key={item.question} className="rounded-[8px] border border-[#E6ECEA] bg-[#FAFAF8] p-5">
                  <p className="text-base font-semibold text-black">{item.question}</p>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-6 pb-16 sm:px-8 lg:px-12 lg:pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-8 max-w-3xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Simple pricing</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">Choose the pace that fits your team.</h2>
            </div>
            <div data-section-body className="grid gap-4 lg:grid-cols-4">
              {pricingPlans.map((plan) => (
                <div key={plan.name} className="rounded-[8px] border border-[#E6ECEA] bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)]">
                  <p className="text-base font-semibold text-black">{plan.name}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-black">{plan.price}</p>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{plan.description}</p>
                  <ul className="mt-5 space-y-2 text-sm text-neutral-700">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#1d7a53]" />{feature}</li>
                    ))}
                  </ul>
                  <button className="mt-6 rounded-[4px] bg-[#8EE5C2] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#74dcb1]">Choose {plan.name}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-neutral-200 bg-white/80 px-6 py-8 text-sm text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/1f3mhnj4/file-000000009c0871f4a926f8036d1d614e.png" alt="Eenvoq logo" className="h-9 w-9 object-contain" referrerPolicy="no-referrer" />
            <div>
              <p className="text-sm font-semibold text-black">Eenvoq</p>
              <p className="text-xs text-neutral-500">Warm systems for organized teams</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <a href="#hero" className="transition hover:text-black">Home</a>
            <a href="#faq" className="transition hover:text-black">FAQ</a>
            <a href="#stories" className="transition hover:text-black">Stories</a>
            <a href="#" className="transition hover:text-black">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuthPage({ authMode, setAuthMode, authName, authEmail, authPassword, setAuthName, setAuthEmail, setAuthPassword, setAppMode }: AuthPageProps) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-neutral-50 px-4 py-4 sm:px-6 sm:py-10 lg:items-center lg:px-8">
      <div className="grid w-full max-w-5xl gap-4 rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.03)] lg:grid-cols-[0.95fr_1.05fr] lg:p-6">
        <div className="order-2 rounded-[20px] border border-neutral-200 bg-neutral-50 p-6 lg:order-1 lg:p-8">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/1f3mhnj4/file-000000009c0871f4a926f8036d1d614e.png" alt="Eenvoq logo" className="h-10 w-10 object-contain" referrerPolicy="no-referrer" />
            <div>
              <p className="text-sm font-semibold text-black">Eenvoq</p>
              <p className="text-xs text-neutral-500">Secure operations workspace</p>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <div className="rounded-[18px] border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-black">Control without clutter</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">Inventory, orders, customers, and AI guidance stay organized in one place.</p>
            </div>
            <div className="rounded-[18px] border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-black">Trusted by serious teams</p>
              <p className="mt-2 text-sm leading-7 text-neutral-600">Built for operators who need clarity, precision, and dependable workflows.</p>
            </div>
          </div>
        </div>

        <div className="order-1 rounded-[20px] border border-neutral-200 bg-white p-6 lg:order-2 lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">{authMode === 'signup' ? 'Create account' : 'Welcome back'}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-black">{authMode === 'signup' ? 'Start with Eenvoq' : 'Sign in to Eenvoq'}</h2>
            </div>
            <button onClick={() => setAppMode('onboarding')} className="text-sm text-neutral-500 transition hover:text-black">Back</button>
          </div>

          <div className="mt-6 flex rounded-full border border-neutral-200 p-1">
            <button onClick={() => setAuthMode('signup')} className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${authMode === 'signup' ? 'bg-black text-white' : 'text-neutral-600'}`}>Sign up</button>
            <button onClick={() => setAuthMode('login')} className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${authMode === 'login' ? 'bg-black text-white' : 'text-neutral-600'}`}>Log in</button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); setAppMode(authMode === 'signup' ? 'onboarding' : 'app'); }}>
            {authMode === 'signup' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-black">Full name</label>
                <input value={authName} onChange={(event) => setAuthName(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20" placeholder="Alex Morgan" />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-black">Email</label>
              <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20" placeholder="you@company.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-black">Password</label>
              <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:shadow-[0_0_22px_rgba(142,229,194,0.25)]">{authMode === 'signup' ? 'Create account' : 'Log in'}</button>
          </form>

          <div className="mt-6 rounded-2xl border border-[#8EE5C2]/30 bg-[#8EE5C2]/10 p-4 text-sm text-neutral-700">
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#8EE5C2]" /> Secure, private, and trusted by high-growth teams.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingWizard({ onComplete, setAppMode }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<OrganizationTypeKey>('business');
  const [name, setName] = useState('Your Business');
  const [industry, setIndustry] = useState('Business');
  const [location, setLocation] = useState('Accra, Nigeria');
  const [currency, setCurrency] = useState('NGN (₦)');
  const [contactEmail, setContactEmail] = useState('support@yourbusiness.com');
  const [contactPhone, setContactPhone] = useState('');
  const [staffCount, setStaffCount] = useState(1);
  const [modules, setModules] = useState<ModuleKey[]>(getOrganizationProfile('business').defaultModules);
  const [subtype, setSubtype] = useState<string>('');

  const requiredModules: ModuleKey[] = ['transactions', 'inventory', 'staff', 'reports', 'ai'];
  // Only keep industry options relevant to Business or Education
  const industryOptions = ['Business', 'Education'];
  const locationOptions = ['Accra, Ghana', 'Kumasi, Ghana', 'Lagos, Nigeria', 'Nairobi, Kenya', 'London, UK', 'New York, USA'];

  // Keep profileType and industry aligned; enforce only 'business' or 'school'
  useEffect(() => {
    if (industry === 'Education') setProfileType('school');
    else setProfileType('business');
  }, [industry]);
  const currencyOptions = [
    { value: 'NGN (₦)', label: 'NGN' },
    { value: 'Ghana Cedis (₵)', label: 'Ghana cedis' },
    { value: 'Kenyan Shillings (KSh)', label: 'Kenyan shillings' },
    { value: 'USD ($)', label: 'USD' },
    { value: 'GBP (£)', label: 'GBP' }
  ];

  useEffect(() => {
    const profileDefaults = getOrganizationProfile(profileType).defaultModules;
    setModules(Array.from(new Set([...requiredModules, ...profileDefaults])));
  }, [profileType]);

  useEffect(() => {
    if (location.includes('Nigeria')) {
      setCurrency('NGN (₦)');
    }
  }, [location]);

  const profile = getOrganizationProfile(profileType);
  const availableModules = Array.from(new Set([...requiredModules, ...profile.defaultModules]));
  const toggleModule = (id: ModuleKey) => {
    if (requiredModules.includes(id)) return;
    setModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleComplete = () => {
    if (!subtype) {
      // Prevent completion if subtype not selected
      alert('Please select a specific type for your organization (e.g. Retail Store, Primary School).');
      return;
    }
    onComplete({
      profileType,
      name,
      industry,
      subtype,
      location,
      currency,
      contactEmail,
      contactPhone,
      staffCount,
      modules,
      logoUrl: ''
    });
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-neutral-50 px-4 py-4 sm:px-6 sm:py-10 lg:items-center lg:px-8">
      <div className="w-full max-w-5xl rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.03)] lg:p-6">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">Personalize your workspace</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-black">Configure Eenvoq for your organization</h2>
          </div>
          <button onClick={() => setAppMode('auth')} className="text-sm text-neutral-500 transition hover:text-black">Back</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`rounded-full px-3 py-1.5 text-sm font-medium ${step === item ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              Step {item}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {/* Primary selection: Business or Education */}
            <button type="button" onClick={() => setIndustry('Business')} className={`rounded-[20px] border p-4 text-left transition ${profileType === 'business' ? 'border-[#8EE5C2] bg-[#F7FFF9]' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
              <p className="text-sm font-semibold text-black">Business</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Commercial businesses: retail, wholesale, services, hospitality, manufacturing, and e-commerce.</p>
            </button>
            <button type="button" onClick={() => setIndustry('Education')} className={`rounded-[20px] border p-4 text-left transition ${profileType === 'school' ? 'border-[#8EE5C2] bg-[#F7FFF9]' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}>
              <p className="text-sm font-semibold text-black">Education</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Schools and institutions: primary, secondary, colleges, universities and training centers.</p>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-black">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Organization name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20" />
            </label>
            <label className="space-y-2 text-sm text-black">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Category</span>
              <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20">
                {industryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            {/* Subtype: depends on Business vs Education */}
            <label className="space-y-2 text-sm text-black">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Type</span>
              <select value={subtype} onChange={(e) => setSubtype(e.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20">
                <option value="">Select a type</option>
                {profileType === 'business' && businessSubtypes.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {profileType === 'school' && educationSubtypes.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {subtype === '' && <p className="mt-1 text-xs text-red-500">Please select a type to continue.</p>}
            </label>
            <label className="space-y-2 text-sm text-black">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Location</span>
              <select value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20">
                {locationOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-black">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Primary currency</span>
              <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20">
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-black">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Contact email</span>
              <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20" />
            </label>
            <label className="space-y-2 text-sm text-black">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Contact phone</span>
              <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20" />
            </label>
            <label className="space-y-2 text-sm text-black md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Team size</span>
              <input type="number" min="1" value={staffCount} onChange={(event) => setStaffCount(Number(event.target.value) || 1)} className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black focus:border-[#8EE5C2] focus:outline-none focus:ring-2 focus:ring-[#8EE5C2]/20" />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 space-y-4">
            <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-black">Recommended modules for {profile.label}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{profile.description}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {availableModules.map((id) => {
                const moduleId = id as ModuleKey;
                const active = modules.includes(moduleId);
                const isRequired = requiredModules.includes(moduleId);
                return (
                  <button key={moduleId} type="button" onClick={() => toggleModule(moduleId)} disabled={isRequired} className={`rounded-[18px] border px-4 py-3 text-left ${active ? 'border-[#8EE5C2] bg-[#F7FFF9]' : 'border-neutral-200 bg-white'} ${isRequired ? 'cursor-default opacity-90' : 'hover:border-neutral-300'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-black">{moduleId}</p>
                      {isRequired ? <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">Required</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{isRequired ? 'Compulsory for every workspace' : active ? 'Enabled for this workspace' : 'Optional module'}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {step > 1 && <button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black">Back</button>}
            <button type="button" onClick={() => setAppMode('auth')} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black">Skip for now</button>
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <button type="button" onClick={() => setStep((value) => Math.min(3, value + 1))} className="rounded-full border border-black bg-[#8EE5C2] px-4 py-2 text-sm font-semibold text-black">Continue</button>
            ) : (
              <button type="button" onClick={handleComplete} className="rounded-full border border-black bg-[#8EE5C2] px-4 py-2 text-sm font-semibold text-black">Finish setup</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { LandingPage, AuthPage, OnboardingWizard, SidebarNavButton, AppHeader, MetricCard };
