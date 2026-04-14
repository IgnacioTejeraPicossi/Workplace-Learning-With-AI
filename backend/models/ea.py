"""
EA Second Brain Agent - Data Models
Ketil's 24/7 Enterprise Architecture Watcher

Models cover:
- InsightBundle execution (original)
- Portfolio management (Ketil 6.0)
- Watchlists & Source Feeds (Ketil 6.0)
- Impact Scoring (Ketil 6.0 formula)
- Ask queries (natural language)
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from enum import Enum


# ─── Enums ──────────────────────────────────────────────────────────────────

class Criticality(int, Enum):
    MINIMAL = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    CRITICAL = 5

class LifecycleStatus(str, Enum):
    PRODUCTION = "production"
    SUNSET = "sunset"
    PILOT = "pilot"
    PLANNED = "planned"
    DECOMMISSIONED = "decommissioned"

class InsightCategory(str, Enum):
    DEPRECATION = "deprecation"
    SECURITY = "security"
    LICENSE = "license"
    PERFORMANCE = "performance"
    VENDOR = "vendor"
    COMPLIANCE = "compliance"
    ARCHITECTURE = "architecture"
    COST = "cost"

class InsightUrgency(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class FeedType(str, Enum):
    RSS = "rss"
    API = "api"
    CONFLUENCE = "confluence"
    JIRA = "jira"
    GITHUB = "github"
    CVE = "cve"
    MANUAL = "manual"


# ─── Original Execution Models ──────────────────────────────────────────────

class Evidence(BaseModel):
    """Evidence from sources (internal tools or open data)"""
    url: str
    source: str
    snippet: Optional[str] = None
    published_at: Optional[datetime] = None

class PortfolioMatch(BaseModel):
    """Matched portfolio items (apps, capabilities, projects)"""
    id: str
    name: str
    score: float = Field(ge=0.0, le=1.0)
    reason: Optional[str] = None

class NextAction(BaseModel):
    """Recommended next action"""
    title: str
    detail: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None

class Action(BaseModel):
    """Executable action (Jira, Slack, Confluence, Sheets)"""
    type: Literal[
        "jira.createIssue",
        "slack.postMessage",
        "confluence.updatePage",
        "sheets.appendRow"
    ]
    payload: Dict[str, Any]

class InsightBundle(BaseModel):
    """Complete insight bundle for execution"""
    run_id: str
    topic: str
    summary_md: str
    evidence: List[Evidence] = []
    portfolio_matches: List[PortfolioMatch] = []
    recommended_actions: List[NextAction] = []
    actions: List[Action] = []
    callback_url: str

class AgentCallback(BaseModel):
    """Callback from executor"""
    run_id: str
    status: Literal["RUNNING", "DONE", "FAILED"]
    artifacts: Dict[str, Any] = {}
    error: Optional[str] = None


# ─── Portfolio Models (Ketil 6.0) ───────────────────────────────────────────

class TechStackItem(BaseModel):
    """Technology in a portfolio item's stack"""
    name: str
    version: Optional[str] = None
    category: Optional[str] = None  # e.g. "framework", "language", "database", "runtime"
    eol_date: Optional[str] = None  # ISO date string when EOL

class PortfolioItemCreate(BaseModel):
    """Create/update a portfolio item"""
    name: str
    description: Optional[str] = None
    owner: Optional[str] = None
    team: Optional[str] = None
    criticality: int = Field(default=3, ge=1, le=5)
    lifecycle: LifecycleStatus = LifecycleStatus.PRODUCTION
    capability: Optional[str] = None  # maps to EA capability
    tech_stack: List[TechStackItem] = []
    tags: List[str] = []
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    dependencies: List[str] = []  # other portfolio item names/ids
    notes: Optional[str] = None

class PortfolioItemResponse(PortfolioItemCreate):
    """Portfolio item with DB fields"""
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    insight_count: int = 0  # number of insights referencing this item
    risk_score: Optional[float] = None  # computed from insights


# ─── Insight Models (Enhanced from Ketil 6.0) ───────────────────────────────

class ImpactScore(BaseModel):
    """
    Impact scoring per Ketil 6.0:
    ImpactScore = 0.40 * Relevance + 0.30 * Criticality + 0.20 * Freshness + 0.10 * Risk
    """
    relevance: float = Field(ge=0.0, le=1.0, description="How relevant to portfolio")
    criticality: float = Field(ge=0.0, le=1.0, description="Severity of the issue")
    freshness: float = Field(ge=0.0, le=1.0, description="How recent the information is")
    risk: float = Field(ge=0.0, le=1.0, description="Risk level if not addressed")
    total: float = Field(ge=0.0, le=1.0, description="Weighted composite score")

class EAInsight(BaseModel):
    """Stored insight for review (enhanced with Ketil 6.0 fields)"""
    insight_id: str
    topic: str
    summary_md: str
    category: InsightCategory = InsightCategory.ARCHITECTURE
    urgency: InsightUrgency = InsightUrgency.MEDIUM
    impact_score: Optional[ImpactScore] = None
    evidence: List[Evidence] = []
    portfolio_matches: List[PortfolioMatch] = []
    recommended_actions: List[NextAction] = []
    affected_technologies: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["pending", "acknowledged", "in_progress", "resolved", "dismissed"] = "pending"
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None


# ─── Watchlist Models (Ketil 6.0) ───────────────────────────────────────────

class WatchlistItemCreate(BaseModel):
    """Create a watchlist item — monitors a technology, vendor, or term"""
    term: str  # e.g. "Kubernetes", "Oracle", "Log4j"
    category: Optional[str] = None  # "technology", "vendor", "compliance", "security"
    notify_on: List[str] = ["deprecation", "security", "major_release"]
    notes: Optional[str] = None
    active: bool = True

class WatchlistItemResponse(WatchlistItemCreate):
    """Watchlist item with DB fields"""
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0


# ─── Source Feed Models (Ketil 6.0) ─────────────────────────────────────────

class SourceFeedCreate(BaseModel):
    """Create a source feed"""
    name: str
    feed_type: FeedType = FeedType.RSS
    url: Optional[str] = None
    config: Dict[str, Any] = {}  # feed-specific config (API keys, filters, etc.)
    active: bool = True
    poll_interval_minutes: int = 60
    tags: List[str] = []

class SourceFeedResponse(SourceFeedCreate):
    """Source feed with DB fields"""
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    last_polled: Optional[datetime] = None
    items_fetched: int = 0
    status: str = "idle"  # idle, polling, error


# ─── Ask Models (Ketil 6.0) ─────────────────────────────────────────────────

class AskRequest(BaseModel):
    """Natural language query against the EA portfolio"""
    question: str
    context: Optional[str] = None  # optional extra context
    include_insights: bool = True
    include_portfolio: bool = True
    max_results: int = 10

class AskResponse(BaseModel):
    """Structured answer from the Ask endpoint"""
    answer_md: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: List[Evidence] = []
    related_portfolio_items: List[PortfolioMatch] = []
    related_insights: List[str] = []  # insight_ids
    suggestions: List[str] = []  # follow-up question suggestions


# ─── Dashboard Models ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """Dashboard statistics for EA Second Brain"""
    total_portfolio_items: int = 0
    total_insights: int = 0
    pending_insights: int = 0
    critical_insights: int = 0
    total_watchlist_items: int = 0
    total_source_feeds: int = 0
    active_source_feeds: int = 0
    total_runs: int = 0
    successful_runs: int = 0
    technologies_tracked: int = 0
    avg_criticality: float = 0.0
    deprecation_warnings: int = 0
