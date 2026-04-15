"""
Seed script for EA Second Brain Agent — Ketil's 24/7 EA Watcher.

Populates MongoDB with realistic Norwegian enterprise portfolio data:
- 8 portfolio items (applications with tech stacks, criticality, owners)
- 6 watchlist items (technologies & vendors to monitor)
- 5 source feeds (RSS, API, Jira, Confluence, GitHub)
- 7 insights (various categories, urgencies, with impact scores)

Run from repo root:
    python -m backend.scripts.seed_ea_brain
"""

import asyncio
from datetime import datetime, timedelta
from backend.db import (
    ea_portfolio_items_collection,
    ea_watchlists_collection,
    ea_source_feeds_collection,
    ea_insights_collection,
)
from backend.services.ea_second_brain import compute_impact_score

# ─── Portfolio Items ────────────────────────────────────────────────────────

PORTFOLIO_ITEMS = [
    {
        "name": "Betalingsplattformen",
        "description": "Kjernesystem for betalingsbehandling — håndterer alle inn- og utgående transaksjoner for nordiske kunder. Kritisk 24/7 tjeneste.",
        "owner": "Ketil Svendsen",
        "team": "Platform Engineering",
        "criticality": 5,
        "lifecycle": "production",
        "capability": "Payment Processing",
        "tech_stack": [
            {"name": "Java", "version": "17", "category": "language"},
            {"name": "Spring Boot", "version": "3.2.1", "category": "framework"},
            {"name": "PostgreSQL", "version": "15.4", "category": "database"},
            {"name": "Apache Kafka", "version": "3.6", "category": "messaging"},
            {"name": "Redis", "version": "7.2", "category": "cache"},
            {"name": "Kubernetes", "version": "1.28", "category": "orchestration"},
        ],
        "tags": ["kritisk", "betaling", "PCI-DSS", "24/7"],
        "repository_url": "https://github.com/org/betalingsplattformen",
        "dependencies": ["Kundeportalen", "Rapporteringsmotor"],
        "notes": "PCI-DSS Level 1 sertifisert. Oppetidskrav: 99.99%.",
    },
    {
        "name": "Kundeportalen",
        "description": "Nettbasert selvbetjeningsportal for bedriftskunder. React-frontend med BFF-lag i Node.js.",
        "owner": "Maria Olsen",
        "team": "Frontend Guild",
        "criticality": 4,
        "lifecycle": "production",
        "capability": "Customer Self-Service",
        "tech_stack": [
            {"name": "React", "version": "18.2", "category": "framework"},
            {"name": "TypeScript", "version": "5.3", "category": "language"},
            {"name": "Node.js", "version": "20.10", "category": "runtime"},
            {"name": "Next.js", "version": "14.1", "category": "framework"},
            {"name": "MongoDB", "version": "7.0", "category": "database"},
        ],
        "tags": ["frontend", "kunde", "selvbetjening"],
        "repository_url": "https://github.com/org/kundeportalen",
        "dependencies": ["Betalingsplattformen", "Autentiseringstjenesten"],
        "notes": "Migrert fra Angular til React i Q3 2025.",
    },
    {
        "name": "Autentiseringstjenesten",
        "description": "Sentral identitets- og tilgangsstyring (IAM). OIDC/OAuth2-leverandør for alle interne og eksterne tjenester.",
        "owner": "Ketil Svendsen",
        "team": "Security Engineering",
        "criticality": 5,
        "lifecycle": "production",
        "capability": "Identity & Access Management",
        "tech_stack": [
            {"name": "Go", "version": "1.21", "category": "language"},
            {"name": "Keycloak", "version": "23.0", "category": "platform"},
            {"name": "PostgreSQL", "version": "15.4", "category": "database"},
            {"name": "Vault", "version": "1.15", "category": "secrets"},
        ],
        "tags": ["sikkerhet", "IAM", "kritisk", "OIDC"],
        "repository_url": "https://github.com/org/auth-service",
        "dependencies": [],
        "notes": "Alle tjenester er avhengige av denne. Ingen nedetid tillatt under kontortid.",
    },
    {
        "name": "Rapporteringsmotor",
        "description": "Batch- og sanntidsrapportering til Finanstilsynet og intern compliance. Genererer daglige, ukentlige og månedlige rapporter.",
        "owner": "Anders Berg",
        "team": "Data & Analytics",
        "criticality": 4,
        "lifecycle": "production",
        "capability": "Regulatory Reporting",
        "tech_stack": [
            {"name": "Python", "version": "3.11", "category": "language"},
            {"name": "Apache Spark", "version": "3.5", "category": "processing"},
            {"name": "Airflow", "version": "2.8", "category": "orchestration"},
            {"name": "Snowflake", "version": "latest", "category": "warehouse"},
            {"name": "dbt", "version": "1.7", "category": "transformation"},
        ],
        "tags": ["rapportering", "compliance", "Finanstilsynet", "batch"],
        "dependencies": ["Betalingsplattformen", "Datasjøen"],
        "notes": "Regulatoriske rapporter til Finanstilsynet har strenge tidsfrister.",
    },
    {
        "name": "Datasjøen",
        "description": "Sentralt datalager basert på lakehouse-arkitektur. Inneholder alle historiske transaksjons-, kunde- og driftsdata.",
        "owner": "Anders Berg",
        "team": "Data & Analytics",
        "criticality": 3,
        "lifecycle": "production",
        "capability": "Data Platform",
        "tech_stack": [
            {"name": "Delta Lake", "version": "3.0", "category": "storage"},
            {"name": "Apache Spark", "version": "3.5", "category": "processing"},
            {"name": "Azure Data Lake", "version": "Gen2", "category": "cloud"},
            {"name": "Python", "version": "3.11", "category": "language"},
        ],
        "tags": ["data", "lakehouse", "azure"],
        "dependencies": [],
        "notes": "GDPR-konforme slettejobber kjører daglig.",
    },
    {
        "name": "Eldre CRM-system",
        "description": "Legacy CRM basert på Oracle Forms. Planlagt utfasing til fordel for Salesforce-migrering i 2026.",
        "owner": "Maria Olsen",
        "team": "CRM Team",
        "criticality": 3,
        "lifecycle": "sunset",
        "capability": "Customer Relationship Management",
        "tech_stack": [
            {"name": "Oracle Forms", "version": "12c", "category": "platform", "eol_date": "2025-12-31"},
            {"name": "Oracle Database", "version": "19c", "category": "database", "eol_date": "2027-04-30"},
            {"name": "Java", "version": "8", "category": "language", "eol_date": "2025-03-31"},
        ],
        "tags": ["legacy", "utfasing", "CRM"],
        "dependencies": ["Kundeportalen"],
        "notes": "Migreringsprosjekt til Salesforce pågår. Java 8 EOL er kritisk risiko.",
    },
    {
        "name": "Intern Chatbot",
        "description": "AI-drevet chatbot for intern IT-support. Bruker RAG-arkitektur mot Confluence-kunnskapsbase.",
        "owner": "Ketil Svendsen",
        "team": "AI & Automation",
        "criticality": 2,
        "lifecycle": "pilot",
        "capability": "IT Service Management",
        "tech_stack": [
            {"name": "Python", "version": "3.12", "category": "language"},
            {"name": "FastAPI", "version": "0.109", "category": "framework"},
            {"name": "LangChain", "version": "0.1.5", "category": "framework"},
            {"name": "ChromaDB", "version": "0.4", "category": "vector_db"},
            {"name": "OpenAI API", "version": "v1", "category": "ai"},
        ],
        "tags": ["AI", "chatbot", "pilot", "RAG"],
        "repository_url": "https://github.com/org/intern-chatbot",
        "dependencies": ["Autentiseringstjenesten"],
        "notes": "Pilotfase med 50 brukere. Evalueres for full utrulling Q2 2026.",
    },
    {
        "name": "Mobilbank-appen",
        "description": "Native mobilapplikasjon for personkunder. iOS og Android med delt Kotlin Multiplatform kjerne.",
        "owner": "Lars Hansen",
        "team": "Mobile Engineering",
        "criticality": 5,
        "lifecycle": "production",
        "capability": "Mobile Banking",
        "tech_stack": [
            {"name": "Kotlin", "version": "1.9", "category": "language"},
            {"name": "Kotlin Multiplatform", "version": "1.9", "category": "framework"},
            {"name": "Swift", "version": "5.9", "category": "language"},
            {"name": "Jetpack Compose", "version": "1.5", "category": "ui"},
            {"name": "SwiftUI", "version": "5.0", "category": "ui"},
            {"name": "gRPC", "version": "1.60", "category": "protocol"},
        ],
        "tags": ["mobil", "kritisk", "personkunder", "iOS", "Android"],
        "repository_url": "https://github.com/org/mobilbank",
        "dependencies": ["Betalingsplattformen", "Autentiseringstjenesten"],
        "notes": "1.2M aktive brukere. Hyppige utgivelser (hver 2. uke).",
    },
]

# ─── Watchlist Items ────────────────────────────────────────────────────────

WATCHLIST_ITEMS = [
    {
        "term": "Kubernetes",
        "category": "technology",
        "notify_on": ["deprecation", "security", "major_release"],
        "notes": "Kritisk for Betalingsplattformen og alle mikrotjenester",
        "active": True,
    },
    {
        "term": "Java 8",
        "category": "technology",
        "notify_on": ["deprecation", "security"],
        "notes": "Eldre CRM-system bruker fortsatt Java 8 — EOL-risiko",
        "active": True,
    },
    {
        "term": "Oracle",
        "category": "vendor",
        "notify_on": ["license", "deprecation", "major_release"],
        "notes": "Oracle Forms 12c og Oracle DB 19c i CRM-systemet",
        "active": True,
    },
    {
        "term": "Log4j",
        "category": "security",
        "notify_on": ["security"],
        "notes": "Overvåker for nye Log4Shell-relaterte sårbarheter",
        "active": True,
    },
    {
        "term": "React",
        "category": "technology",
        "notify_on": ["major_release", "deprecation"],
        "notes": "Kundeportalen bruker React 18 — følg med på React 19",
        "active": True,
    },
    {
        "term": "PCI-DSS",
        "category": "compliance",
        "notify_on": ["compliance", "major_release"],
        "notes": "PCI-DSS v4.0 overgangsfrister — Betalingsplattformen",
        "active": True,
    },
]

# ─── Source Feeds ───────────────────────────────────────────────────────────

SOURCE_FEEDS = [
    {
        "name": "Kubernetes Release Notes",
        "feed_type": "rss",
        "url": "https://kubernetes.io/feed.xml",
        "config": {"filter_tags": ["release", "deprecation"]},
        "active": True,
        "poll_interval_minutes": 120,
        "tags": ["kubernetes", "infrastructure"],
    },
    {
        "name": "NIST CVE Feed",
        "feed_type": "cve",
        "url": "https://services.nvd.nist.gov/rest/json/cves/2.0",
        "config": {"keywords": ["java", "spring", "postgresql", "kafka", "oracle"]},
        "active": True,
        "poll_interval_minutes": 60,
        "tags": ["security", "cve"],
    },
    {
        "name": "Intern Jira — EA-prosjekter",
        "feed_type": "jira",
        "url": "https://jira.intern.no/rest/api/3",
        "config": {"project": "EA", "statuses": ["Open", "In Progress"]},
        "active": True,
        "poll_interval_minutes": 30,
        "tags": ["intern", "jira", "ea"],
    },
    {
        "name": "Confluence — Arkitekturbeslutninger",
        "feed_type": "confluence",
        "url": "https://wiki.intern.no/rest/api/content",
        "config": {"space": "ARCH", "label": "adr"},
        "active": True,
        "poll_interval_minutes": 60,
        "tags": ["intern", "confluence", "adr"],
    },
    {
        "name": "GitHub — Spring Boot Releases",
        "feed_type": "github",
        "url": "https://api.github.com/repos/spring-projects/spring-boot/releases",
        "config": {"include_prereleases": False},
        "active": True,
        "poll_interval_minutes": 240,
        "tags": ["github", "spring-boot"],
    },
]

# ─── Insights ───────────────────────────────────────────────────────────────

now = datetime.utcnow()

INSIGHTS = [
    {
        "insight_id": "INS-EA001",
        "topic": "Java 8 End-of-Life: Eldre CRM-system har kritisk migrasjonsrisiko",
        "summary_md": """## Java 8 EOL — Kritisk migrasjonsbehov

Oracle Java 8 har nådd end-of-public-updates for kommersielle brukere. **Eldre CRM-system** kjører fortsatt på Java 8, noe som utgjør en betydelig sikkerhets- og supportrisiko.

### Påvirkning
- Ingen flere gratis sikkerhetsoppdateringer fra Oracle
- PCI-DSS-krav om oppdaterte systemer trues
- Migreringsprosjektet til Salesforce er planlagt, men forsinkelser øker risikoen

### Anbefaling
Prioriter CRM-migrasjonen eller gjennomfør interim-oppgradering til Java 17 LTS.""",
        "category": "deprecation",
        "urgency": "critical",
        "impact_score": compute_impact_score(0.95, 0.90, 0.85, 0.80),
        "evidence": [
            {"url": "https://www.oracle.com/java/technologies/java-se-support-roadmap.html", "source": "Oracle Java SE Roadmap", "snippet": "Java 8 public updates ended for commercial use"},
            {"url": "", "source": "Intern Portfolio Register", "snippet": "Eldre CRM-system: Java 8, Oracle Forms 12c"},
        ],
        "portfolio_matches": [
            {"id": "", "name": "Eldre CRM-system", "score": 0.98, "reason": "Kjører Java 8 direkte"},
            {"id": "", "name": "Betalingsplattformen", "score": 0.3, "reason": "Java 17 — ikke direkte påvirket, men avhengighet via CRM-integrasjon"},
        ],
        "recommended_actions": [
            {"title": "Akselerér Salesforce-migrering", "detail": "Flytt CRM-migrerings deadline frem med 2 måneder", "assignee": "Maria Olsen"},
            {"title": "Java 8 → 17 interim-oppgradering", "detail": "Dersom migrering forsinkes, oppgrader Java-runtime som mellomløsning", "assignee": "CRM Team"},
            {"title": "Oppdater PCI-DSS risikologg", "detail": "Registrer Java 8 EOL som åpen risiko i PCI-DSS compliance tracker", "assignee": "Ketil Svendsen"},
        ],
        "affected_technologies": ["Java 8", "Oracle Forms 12c"],
        "created_at": now - timedelta(hours=4),
        "status": "pending",
    },
    {
        "insight_id": "INS-EA002",
        "topic": "Kubernetes 1.28 Deprecation Warnings: API-endringer i neste versjon",
        "summary_md": """## Kubernetes 1.28 → 1.29 migrasjonsnotater

Kubernetes 1.29 fjerner flere beta-API-er som **Betalingsplattformen** bruker. Spesifikt:

- `flowcontrol.apiserver.k8s.io/v1beta3` → erstattes av `v1`
- Deprecated `HorizontalPodAutoscaler v2beta2` → bruk `v2`

### Berørte tjenester
Betalingsplattformen sine Helm-charts refererer til deprecated API-versjoner. Oppgradering til K8s 1.29 vil feile uten manifest-oppdateringer.

### Tidsramme
K8s 1.29 planlagt i klynge-oppgradering Q2 2026.""",
        "category": "deprecation",
        "urgency": "high",
        "impact_score": compute_impact_score(0.85, 0.80, 0.90, 0.70),
        "evidence": [
            {"url": "https://kubernetes.io/blog/2023/12/13/kubernetes-v1-29-release/", "source": "Kubernetes Release Blog", "snippet": "Removed deprecated beta APIs"},
        ],
        "portfolio_matches": [
            {"id": "", "name": "Betalingsplattformen", "score": 0.92, "reason": "Bruker K8s 1.28 med deprecated API-er i Helm-charts"},
        ],
        "recommended_actions": [
            {"title": "Oppdater Helm-charts", "detail": "Migrer fra v1beta3 til v1 API-er i alle Helm-templates", "assignee": "Platform Engineering"},
            {"title": "Test i staging", "detail": "Kjør full regresjonstest med K8s 1.29 i staging-miljø", "assignee": "Platform Engineering"},
        ],
        "affected_technologies": ["Kubernetes"],
        "created_at": now - timedelta(hours=12),
        "status": "acknowledged",
    },
    {
        "insight_id": "INS-EA003",
        "topic": "Spring Boot 3.3 — Ny sikkerhetsfiks for OAuth2-sårbarhet",
        "summary_md": """## Spring Boot 3.3 Security Fix

Spring Boot 3.3.0 inkluderer en kritisk fiks for en OAuth2 token-validerings-sårbarhet (CVE-2024-XXXXX). Betalingsplattformen bruker Spring Boot 3.2.1 og bør oppgraderes.

### Detaljer
Sårbarheten tillater token-forging under spesifikke konfigurasjoner av OAuth2 Resource Server. Vår konfigurasjon er *sannsynligvis* ikke direkte utsatt, men defensiv oppgradering anbefales.

### Risikovurdering
Lav sannsynlighet for utnyttelse, men høy konsekvens gitt at Betalingsplattformen håndterer finansielle transaksjoner.""",
        "category": "security",
        "urgency": "high",
        "impact_score": compute_impact_score(0.80, 0.85, 0.95, 0.75),
        "evidence": [
            {"url": "https://spring.io/blog/2024/security", "source": "Spring Security Advisory", "snippet": "OAuth2 token validation vulnerability patched in 3.3.0"},
        ],
        "portfolio_matches": [
            {"id": "", "name": "Betalingsplattformen", "score": 0.88, "reason": "Spring Boot 3.2.1 — direkte påvirket av OAuth2-sårbarhet"},
        ],
        "recommended_actions": [
            {"title": "Oppgrader Spring Boot", "detail": "3.2.1 → 3.3.0 i Betalingsplattformen", "assignee": "Platform Engineering"},
            {"title": "Sikkerhetsgjennomgang", "detail": "Verifiser OAuth2 Resource Server-konfigurasjon", "assignee": "Security Engineering"},
        ],
        "affected_technologies": ["Spring Boot", "OAuth2"],
        "created_at": now - timedelta(days=1),
        "status": "in_progress",
    },
    {
        "insight_id": "INS-EA004",
        "topic": "React 19 tilgjengelig — vurder oppgradering av Kundeportalen",
        "summary_md": """## React 19 Release

React 19 er nå offisielt utgitt med forbedringer i Server Components, nye hooks (`use`, `useFormStatus`, `useOptimistic`), og bedre Suspense-håndtering.

### Relevans for Kundeportalen
Kundeportalen bruker React 18.2 med Next.js 14.1. React 19 er bakoverkompatibelt, men krever testing av tredjepartsbiblioteker.

### Anbefaling
Planlegg oppgradering i neste sprint. Lav risiko, medium gevinst i utviklerproduktivitet.""",
        "category": "architecture",
        "urgency": "low",
        "impact_score": compute_impact_score(0.60, 0.30, 0.95, 0.20),
        "evidence": [
            {"url": "https://react.dev/blog/2024/react-19", "source": "React Blog", "snippet": "React 19 released with Server Components improvements"},
        ],
        "portfolio_matches": [
            {"id": "", "name": "Kundeportalen", "score": 0.85, "reason": "React 18.2 — direkte oppgraderingskandidat"},
        ],
        "recommended_actions": [
            {"title": "Kompatibilitetstest", "detail": "Kjør npm audit og test tredjepartsbiblioteker med React 19", "assignee": "Frontend Guild"},
        ],
        "affected_technologies": ["React", "Next.js"],
        "created_at": now - timedelta(days=2),
        "status": "pending",
    },
    {
        "insight_id": "INS-EA005",
        "topic": "PCI-DSS v4.0 — Nye krav trer i kraft mars 2025",
        "summary_md": """## PCI-DSS v4.0 Overgangsperiode utløper

PCI-DSS v4.0 har flere nye krav som trer i kraft 31. mars 2025. Betalingsplattformen og relaterte systemer må oppfylle:

- **Krav 6.4.3**: Integrity av betalingssidescripts (CSP/SRI)
- **Krav 8.3.6**: Minimumslengde på passord økt til 12 tegn
- **Krav 11.6.1**: Endringsdeteksjon på betalingssider

### Nåværende status
Betalingsplattformen oppfyller de fleste krav, men CSP-headers og SRI for tredjepartscripts er ikke implementert ennå.""",
        "category": "compliance",
        "urgency": "critical",
        "impact_score": compute_impact_score(0.95, 0.95, 0.80, 0.90),
        "evidence": [
            {"url": "https://www.pcisecuritystandards.org/", "source": "PCI SSC", "snippet": "PCI DSS v4.0 compliance deadline: March 31, 2025"},
        ],
        "portfolio_matches": [
            {"id": "", "name": "Betalingsplattformen", "score": 0.98, "reason": "PCI-DSS Level 1 sertifisert — alle nye krav gjelder"},
            {"id": "", "name": "Mobilbank-appen", "score": 0.75, "reason": "Håndterer betalinger — berørt av passordkrav"},
        ],
        "recommended_actions": [
            {"title": "Implementer CSP/SRI", "detail": "Legg til Content-Security-Policy og Subresource Integrity på betalingssider", "assignee": "Platform Engineering"},
            {"title": "Oppdater passordpolicy", "detail": "Endre minimumslengde til 12 tegn i Autentiseringstjenesten", "assignee": "Security Engineering"},
            {"title": "Planlegg PCI-audit", "detail": "Bestill ekstern QSA-audit for Q1 2025", "assignee": "Ketil Svendsen"},
        ],
        "affected_technologies": ["PCI-DSS"],
        "created_at": now - timedelta(days=3),
        "status": "in_progress",
    },
    {
        "insight_id": "INS-EA006",
        "topic": "LangChain sikkerhetsvarsling — Prompt Injection-sårbarhet",
        "summary_md": """## LangChain Prompt Injection Advisory

En sårbarhet i LangChain < 0.1.6 tillater prompt injection via brukerinput som ikke saniteres korrekt i visse chain-konfigurasjoner.

### Påvirkning
**Intern Chatbot** bruker LangChain 0.1.5 og er potensielt utsatt. Chatboten er i pilot med begrenset brukerbase, men bør oppdateres.

### Anbefaling
Oppgrader LangChain til 0.1.6+ og implementer input-sanitering i alle chains som aksepterer brukerinput.""",
        "category": "security",
        "urgency": "medium",
        "impact_score": compute_impact_score(0.70, 0.65, 0.90, 0.60),
        "evidence": [
            {"url": "https://github.com/langchain-ai/langchain/security/advisories", "source": "LangChain GitHub", "snippet": "Prompt injection vulnerability in chains < 0.1.6"},
        ],
        "portfolio_matches": [
            {"id": "", "name": "Intern Chatbot", "score": 0.92, "reason": "LangChain 0.1.5 — direkte påvirket"},
        ],
        "recommended_actions": [
            {"title": "Oppgrader LangChain", "detail": "0.1.5 → 0.1.6+ i Intern Chatbot", "assignee": "AI & Automation"},
            {"title": "Implementer input-sanitering", "detail": "Legg til sanitering for alle brukerinput i RAG-chains", "assignee": "AI & Automation"},
        ],
        "affected_technologies": ["LangChain", "Python"],
        "created_at": now - timedelta(hours=6),
        "status": "pending",
    },
    {
        "insight_id": "INS-EA007",
        "topic": "Oracle Database 19c — Utvidet support utløper april 2027",
        "summary_md": """## Oracle DB 19c Extended Support

Oracle Database 19c sin utvidede support-periode utløper i april 2027. **Eldre CRM-system** bruker Oracle DB 19c som primærdatabase.

### Implikasjon
Etter april 2027 vil det ikke lenger være tilgjengelig sikkerhetsoppdateringer uten å kjøpe premium extended support (betydelig kostnad).

### Tidslinje
- CRM-migrering til Salesforce planlagt ferdig Q4 2026
- Oracle DB 19c EOL: April 2027
- Buffer: ~6 måneder — akseptabel forutsatt at migreringsplanen holder

### Anbefaling
Overvåk migreringsfremdrift nøye. Dersom forsinkelser oppstår, vurder å budsjettere for Oracle Premium Extended Support.""",
        "category": "vendor",
        "urgency": "medium",
        "impact_score": compute_impact_score(0.75, 0.70, 0.60, 0.65),
        "evidence": [
            {"url": "https://www.oracle.com/us/support/library/lifetime-support-technology-069183.pdf", "source": "Oracle Lifetime Support Policy", "snippet": "Oracle DB 19c Extended Support ends April 2027"},
        ],
        "portfolio_matches": [
            {"id": "", "name": "Eldre CRM-system", "score": 0.95, "reason": "Bruker Oracle DB 19c som primærdatabase"},
        ],
        "recommended_actions": [
            {"title": "Følg opp migreringsplan", "detail": "Månedlig statusrapport på Salesforce-migrering", "assignee": "Maria Olsen"},
            {"title": "Budsjetter fallback", "detail": "Sett av midler til Oracle Extended Support dersom migrering forsinkes", "assignee": "Ketil Svendsen"},
        ],
        "affected_technologies": ["Oracle Database 19c", "Oracle Forms 12c"],
        "created_at": now - timedelta(days=5),
        "status": "acknowledged",
    },
]


async def seed():
    """Seed all EA Second Brain collections"""
    print("[EA Second Brain] Seeding database...")

    # Clear existing data
    for coll_name, coll in [
        ("ea_portfolio_items", ea_portfolio_items_collection),
        ("ea_watchlists", ea_watchlists_collection),
        ("ea_source_feeds", ea_source_feeds_collection),
        ("ea_insights", ea_insights_collection),
    ]:
        count = await coll.count_documents({})
        if count > 0:
            await coll.delete_many({})
            print(f"  [x] Cleared {count} existing {coll_name} documents")

    # Portfolio Items
    for item in PORTFOLIO_ITEMS:
        item["created_at"] = now - timedelta(days=90)
        item["updated_at"] = now - timedelta(days=2)
        item["insight_count"] = 0
        item["risk_score"] = None
    result = await ea_portfolio_items_collection.insert_many(PORTFOLIO_ITEMS)
    print(f"  [+] Inserted {len(result.inserted_ids)} portfolio items")

    # Update insight counts per portfolio item
    for insight in INSIGHTS:
        for match in insight.get("portfolio_matches", []):
            name = match.get("name", "")
            if name:
                await ea_portfolio_items_collection.update_one(
                    {"name": name},
                    {"$inc": {"insight_count": 1}}
                )

    # Watchlist Items
    for item in WATCHLIST_ITEMS:
        item["created_at"] = now - timedelta(days=30)
        item["last_triggered"] = None
        item["trigger_count"] = 0
    result = await ea_watchlists_collection.insert_many(WATCHLIST_ITEMS)
    print(f"  [+] Inserted {len(result.inserted_ids)} watchlist items")

    # Source Feeds
    for feed in SOURCE_FEEDS:
        feed["created_at"] = now - timedelta(days=60)
        feed["last_polled"] = now - timedelta(hours=2)
        feed["items_fetched"] = 0
        feed["status"] = "idle"
    result = await ea_source_feeds_collection.insert_many(SOURCE_FEEDS)
    print(f"  [+] Inserted {len(result.inserted_ids)} source feeds")

    # Insights
    result = await ea_insights_collection.insert_many(INSIGHTS)
    print(f"  [+] Inserted {len(result.inserted_ids)} insights")

    print()
    print("[EA Second Brain] Seed complete:")
    print(f"   Portfolio items:  {len(PORTFOLIO_ITEMS)}")
    print(f"   Watchlist items:  {len(WATCHLIST_ITEMS)}")
    print(f"   Source feeds:     {len(SOURCE_FEEDS)}")
    print(f"   Insights:         {len(INSIGHTS)}")
    print()
    print("   Run with:  python -m backend.scripts.seed_ea_brain")


if __name__ == "__main__":
    asyncio.run(seed())
