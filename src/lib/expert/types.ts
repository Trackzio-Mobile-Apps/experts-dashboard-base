export type ExpertStats = {
  activeCases: number;
  newRequests: number;
  completed: number;
  totalEarningsInr: number;
  missedDeadlineCount: number;
  avgCompletionHours?: number | null;
};

export type ExpertBackendStatus = "active" | "suspended" | "blocked";

export type ExpertStatus = ExpertBackendStatus | string;

/** Source of truth from `GET /experts/me`. */
export type ExpertProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Full name as returned by the API (`name`). */
  name: string;
  initials?: string;
  isInternal: boolean;
  status: ExpertStatus;
  /** ISO country codes; empty array = all countries on backend. */
  supportedCountries: string[];
  isAvailableForRequests: boolean;
  activeCommittedRequestCount: number;
  lastAssignedAt: string | null;
  /** System-managed; when the expert was last offered a request. */
  lastOfferedAt: string | null;
  profilePicture: string | null;
  oneLineDescription: string | null;
  /** Read-only expertise tags from the API when present. */
  expertise: string[];
  /**
   * Numeric years when the API value is parseable (e.g. 25 from `"25 years"`).
   */
  yearsOfExperience: number | null;
  /**
   * Display string from API `yearsOfXp` (e.g. `"25 years"`).
   * Prefer this for profile UI.
   */
  yearsOfXp: string | null;
  stats: ExpertStats;
  createdAt?: string;
  updatedAt?: string;
};

/** Alias for profile data returned after login. */
export type Expert = ExpertProfile;

export type ExpertLoginResult = {
  token: string;
  expert: ExpertProfile;
};

export type ExpertLoginApiData = {
  token: string;
};

/** Raw expert object from the backend API (`GET /experts/me`). */
export type BackendExpert = {
  _id: string;
  name: string;
  email: string;
  isInternal: boolean;
  isAvailableForRequests: boolean;
  supportedCountries: string[];
  status: ExpertBackendStatus;
  activeCommittedRequestCount: number;
  stats: {
    completedCount: number;
    missedDeadlineCount: number;
    avgCompletionHoursLast5: number | null;
  };
  lastAssignedAt: string | null;
  lastOfferedAt?: string | null;
  profilePicture: string | null;
  oneLineDescription: string | null;
  /** Optional contract fields — shown when the API provides them. */
  expertise?: string[] | string | null;
  /** Live API field observed on `GET /experts/me` (e.g. `"25 years"`). */
  yearsOfXp?: string | number | null;
  yearsOfExperience?: number | string | null;
  years_of_experience?: number | string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportStatus = "draft" | "submitted";

export type ReportGeneralInfo = {
  coinName: string;
  currencyAndDenomination: string;
  issuer: string;
  period: string;
  rulerOrGovt: string;
  yearOfMinting: string;
  mintLocation: string;
};

export type ReportPhysicalSpecs = {
  material: string;
  weight: string;
  dominantColor: string;
  mintingMethod: string;
};

export type ReportDesignDetails = {
  obverseDescription: string;
  reverseDescription: string;
  history: string;
};

export type ReportValueAndRarity = {
  rarity: string;
  currency: string;
  estimatedPriceRange: string;
};

export type ReportExpertAssessment = {
  authenticity: string;
  conditionOrGrade: string;
  errorsOrSpecialFeatures: string;
  recommendation: string;
};

export type ReportContentFields = {
  generalInfo: ReportGeneralInfo;
  physicalSpecs: ReportPhysicalSpecs;
  designDetails: ReportDesignDetails;
  valueAndRarity: ReportValueAndRarity;
  expertAssessment: ReportExpertAssessment;
};

export type UpsertReportBody = {
  requestId?: string;
  contentFields?: Partial<ReportContentFields>;
  attachments?: unknown[];
  isDraft?: boolean;
};

export type ExpertMeApiData = {
  expert: BackendExpert;
};

/** Single review from `GET /experts/me/reviews`. */
export type BackendExpertReview = {
  _id: string;
  userId: string;
  reportId: string;
  requestId: string;
  expertId: string;
  displayId: string;
  coinName: string;
  reviewerDisplayName: string;
  rating: number;
  sentiment: string;
  comment: string;
  platform: string;
  ratedAt: string;
  hasRated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpertReviewsApiData = {
  expertId: string;
  average: number | null;
  count: number;
  reviews: BackendExpertReview[];
};

export type RequestStatus =
  | "created"
  | "allocating"
  | "offered"
  | "accepted"
  | "report_submitted"
  | "completed"
  | "deadline_missed"
  | "retry_pending"
  | "refund_processing"
  | "refund_pending"
  | "refunded"
  | "expired"
  | "cancelled"
  | string;

export type BackendRequest = {
  _id: string;
  displayId?: string;
  coinTitle?: string | null;
  country?: string;
  payload?: Record<string, unknown>;
  status: RequestStatus;
  assignedExpertId?: string | null;
  firstAcceptanceWindowEndsAt?: string | null;
  ttlExpiresAt?: string | null;
  deadlineAt?: string | null;
  acceptedAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** From `GET /experts/me/requests` once a report exists (draft or submitted). */
  reportId?: string | null;
  report?: BackendReport | string | null;
};

export type BackendOffer = {
  _id: string;
  round?: number;
  status?: string;
  expiresAt?: string | null;
  offeredAt?: string | null;
  request: BackendRequest;
};

export type BackendReport = {
  _id: string;
  requestId: string;
  requestDisplayId: string | null;
  expertId: string;
  userId: string;
  coinTitle: string;
  /** Legacy flat content — prefer `contentFields`. */
  content?: Record<string, unknown>;
  contentFields?: ReportContentFields;
  attachments: unknown[];
  isDraft: boolean;
  status: ReportStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpertOffersApiData = {
  offers: BackendOffer[];
};

export type ExpertRequestsApiData = {
  requests: BackendRequest[];
};

export type ExpertReportApiData = {
  report: BackendReport;
};

export type ExpertNavCounts = {
  queue: number;
  drafts: number;
};

export type QueueItemStatus = "in_progress" | "pending_review";

/** Visual queue row variant (accent, badge, primary button). */
export type QueueRowVariant = "pending_review" | "in_progress";

export type QueueListItem = {
  id: string;
  /** Human-readable id shown in UI (API displayId when present). */
  displayId: string;
  offerId?: string;
  submittedDisplay: string;
  status: QueueItemStatus;
  variant: QueueRowVariant;
  deadlineDays: number;
  /** ISO deadline used for precise remaining-time labels. */
  deadlineAt?: string | null;
  /** True when the row deadline (or offer expiry) is in the past. */
  deadlineExpired: boolean;
  coinName: string;
  /** Up to two image URLs for queue thumbnails (obverse + reverse preferred). */
  thumbnailUrls: string[];
};

export type DraftListItem = {
  id: string;
  /** Human-readable id shown in UI (API displayId when present). */
  displayId: string;
  submittedDisplay: string;
  deadlineDays: number;
  /** ISO deadline used for precise remaining-time labels. */
  deadlineAt?: string | null;
  /** True when the row deadline is in the past. */
  deadlineExpired: boolean;
  progressPercent: number;
};

export type HistoryRowStatus = "draft" | "new" | "completed" | "missed";

export type HistoryAction =
  | "resume"
  | "evaluate"
  | "view_report"
  | "view_details"
  | "none";

export type HistoryRow = {
  requestId: string;
  /** Shown in the table, e.g. REQ-00830 or API displayId. */
  requestLabel: string;
  reportId?: string;
  offerId?: string;
  coinName: string;
  type: string;
  dateDisplay: string;
  valueInr: number | null;
  status: HistoryRowStatus;
  action: HistoryAction;
};

export type HistorySummaryStats = {
  totalCompleted: number;
  avgTurnaround: string;
  totalEarnedInr: number | null;
  earnedThisMonthInr: number | null;
};

export type RequestMediaItem =
  | { kind: "image"; src: string; alt: string; group?: string }
  | {
      kind: "video";
      src: string;
      poster: string;
      alt: string;
      group?: string;
      duration?: string;
    };

export type EvaluationRequestDetail = {
  requestId: string;
  /** Human-readable id from API (`displayId`), e.g. EV-KUBGCWV5. */
  displayId: string;
  /** Linked report id from the backend request, when available. */
  reportId?: string;
  offerId?: string;
  /** Request is offered and waiting for this expert to accept. */
  needsAccept: boolean;
  unavailable: boolean;
  canSubmit: boolean;
  /** True when the evaluation window has expired (time or server status). */
  deadlineExceeded: boolean;
  deadlineDays: number;
  deadlineAt: string | null;
  receivedAt: string | null;
  submittedDisplay: string;
  userNotes: string;
  coinName: string;
  media: RequestMediaItem[];
};

/** Unit/currency picker rendered beside a value input and saved with it. */
export type EvaluationFormUnitDef = {
  key: string;
  label: string;
  options: readonly string[];
  defaultValue: string;
  /** Compact labels for the picker (e.g. `US $` for USD). */
  optionLabels?: Readonly<Record<string, string>>;
  /** When `start`, the unit picker renders before the value input. */
  position?: "start" | "end";
};

export type EvaluationFormFieldDef = {
  key: string;
  label: string;
  description?: string;
  multiline?: boolean;
  inputMode?: "decimal" | "numeric" | "text";
  /** When true, required for progress % and submit. Defaults to false. */
  required?: boolean;
  /** Span both columns on sm+ grid layouts. */
  fullWidth?: boolean;
  /** Renders in the same grid row as another field (inner two-column split). */
  pairWith?: string;
  unit?: EvaluationFormUnitDef;
  /** Renders a single-choice dropdown instead of a free-text input. */
  options?: readonly string[];
  placeholder?: string;
};

export type EvaluationFormSectionDef = {
  id: string;
  stepLabel: string;
  title: string;
  fields: readonly EvaluationFormFieldDef[];
};

export type EvaluationFormState = Record<string, string>;

export type ExpertUserSummary = {
  firstName: string;
  lastName: string;
  initials: string;
  profilePicture?: string | null;
};

export type ExpertDashboardStats = {
  activeCases: number;
  newRequests: number;
  completed: number;
  avgTurnaround?: string;
};
