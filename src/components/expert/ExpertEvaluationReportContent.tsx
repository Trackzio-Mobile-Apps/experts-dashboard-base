import { ExpertAvatar } from "@/components/expert/ExpertAvatar";
import { themeConfig } from "@/config";
import {
  authenticityAssessmentTheme,
  authenticityBadgeColors,
  authenticitySummaryTheme,
  authenticityTone,
  EVALUATION_REPORT_TOKENS,
} from "@/lib/expert/evaluationReportTokens";
import {
  EVALUATION_REPORT_INTER_FONT_URL,
  evaluationReportFontFaceCss,
  evaluationReportLayoutCss,
} from "@/lib/expert/evaluationReportLayoutStyles";
import {
  EVALUATION_REPORT_BRAND,
  EVALUATION_REPORT_LAYOUT_VERSION,
  EVALUATION_REPORT_SUBTITLE,
  EVALUATION_REPORT_TITLE,
  formatReportHeaderDate,
  formatReportRating,
  formatReportRequestLabel,
  reportGalleryMedia,
  type EvaluationReportDisplay,
  type EvaluationReportLayoutVersion,
  type EvaluationReportSection,
} from "@/lib/expert/evaluationReportView";
import type { RequestMediaItem } from "@/lib/expert/types";

type ExpertEvaluationReportContentProps = {
  report: EvaluationReportDisplay;
  /** v1: coin + summary card. v2: expert profile + coin cards (PDF v2). */
  version?: EvaluationReportLayoutVersion;
};

const t = EVALUATION_REPORT_TOKENS;

function DocumentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v18M5 7l7 4 7-4M5 17l7-4 7 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="8" cy="8" rx="5" ry="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3 8v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="16" cy="14" rx="5" ry="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M11 14v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ExpertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function AuthenticityBadge({ value }: { value: string }) {
  const tone = authenticityTone(value);
  const colors = authenticityBadgeColors(tone);

  return (
    <span
      className="eval-report-auth-badge"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {value === "—" ? "Pending" : value}
    </span>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 7.5 13.2 10.8 16.7 11.1 14.1 13.3 14.9 16.7 12 15 9.1 16.7 9.9 13.3 7.3 11.1 10.8 10.8 12 7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ValueCoinsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="8" cy="8" rx="5" ry="2.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 8v3.5c0 1.2 2.2 2.25 5 2.25s5-1.05 5-2.25V8" stroke="currentColor" strokeWidth="1.75" />
      <ellipse cx="16" cy="14" rx="5" ry="2.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M11 14v3.5c0 1.2 2.2 2.25 5 2.25s5-1.05 5-2.25V14" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function ExpertStatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="eval-report-stat-row">
      <span className="eval-report-stat-label">{label}</span>
      <span className="eval-report-stat-value">{value}</span>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  accentColor,
  labelColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
  labelColor: string;
}) {
  return (
    <div className="eval-report-summary-row">
      <span style={{ color: accentColor, flexShrink: 0 }}>{icon}</span>
      <span
        className="eval-report-summary-label"
        style={{ color: labelColor }}
      >
        {label}
      </span>
      <span
        className="eval-report-summary-value"
        style={{ color: accentColor }}
      >
        {value}
      </span>
    </div>
  );
}

function CameraBadgeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CoinGalleryItem({
  item,
  index,
  isVideo,
  variant = "default",
}: {
  item: RequestMediaItem;
  index: number;
  isVideo?: boolean;
  variant?: "default" | "v1";
}) {
  const src = item.kind === "image" ? item.src : item.poster;
  const overlap =
    index === 0
      ? 0
      : -(variant === "v1"
          ? t.hero.v1CoinImageOverlapPx
          : t.hero.coinImageOverlapPx);

  return (
    <div
      className="eval-report-coin-gallery-item"
      style={{
        marginLeft: overlap,
        zIndex: 10 - index,
      }}
    >
      {src ? (
        <img src={src} alt={item.alt} loading="lazy" />
      ) : (
        <span className="eval-report-coin-gallery-fallback">Video</span>
      )}
      {isVideo ? (
        <span className="eval-report-coin-video-badge">
          <CameraBadgeIcon />
        </span>
      ) : null}
    </div>
  );
}

function KeyValueCard({ section }: { section: EvaluationReportSection }) {
  return (
    <div className="eval-report-kv-card">
      {section.fields.map((field) => (
        <div key={field.label} className="eval-report-kv-row">
          <span className="eval-report-kv-label">{field.label}</span>
          <span className="eval-report-kv-value">{field.value}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="eval-report-section-heading">
      <span className="eval-report-section-icon">{icon}</span>
      <h3 className="eval-report-section-title">{title}</h3>
    </div>
  );
}

function ReportPageShell({
  page,
  children,
}: {
  page: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <section
      data-report-export-page={page}
      className="eval-report-page shrink-0"
      style={{
        width: t.page.maxWidthPx,
        minWidth: t.page.maxWidthPx,
        maxWidth: t.page.maxWidthPx,
      }}
    >
      {children}
    </section>
  );
}

function ReportHeader({
  requestLabel,
  submittedDate,
}: {
  requestLabel: string;
  submittedDate: string;
}) {
  return (
    <header className="eval-report-header">
      <div className="eval-report-header-brand">
        <img
          src={themeConfig.brand.logoSrc}
          alt={EVALUATION_REPORT_BRAND}
          width={t.header.logoSizePx}
          height={t.header.logoSizePx}
          className="eval-report-header-logo"
        />
        <div>
          <p className="eval-report-brand-name">{EVALUATION_REPORT_BRAND}</p>
          <p className="eval-report-brand-subtitle">{EVALUATION_REPORT_SUBTITLE}</p>
        </div>
      </div>

      <div className="eval-report-header-right">
        <h1 className="eval-report-report-title">{EVALUATION_REPORT_TITLE}</h1>
        <div className="eval-report-report-meta">
          <p className="eval-report-meta-line">
            Request ID:{" "}
            <strong className="eval-report-meta-value">{requestLabel}</strong>
          </p>
          <p className="eval-report-meta-line">
            Date:{" "}
            <strong className="eval-report-meta-value">{submittedDate}</strong>
          </p>
        </div>
      </div>
    </header>
  );
}

function CoinGallery({
  media,
  variant = "default",
}: {
  media: RequestMediaItem[];
  variant?: "default" | "v1";
}) {
  const gallery = reportGalleryMedia(media);
  const videoItems = media.filter((item) => item.kind === "video");
  if (gallery.length === 0 && videoItems.length === 0) return null;

  return (
    <div className="eval-report-coin-gallery">
      {gallery.map((item, index) => (
        <CoinGalleryItem
          key={`${item.src}-${index}`}
          item={item}
          index={index}
          variant={variant}
        />
      ))}
      {videoItems.slice(0, 1).map((item, index) => (
        <CoinGalleryItem
          key={`video-${item.src}`}
          item={item}
          index={gallery.length + index}
          isVideo
          variant={variant}
        />
      ))}
    </div>
  );
}

function HeroSummaryBox({
  report,
  className = "",
}: {
  report: EvaluationReportDisplay;
  className?: string;
}) {
  const summaryTheme = authenticitySummaryTheme(
    authenticityTone(report.hero.authenticity),
  );
  const labelColor = className.includes("--v1")
    ? t.colors.heroV1SummaryLabel
    : summaryTheme.labelColor;

  return (
    <div
      className={`eval-report-summary-box ${className}`.trim()}
      style={{ backgroundColor: summaryTheme.boxBg }}
    >
      <SummaryRow
        icon={<ShieldIcon />}
        label="Authenticity"
        value={report.hero.authenticity}
        accentColor={summaryTheme.accentColor}
        labelColor={labelColor}
      />
      <SummaryRow
        icon={<StarCircleIcon />}
        label="Condition"
        value={report.hero.condition}
        accentColor={summaryTheme.accentColor}
        labelColor={labelColor}
      />
      <SummaryRow
        icon={<ValueCoinsIcon />}
        label="Est. Value"
        value={report.hero.estimatedValue}
        accentColor={summaryTheme.accentColor}
        labelColor={labelColor}
      />
    </div>
  );
}

function CoinTitleHeader({ report }: { report: EvaluationReportDisplay }) {
  const rarity = report.hero.rarity;
  const showRarityBadge = rarity !== "—";

  return (
    <div className="eval-report-coin-header">
      <h2 className="eval-report-coin-title">{report.hero.coinTitle}</h2>
      {showRarityBadge ? (
        <span className="eval-report-rarity-badge">{rarity}</span>
      ) : null}
    </div>
  );
}

function ReportHeroSectionV1({ report }: { report: EvaluationReportDisplay }) {
  return (
    <section className="eval-report-hero-card eval-report-hero-card--v1">
      <div className="eval-report-hero-v1-inner">
        <div className="eval-report-hero-v1-coin">
          <h2 className="eval-report-coin-title eval-report-coin-title--v1">
            {report.hero.coinTitle}
          </h2>
          <CoinGallery media={report.media} variant="v1" />
        </div>
        <HeroSummaryBox
          report={report}
          className="eval-report-summary-box--v1"
        />
      </div>
    </section>
  );
}

function ReportHeroSectionV2({ report }: { report: EvaluationReportDisplay }) {
  return (
    <div className="eval-report-hero-grid">
      <section className="eval-report-hero-card">
        <p className="eval-report-hero-kicker">Evaluated by Expert</p>

        {report.expert ? (
          <>
            <div className="eval-report-hero-profile">
              <ExpertAvatar
                profilePicture={report.expert.profilePicture}
                initials={report.expert.initials}
                name={report.expert.fullName}
                size="md"
                fallbackClassName="bg-[#703838] text-white"
                className="!h-14 !w-14 !text-lg shrink-0"
              />
              <div>
                <h2 className="eval-report-hero-name">{report.expert.fullName}</h2>
                <p className="eval-report-hero-tagline">{report.expert.tagline}</p>
              </div>
            </div>

            <div className="eval-report-stat-box">
              <ExpertStatRow
                label="Experience"
                value={report.expert.experienceLabel}
              />
              <ExpertStatRow
                label="Evaluations"
                value={String(report.expert.evaluationsCount)}
              />
              <ExpertStatRow
                label="Rating"
                value={formatReportRating(
                  report.expert.ratingAverage,
                  report.expert.ratingCount,
                )}
              />
            </div>

            {report.expert.expertiseTags.length > 0 ? (
              <div className="eval-report-expertise-block">
                <p className="eval-report-expertise-kicker">Expertise</p>
                <div className="eval-report-chip-row">
                  {report.expert.expertiseTags.map((tag) => (
                    <span key={tag} className="eval-report-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="eval-report-hero-tagline" style={{ marginTop: 18 }}>
            Expert details unavailable.
          </p>
        )}
      </section>

      <section className="eval-report-hero-card">
        <CoinTitleHeader report={report} />
        <CoinGallery media={report.media} />
        <HeroSummaryBox report={report} />
      </section>
    </div>
  );
}

function ReportPageOneSections({ report }: { report: EvaluationReportDisplay }) {
  return (
    <div className="eval-report-sections-grid">
      <div>
        <SectionHeading icon={<DocumentIcon />} title={report.general.title} />
        <KeyValueCard section={report.general} />
      </div>

      <div className="eval-report-sections-right">
        <div>
          <SectionHeading icon={<ScaleIcon />} title={report.physical.title} />
          <KeyValueCard section={report.physical} />
        </div>
        <div>
          <SectionHeading icon={<CoinsIcon />} title={report.market.title} />
          <KeyValueCard section={report.market} />
        </div>
      </div>
    </div>
  );
}

function ReportDesignSection({ report }: { report: EvaluationReportDisplay }) {
  return (
    <div className="eval-report-design-block">
      <SectionHeading icon={<CompassIcon />} title="Design Details" />
      <div className="eval-report-design-card">
        <div className="eval-report-field-block">
          <p className="eval-report-field-label">Front (Obverse)</p>
          <p className="eval-report-field-value">{report.designDetails.obverse}</p>
        </div>
        <div className="eval-report-field-block">
          <p className="eval-report-field-label">Back (Reverse)</p>
          <p className="eval-report-field-value">{report.designDetails.reverse}</p>
        </div>
        <div className="eval-report-field-block">
          <p className="eval-report-field-label">History</p>
          <p className="eval-report-field-value">{report.designDetails.history}</p>
        </div>
      </div>
    </div>
  );
}

function ReportAssessmentSection({ report }: { report: EvaluationReportDisplay }) {
  const assessmentTheme = authenticityAssessmentTheme(
    authenticityTone(report.assessment.authenticity),
  );

  return (
    <div className="eval-report-assessment-block">
      <SectionHeading icon={<ExpertIcon />} title="Expert Assessment" />
      <div className="eval-report-assessment-card">
        <div
          className="eval-report-auth-card"
          style={{ backgroundColor: assessmentTheme.cardBg }}
        >
          <div className="eval-report-assessment-top">
            <p className="eval-report-field-label">Authenticity</p>
            <AuthenticityBadge value={report.assessment.authenticity} />
          </div>
          <p className="eval-report-auth-note">{report.assessment.authenticityNote}</p>
        </div>

        <div
          className={
            assessmentTheme.showConditionTint
              ? "eval-report-condition-card eval-report-field-block"
              : "eval-report-condition-card eval-report-condition-card--plain eval-report-field-block"
          }
          style={
            assessmentTheme.showConditionTint
              ? { backgroundColor: t.colors.conditionBg }
              : undefined
          }
        >
          <p className="eval-report-field-label">Condition Grade</p>
          <p className="eval-report-field-value eval-report-field-value--grade">
            {report.assessment.condition}
          </p>
        </div>

        <div className="eval-report-recommendation eval-report-field-block">
          <p className="eval-report-field-label">Expert Recommendation</p>
          <p className="eval-report-field-value eval-report-field-value--body">
            {report.assessment.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ExpertEvaluationReportContent({
  report,
  version = EVALUATION_REPORT_LAYOUT_VERSION,
}: ExpertEvaluationReportContentProps) {
  const requestLabel = formatReportRequestLabel(
    report.requestDisplayId,
    report.requestId,
  );
  const submittedDate = formatReportHeaderDate(report.submittedAt);
  const HeroSection =
    version === "v2" ? ReportHeroSectionV2 : ReportHeroSectionV1;

  return (
    <>
      <link rel="stylesheet" href={EVALUATION_REPORT_INTER_FONT_URL} />
      <style
        dangerouslySetInnerHTML={{
          __html: `${evaluationReportFontFaceCss()}${evaluationReportLayoutCss()}`,
        }}
      />
      <div className="eval-report-pages-stack eval-report-pages-stack--preview text-text">
      <ReportPageShell page={1}>
        <div className="eval-report-page-body">
          <ReportHeader
            requestLabel={requestLabel}
            submittedDate={submittedDate}
          />
          <HeroSection report={report} />
          <ReportPageOneSections report={report} />
          <ReportDesignSection report={report} />
        </div>
      </ReportPageShell>

      <ReportPageShell page={2}>
        <div className="eval-report-page-body eval-report-page-body--page-two">
          <ReportHeader
            requestLabel={requestLabel}
            submittedDate={submittedDate}
          />
          <ReportAssessmentSection report={report} />
        </div>
      </ReportPageShell>
    </div>
    </>
  );
}
