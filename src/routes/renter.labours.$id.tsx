import {
  createFileRoute,
  useNavigate,
  Link,
  Outlet,
  useChildMatches,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import {
  ArrowRight,
  Share2,
  Heart,
  BadgeCheck,
  Star,
  MapPin,
  Briefcase,
  Wallet,
  Clock,
  Phone,
  Mail,
  XCircle,
  User,
  MessageSquare,
  Sparkles,
  Award,
  Building2,
  Lock,
  ChevronLeft,
} from 'lucide-react'

export const Route = createFileRoute('/renter/labours/$id')({
  component: LabourProfilePage,
})

// ---------------------------------------------------------------------------
// Types — unchanged
// ---------------------------------------------------------------------------

interface WorkHistoryItem {
  id: string
  title: string
  employer?: string
  duration?: string
  description?: string
}

interface ReviewItem {
  id: string
  reviewerName?: string
  reviewerAvatar?: string
  rating: number
  comment?: string
  createdAt?: string
}

interface Labour {
  _id: string
  fullName?: string
  profileImage?: string
  primarySkill?: string
  experience?: number
  dailyCharges?: number
  village?: string
  district?: string
  state?: string
  availability?: boolean
  rating?: number
  totalReviews?: number
  mobile?: string
  isVerified?: boolean
  skills?: string[]
  languages?: string[]
  bio?: string
  email?: string
  showContact?: boolean
  workHistory?: WorkHistoryItem[]
  reviews?: ReviewItem[]
  completedJobs?: number
}

// ---------------------------------------------------------------------------
// API — unchanged
// ---------------------------------------------------------------------------

async function fetchLabour(id: string): Promise<Labour> {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const { data } = await axios.get(`${API_BASE}/api/labour/public/${id}`);
  return data?.data ?? data?.labour ?? data;
}

// ---------------------------------------------------------------------------
// Helpers — unchanged
// ---------------------------------------------------------------------------

function fallback<T extends string | number>(
  value: T | null | undefined,
  text = 'Not provided',
): T | string {
  return value === undefined || value === null || value === '' ? text : value
}

function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) return 'Not available'
  return `₹${amount.toLocaleString('en-IN')}`
}

// ---------------------------------------------------------------------------
// Premium card system
//
// Matches the reference: a thin, glassy blue-to-transparent gradient
// hairline that hugs the TOP edge and bleeds a little down the LEFT edge,
// dissolving into a barely-there neutral edge everywhere else — plus a
// soft, diffuse blue glow blob sitting inside the card's bottom-right
// interior, and a very light ambient drop shadow underneath the whole
// thing. Nothing here should ever read as a flat 1px grey line.
// ---------------------------------------------------------------------------

const cardRadius = 'rounded-[28px]'

// Outer + inner shadow stack:
// 1) inset top sheen (white)              → glassy highlight along the top
// 2) inset corner glow (blue, big blur)   → the soft interior blob, bottom-right
// 3) outer ambient shadow (very soft)     → lifts the card, no hard edge
const cardShadow =
  'shadow-[' +
    'inset_0_1px_0_0_rgba(255,255,255,0.8),' +
    'inset_-40px_-40px_70px_-45px_rgba(96,165,250,0.55),' +
    '0_16px_36px_-28px_rgba(15,23,42,0.18),' +
    '0_2px_10px_-4px_rgba(15,23,42,0.05)' +
  '] ' +
  'hover:shadow-[' +
    'inset_0_1px_0_0_rgba(255,255,255,0.9),' +
    'inset_-40px_-40px_70px_-40px_rgba(96,165,250,0.65),' +
    '0_20px_42px_-26px_rgba(15,23,42,0.22),' +
    '0_3px_14px_-4px_rgba(15,23,42,0.07)' +
  ']'

const cardCls = `${cardRadius} ${cardShadow} bg-white transition-shadow duration-300 relative overflow-hidden`

// Gradient-border trick: an opaque white fill clipped to the padding-box,
// sitting on top of a diagonal gradient clipped to the border-box. The
// gradient itself is a thin blue wash that's strongest along the top edge,
// bleeds a short distance down the left edge, then dissolves to a nearly
// invisible neutral hairline for the remaining right/bottom edges — exactly
// the "light hitting from top-left" look in the reference.
const cardGlowStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(#ffffff, #ffffff), ' +
    'linear-gradient(160deg, ' +
      'rgba(59,130,246,0.5) 0%, ' +
      'rgba(96,165,250,0.32) 8%, ' +
      'rgba(191,219,254,0.16) 18%, ' +
      'rgba(226,232,240,0.55) 32%, ' +
      'rgba(226,232,240,0.55) 100%)',
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  border: '1px solid transparent',
}

// Decorative soft glow blob rendered inside every card, positioned in the
// bottom-right interior — purely visual, sits behind the content.
function CardGlowBlob() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full opacity-70"
      style={{
        background:
          'radial-gradient(circle, rgba(147,197,253,0.35) 0%, rgba(191,219,254,0.15) 45%, rgba(255,255,255,0) 72%)',
        filter: 'blur(2px)',
      }}
    />
  )
}

// Responsive card padding: 20px mobile / 24px tablet / 32px desktop.
const cardPad = 'p-5 sm:p-6 lg:p-8'

// ---------------------------------------------------------------------------
// Shared button system — Share / Save / Hire all share height, radius,
// padding; only fill + tone differ.
// ---------------------------------------------------------------------------

const btnBase =
  'h-12 inline-flex items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40'

const primaryBtnCls = `${btnBase} bg-gradient-to-r from-primary to-green-600 text-white shadow-[0_4px_14px_0_rgba(34,197,94,0.35)] hover:shadow-[0_6px_20px_0_rgba(34,197,94,0.45)] hover:-translate-y-0.5 disabled:translate-y-0`

const outlineBtnCls =
  `${btnBase} border border-[#E5E7EB] bg-white text-[#374151] font-semibold hover:bg-[#F9FAFB]`

const savedBtnCls =
  `${btnBase} border border-primary bg-primary/5 text-primary font-semibold`

// ---------------------------------------------------------------------------
// Motion presets
// ---------------------------------------------------------------------------

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function LabourProfilePage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [isSaved, setIsSaved] = useState(false)

  const childMatches = useChildMatches()
  const isChildRouteActive = childMatches.length > 0

  const {
    data: labour,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['labour', id],
    queryFn: () => fetchLabour(id),
    retry: 1,
  })

  if (isChildRouteActive) return <Outlet />

  const handleShare = async () => {
    const shareData = {
      title: labour?.fullName ? `${labour.fullName} — FarmFleet` : 'Labour Profile — FarmFleet',
      text: 'Check out this labour profile on FarmFleet',
      url: typeof window !== 'undefined' ? window.location.href : '',
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else if (navigator.clipboard) await navigator.clipboard.writeText(shareData.url)
    } catch { /* cancelled */ }
  }

  const handleHire = () => navigate({ to: '/renter/labours/$id/hire', params: { id } })

  if (isLoading) return <LabourProfileSkeleton />

  if (isError) {
    return (
      <ErrorState
        message={
          axios.isAxiosError(error) && error.response?.status === 404
            ? 'Labour not found.'
            : 'Something went wrong while loading this profile.'
        }
        notFound={axios.isAxiosError(error) && error.response?.status === 404}
        onRetry={() => refetch()}
      />
    )
  }

  if (!labour) return <ErrorState message="Labour not found." notFound onRetry={() => refetch()} />

  return (
    <AppShell>
      {/* Subtle background tint */}
      <div className="min-h-screen bg-[#F9FAFB]">
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-6 pb-10 space-y-5">

          {/* ── Back nav ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Labours
            </button>
          </motion.div>

          {/* ── Hero Card (full width banner) ── */}
          <HeroCard
            labour={labour}
            isSaved={isSaved}
            onSave={() => setIsSaved(s => !s)}
            onShare={handleShare}
            onHire={handleHire}
          />

          {/* ── Stats Strip ── */}
          <StatsStrip labour={labour} />

          {/* ── Content sections ── */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start"
          >
            <div className="lg:col-span-2 space-y-5">
              <SkillsSection labour={labour} />
              <WorkHistorySection labour={labour} />
              <ReviewsSection labour={labour} />
            </div>
            <div className="space-y-5">
              <LocationSection labour={labour} />
              <ContactSection labour={labour} />
            </div>
          </motion.div>

        </section>
      </div>
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// Hero Card
// ---------------------------------------------------------------------------

function HeroCard({
  labour,
  isSaved,
  onSave,
  onShare,
  onHire,
}: {
  labour: Labour
  isSaved: boolean
  onSave: () => void
  onShare: () => void
  onHire: () => void
}) {
  const isAvailable = labour.availability === true
  const isUnavailable = labour.availability === false
  const locationStr =
    [labour.village, labour.district, labour.state].filter(Boolean).join(', ') ||
    'Location not available'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={cardGlowStyle}
      className={`${cardCls} ${cardPad}`}
    >
      <CardGlowBlob />
      <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">

        {/* Left: avatar + details */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1 min-w-0">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative">
              <div className="overflow-hidden rounded-full border-[3px] border-white bg-[#F3F4F6] shadow-[0_4px_20px_0_rgba(0,0,0,0.12)] ring-2 ring-[#E5E7EB] h-[90px] w-[90px] sm:h-[120px] sm:w-[120px] lg:h-[160px] lg:w-[160px]">
                {labour.profileImage ? (
                  <img
                    src={labour.profileImage}
                    alt={String(fallback(labour.fullName, 'Labour'))}
                    className="h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
                    <User className="h-8 w-8 sm:h-10 sm:w-10 lg:h-14 lg:w-14" />
                  </div>
                )}
              </div>
              {/* Online dot */}
              {isAvailable && (
                <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500 shadow">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
              )}
            </div>

            {/* Availability pill under avatar */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${
                isAvailable
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : isUnavailable
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-500' : isUnavailable ? 'bg-red-400' : 'bg-gray-400'}`}
              />
              {isAvailable ? 'Available Now' : isUnavailable ? 'Unavailable' : 'Unknown'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-[#111827]">
                {fallback(labour.fullName, 'Name not available')}
              </h1>
              {labour.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>

            <p className="mt-1 text-sm font-semibold text-primary">
              {fallback(labour.primarySkill, 'Skill not specified')}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-[#111827]">
                  {labour.rating !== undefined ? labour.rating.toFixed(1) : 'N/A'}
                </span>
                <span className="text-xs">({labour.totalReviews ?? 0} reviews)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {locationStr}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-primary" />
                {labour.experience !== undefined
                  ? `${labour.experience} yr${labour.experience === 1 ? '' : 's'} exp`
                  : 'Experience N/A'}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                {fallback(labour.completedJobs, '0')} jobs done
              </span>
            </div>
          </div>
        </div>

        {/* Right rail — desktop only: charges → hire → share → save, stacked */}
        <div className="hidden lg:flex w-[260px] shrink-0 flex-col gap-3">
          <div className="rounded-2xl border border-[#F3F4F6] bg-[#F9FAFB] px-5 py-4 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">Daily Charges</p>
            <p className="font-display text-3xl font-bold text-[#111827] leading-tight">
              {formatCurrency(labour.dailyCharges)}
            </p>
          </div>

          <button onClick={onHire} disabled={isUnavailable} className={`${primaryBtnCls} w-full`}>
            Hire Labour
            <ArrowRight className="h-4 w-4" />
          </button>

          <button onClick={onShare} className={`${outlineBtnCls} w-full`}>
            <Share2 className="h-4 w-4" />
            Share
          </button>

          <button onClick={onSave} className={`${isSaved ? savedBtnCls : outlineBtnCls} w-full`}>
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Mobile / tablet: charges + share/save row, hire button below profile info */}
      <div className="relative mt-6 lg:hidden pt-6 border-t border-[#F3F4F6] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">Daily Charges</p>
            <p className="font-display text-2xl font-bold text-[#111827]">
              {formatCurrency(labour.dailyCharges)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onShare}
              className="h-11 w-11 flex items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] transition"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={onSave}
              className={`h-11 w-11 flex items-center justify-center rounded-2xl border transition ${
                isSaved ? 'border-primary bg-primary/5 text-primary' : 'border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
              }`}
              aria-label={isSaved ? 'Saved' : 'Save'}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>
        <button onClick={onHire} disabled={isUnavailable} className={`${primaryBtnCls} w-full`}>
          Hire Labour
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Stats Strip
// ---------------------------------------------------------------------------

function StatsStrip({ labour }: { labour: Labour }) {
  const stats = [
    {
      icon: <Wallet className="h-5 w-5" />,
      label: 'Daily Charges',
      value: formatCurrency(labour.dailyCharges),
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      label: 'Experience',
      value:
        labour.experience !== undefined
          ? `${labour.experience} yr${labour.experience === 1 ? '' : 's'}`
          : 'N/A',
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: 'Jobs Done',
      value: String(fallback(labour.completedJobs, '0')),
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: 'Rating',
      value: labour.rating !== undefined ? labour.rating.toFixed(1) : 'N/A',
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 gap-4 sm:grid-cols-4 items-stretch"
    >
      {stats.map(({ icon, label, value }) => (
        <motion.div
          key={label}
          variants={fadeUp}
          transition={{ duration: 0.3 }}
          style={cardGlowStyle}
          className={`${cardCls} p-5 sm:p-6 flex h-full flex-col gap-3`}
        >
          <CardGlowBlob />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            {icon}
          </div>
          <div className="relative">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">{label}</p>
            <p className="mt-0.5 font-display text-xl font-bold text-[#111827]">{value}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Section wrapper — unified card style
// ---------------------------------------------------------------------------

function Section({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.section
      variants={fadeUp}
      transition={{ duration: 0.35, delay }}
      style={cardGlowStyle}
      className={`${cardCls} ${cardPad}`}
    >
      <CardGlowBlob />
      <h2 className="relative font-display text-base font-bold text-[#111827] flex items-center gap-2 mb-5">
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/8 text-primary">
            {icon}
          </span>
        )}
        {title}
      </h2>
      <div className="relative">{children}</div>
    </motion.section>
  )
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

function SkillsSection({ labour }: { labour: Labour }) {
  const skills = labour.skills && labour.skills.length > 0 ? labour.skills : []

  return (
    <Section title="Skills" icon={<Sparkles className="h-4 w-4" />}>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-1.5 text-sm font-medium text-[#374151] transition-all hover:-translate-y-0.5 hover:bg-primary/5 hover:border-primary/30 hover:text-primary hover:shadow-sm cursor-default"
            >
              {skill}
            </motion.span>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          heading="No skills listed"
          text="Skills will appear here once added."
        />
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Location (Languages removed per spec)
// ---------------------------------------------------------------------------

function LocationSection({ labour }: { labour: Labour }) {
  const locationFields = [
    { icon: <MapPin className="h-4 w-4" />, label: 'Village', value: labour.village },
    { icon: <MapPin className="h-4 w-4" />, label: 'District', value: labour.district },
    { icon: <MapPin className="h-4 w-4" />, label: 'State', value: labour.state },
  ]

  return (
    <Section title="Location" icon={<MapPin className="h-4 w-4" />}>
      <div className="grid grid-cols-1 gap-3">
        {locationFields.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex items-start gap-3 rounded-2xl border border-[#F3F4F6] bg-[#F9FAFB] p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary mt-0.5">
              {icon}
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-[#111827]">
                {String(fallback(value))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

function ContactSection({ labour }: { labour: Labour }) {
  if (!labour.showContact) {
    return (
      <Section title="Contact Information" icon={<Phone className="h-4 w-4" />}>
        <EmptyState
          icon={<Lock className="h-5 w-5" />}
          heading="Contact details are private"
          text="This labour has chosen to keep their contact information hidden. Use Hire Labour to reach out through FarmFleet."
        />
      </Section>
    )
  }

  return (
    <Section title="Contact Information" icon={<Phone className="h-4 w-4" />}>
      <div className="grid grid-cols-1 gap-3">
        <a
          href={labour.mobile ? `tel:${labour.mobile}` : undefined}
          className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
            labour.mobile
              ? 'border-[#E5E7EB] bg-[#F9FAFB] hover:bg-primary/5 hover:border-primary/30 cursor-pointer'
              : 'border-[#F3F4F6] bg-[#FAFAFA] pointer-events-none'
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <Phone className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Phone
            </span>
            <span className="text-sm font-semibold text-[#111827]">
              {String(fallback(labour.mobile, 'Not shared'))}
            </span>
          </span>
        </a>
        <a
          href={labour.email ? `mailto:${labour.email}` : undefined}
          className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
            labour.email
              ? 'border-[#E5E7EB] bg-[#F9FAFB] hover:bg-primary/5 hover:border-primary/30 cursor-pointer'
              : 'border-[#F3F4F6] bg-[#FAFAFA] pointer-events-none'
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <Mail className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Email
            </span>
            <span className="text-sm font-semibold text-[#111827]">
              {String(fallback(labour.email, 'Not shared'))}
            </span>
          </span>
        </a>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Work History
// ---------------------------------------------------------------------------

function WorkHistorySection({ labour }: { labour: Labour }) {
  const history = labour.workHistory ?? []

  return (
    <Section title="Work History" icon={<Briefcase className="h-4 w-4" />}>
      {history.length > 0 ? (
        <div className="relative space-y-3 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#E5E7EB] before:rounded-full">
          {history.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative"
            >
              {/* Timeline dot */}
              <span className="absolute -left-[25px] top-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border-2 border-white shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </span>

              <div className="rounded-2xl border border-[#F3F4F6] bg-[#F9FAFB] p-4 hover:border-[#E5E7EB] hover:bg-white transition-colors">
                <p className="text-sm font-bold text-[#111827]">{String(fallback(item.title, 'Job'))}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                  {item.employer && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {item.employer}
                    </span>
                  )}
                  {item.duration && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {item.duration}
                    </span>
                  )}
                  {!item.employer && !item.duration && 'Details unavailable'}
                </div>
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{item.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          heading="No work history yet"
          text="Past jobs and experience will show up here."
        />
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

function ReviewsSection({ labour }: { labour: Labour }) {
  const reviews = labour.reviews ?? []
  const ratingPct = labour.rating !== undefined ? Math.min(100, (labour.rating / 5) * 100) : 0

  return (
    <Section title="Reviews" icon={<Star className="h-4 w-4" />}>
      {/* Rating summary bar */}
      <div className="mb-5 flex items-center gap-5 rounded-2xl border border-[#F3F4F6] bg-[#F9FAFB] p-5">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <p className="font-display text-4xl font-bold text-[#111827] leading-none">
            {labour.rating !== undefined ? labour.rating.toFixed(1) : 'N/A'}
          </p>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.round(labour.rating ?? 0)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-[#E5E7EB] text-[#E5E7EB]'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">out of 5</p>
        </div>
        <div className="flex-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${ratingPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-green-500"
            />
          </div>
          <p className="mt-2 text-xs text-[#9CA3AF]">
            Based on {labour.totalReviews ?? 0} review{labour.totalReviews === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              style={cardGlowStyle}
              className={`${cardRadius} shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),inset_-30px_-30px_50px_-38px_rgba(96,165,250,0.4),0_2px_12px_-6px_rgba(15,23,42,0.08)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),inset_-30px_-30px_50px_-32px_rgba(96,165,250,0.5),0_6px_18px_-6px_rgba(15,23,42,0.1)] bg-white p-5 transition-shadow relative overflow-hidden`}
            >
              <CardGlowBlob />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB]">
                    {review.reviewerAvatar ? (
                      <img
                        src={review.reviewerAvatar}
                        alt={String(fallback(review.reviewerName, 'Reviewer'))}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      {String(fallback(review.reviewerName, 'Anonymous'))}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3 w-3 ${
                            idx < Math.round(review.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-[#E5E7EB] text-[#E5E7EB]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.createdAt && (
                  <p className="text-xs text-[#9CA3AF] shrink-0">{review.createdAt}</p>
                )}
              </div>
              {review.comment && (
                <p className="relative mt-3 text-sm leading-relaxed text-[#6B7280]">"{review.comment}"</p>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          heading="No reviews yet"
          text="Reviews from renters will appear here after completed jobs."
        />
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ heading, text, icon }: { heading: string; text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#E5E7EB] px-6 py-10 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#9CA3AF]">
        {icon ?? <Briefcase className="h-5 w-5" />}
      </div>
      <p className="text-sm font-semibold text-[#374151]">{heading}</p>
      <p className="max-w-xs text-xs leading-relaxed text-[#9CA3AF]">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function LabourProfileSkeleton() {
  return (
    <AppShell>
      <div className="min-h-screen bg-[#F9FAFB]">
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-6 space-y-5">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded-lg bg-[#E5E7EB]" />
          </div>
          {/* Hero skeleton */}
          <div style={cardGlowStyle} className={`${cardCls} ${cardPad} animate-pulse`}>
            <div className="flex gap-6">
              <div className="h-[90px] w-[90px] sm:h-[120px] sm:w-[120px] lg:h-[160px] lg:w-[160px] shrink-0 rounded-full bg-[#E5E7EB]" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-48 rounded-xl bg-[#E5E7EB]" />
                <div className="h-4 w-32 rounded-lg bg-[#E5E7EB]" />
                <div className="h-4 w-56 rounded-lg bg-[#E5E7EB]" />
              </div>
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={cardGlowStyle} className={`${cardCls} h-28 animate-pulse`} />
            ))}
          </div>
          {/* Section skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={cardGlowStyle} className={`${cardCls} ${cardPad} animate-pulse space-y-3`}>
                  <div className="h-5 w-36 rounded-lg bg-[#E5E7EB]" />
                  <div className="h-3 w-full rounded-lg bg-[#E5E7EB]" />
                  <div className="h-3 w-4/5 rounded-lg bg-[#E5E7EB]" />
                </div>
              ))}
            </div>
            <div className="space-y-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} style={cardGlowStyle} className={`${cardCls} ${cardPad} animate-pulse space-y-3`}>
                  <div className="h-5 w-24 rounded-lg bg-[#E5E7EB]" />
                  <div className="h-3 w-full rounded-lg bg-[#E5E7EB]" />
                  <div className="h-3 w-3/5 rounded-lg bg-[#E5E7EB]" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message, notFound = false, onRetry }: { message: string; notFound?: boolean; onRetry: () => void }) {
  return (
    <AppShell>
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-16">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={cardGlowStyle}
            className={`${cardCls} max-w-sm w-full p-8 text-center`}
          >
            <CardGlowBlob />
            <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F4F6] text-[#9CA3AF]">
              {notFound ? <User className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
            </div>
            <h2 className="relative font-display text-lg font-bold text-[#111827]">
              {notFound ? 'Labour Not Found' : 'Something Went Wrong'}
            </h2>
            <p className="relative mt-2 text-sm text-[#6B7280]">{message}</p>
            <div className="relative mt-6 flex justify-center gap-3">
              <Link
                to="/renter/labours"
                className="px-4 py-2.5 rounded-2xl border border-[#E5E7EB] text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] transition"
              >
                Browse Labours
              </Link>
              {!notFound && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-sm font-bold text-white shadow-[0_4px_14px_0_rgba(34,197,94,0.3)] transition"
                >
                  Try Again
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  )
}