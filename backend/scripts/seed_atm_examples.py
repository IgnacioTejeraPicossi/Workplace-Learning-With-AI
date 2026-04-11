"""
ATM V&V Test Copilot — Realistic Seed Data
============================================
Populates MongoDB with realistic ATM/ATC verification & validation examples.

Based on:
  - EUROCAE ED-153 (SWIM guidelines)
  - DO-278A (Software Integrity Assurance for CNS/ATM systems)
  - EUROCONTROL STCA specifications
  - Real ATC operational procedures (ICAO Doc 4444)

Usage:
  python -m backend.scripts.seed_atm_examples
"""

import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "ai_learning"


def _ts(days_ago: int = 0) -> str:
    """ISO timestamp, optionally shifted back N days."""
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


# ═══════════════════════════════════════════════════════════════════════
# 1) REQUIREMENT BUNDLES — 5 realistic ATM requirements
# ═══════════════════════════════════════════════════════════════════════

REQUIREMENT_BUNDLES = [
    # ── REQ-1: STCA Conflict Detection ─────────────────────────────
    {
        "title": "STCA-REQ-042: Short Term Conflict Alert within 2 NM / 1000 ft",
        "sourceType": "requirement",
        "content": (
            "The Short Term Conflict Alert (STCA) system shall generate a conflict alert "
            "when the predicted minimum separation between two controlled aircraft falls below "
            "2.0 NM horizontally AND 1000 ft vertically within a look-ahead time of 120 seconds. "
            "The alert shall be displayed to the responsible controller within 2 seconds of detection. "
            "The system shall support track update rates of 4 seconds (radar) and 1 second (ADS-B). "
            "False alert rate shall not exceed 5% of total alerts per operational hour. "
            "Reference: EUROCONTROL STCA Specification v3.2, ICAO Doc 4444 Chapter 8."
        ),
        "tags": ["STCA", "conflict-detection", "safety-critical", "ED-153", "separation"],
        "normalizedSections": {
            "intent": "Generate timely conflict alerts when predicted aircraft separation falls below safety minima",
            "conditions": [
                "Two or more controlled aircraft are within surveillance coverage",
                "Track data is available with update rate ≤ 4 seconds (radar) or ≤ 1 second (ADS-B)",
                "Aircraft are within the same or adjacent control sectors",
                "Look-ahead prediction window is set to 120 seconds"
            ],
            "constraints": [
                "Minimum horizontal separation threshold: 2.0 NM",
                "Minimum vertical separation threshold: 1000 ft",
                "Alert display latency to controller: ≤ 2 seconds from detection",
                "False alert rate: ≤ 5% per operational hour",
                "System must handle mixed-mode surveillance (radar + ADS-B)"
            ],
            "expectedBehavior": [
                "Alert is generated when predicted separation breach is detected within 120s look-ahead",
                "Alert includes aircraft callsigns, current positions, predicted conflict point and time",
                "Alert is displayed on the controller's radar display within 2 seconds",
                "Alert is cleared automatically when predicted separation is restored above minima",
                "System logs all alert events with timestamps for post-incident analysis"
            ]
        },
        "createdAt": _ts(5),
    },

    # ── REQ-2: Sector Handover ─────────────────────────────────────
    {
        "title": "HND-REQ-018: Automated Sector Handover with OLDI Protocol",
        "sourceType": "requirement",
        "content": (
            "The system shall support automated flight plan transfer between adjacent Area Control Centres "
            "using the OLDI (On-Line Data Interchange) protocol as defined in EUROCONTROL OLDI Specification v4.2. "
            "The handover initiation shall occur when an aircraft is predicted to cross the sector boundary "
            "within 10 minutes ± 30 seconds. The receiving sector must acknowledge the transfer within 60 seconds. "
            "If no acknowledgement is received, the system shall escalate with a visual and audible alert "
            "to the transferring controller. Flight level, speed, and route constraints must be transferred "
            "with the coordination message. Handover frequency auto-switch must be supported for CPDLC-equipped aircraft."
        ),
        "tags": ["handover", "OLDI", "coordination", "CPDLC", "sector-boundary"],
        "normalizedSections": {
            "intent": "Automate flight plan transfer between sectors using OLDI protocol with acknowledgement enforcement",
            "conditions": [
                "Aircraft is predicted to cross sector boundary within 10 min ± 30 sec",
                "Both sectors have active OLDI connections",
                "Flight plan data is complete and valid",
                "CPDLC datalink is active for auto-frequency-switch aircraft"
            ],
            "constraints": [
                "OLDI protocol version: v4.2 (EUROCONTROL specification)",
                "Handover timing window: 10 minutes ± 30 seconds before boundary crossing",
                "Receiving sector acknowledgement timeout: 60 seconds",
                "Coordination message must include: FL, speed, route constraints",
                "Frequency auto-switch only for CPDLC-equipped aircraft"
            ],
            "expectedBehavior": [
                "System initiates OLDI ABI/ACT message at predicted boundary crossing minus 10 min",
                "Receiving sector receives coordination data and acknowledges within 60 sec",
                "If no acknowledgement: visual + audible alert to transferring controller",
                "Flight level, speed, and route constraints are correctly transferred",
                "CPDLC-equipped aircraft receive automatic frequency switch instruction",
                "All coordination messages are logged with timestamps for audit trail"
            ]
        },
        "createdAt": _ts(4),
    },

    # ── REQ-3: Trajectory Prediction ───────────────────────────────
    {
        "title": "TP-REQ-007: 4D Trajectory Prediction Accuracy for Conflict Detection",
        "sourceType": "spec_excerpt",
        "content": (
            "The Trajectory Prediction (TP) engine shall compute 4-dimensional trajectory predictions "
            "(latitude, longitude, altitude, time) for all controlled flights with the following accuracy: "
            "Cross-track error ≤ 1.0 NM for predictions up to 5 minutes; ≤ 2.5 NM up to 15 minutes; "
            "≤ 5.0 NM up to 30 minutes. Along-track error (time at fix): ≤ 30 seconds for 5 min, "
            "≤ 90 seconds for 15 min, ≤ 180 seconds for 30 min. Vertical accuracy: ≤ 200 ft for 5 min, "
            "≤ 500 ft for 15 min. TP shall use aircraft performance models (BADA v3.15), "
            "current meteorological data (GRIB2 wind/temp), and filed flight plan route. "
            "Prediction update rate: every track update cycle. "
            "Reference: SESAR TP Concept, EUROCONTROL BADA Aircraft Performance Model."
        ),
        "tags": ["trajectory", "4D-prediction", "BADA", "accuracy", "SESAR"],
        "normalizedSections": {
            "intent": "Compute accurate 4D trajectory predictions using BADA performance models and meteorological data",
            "conditions": [
                "Aircraft has a valid filed flight plan with route waypoints",
                "Surveillance track data is available (radar or ADS-B)",
                "Aircraft performance model (BADA v3.15) is loaded for the aircraft type",
                "Current meteorological data (GRIB2 wind/temperature grids) is available",
                "Prediction is computed every track update cycle"
            ],
            "constraints": [
                "Cross-track error: ≤ 1.0 NM (5 min), ≤ 2.5 NM (15 min), ≤ 5.0 NM (30 min)",
                "Along-track time error: ≤ 30 sec (5 min), ≤ 90 sec (15 min), ≤ 180 sec (30 min)",
                "Vertical accuracy: ≤ 200 ft (5 min), ≤ 500 ft (15 min)",
                "Uses BADA v3.15 aircraft performance models",
                "Meteorological data source: GRIB2 format wind/temperature grids"
            ],
            "expectedBehavior": [
                "TP engine produces latitude, longitude, altitude, time predictions for each track update",
                "Predictions remain within specified accuracy bounds for each time horizon",
                "Turn points, altitude changes, and speed adjustments from FPL are reflected in prediction",
                "When meteorological data is stale (>1 hour), system flags reduced prediction confidence",
                "Prediction output is available to downstream consumers (STCA, MTCD) within 500ms"
            ]
        },
        "createdAt": _ts(3),
    },

    # ── REQ-4: Degraded Surveillance Mode ──────────────────────────
    {
        "title": "SUR-REQ-031: Degraded Mode Operations Under Radar Failure",
        "sourceType": "defect",
        "content": (
            "DEFECT REPORT DR-2026-0247: During the Oslo ACC radar maintenance window on 2026-02-15, "
            "the fallback from primary radar (PSR/SSR) to ADS-B-only mode did not correctly adjust "
            "the STCA separation parameters. The system continued using 2.0 NM horizontal separation "
            "threshold instead of switching to the degraded-mode value of 5.0 NM as specified in "
            "SUR-REQ-031. This caused 12 false STCA clearances (conflicts not alerted) during the "
            "47-minute degraded period. Root cause: the surveillance mode flag in the STCA configuration "
            "was not updated when the radar feed dropout was detected. "
            "Affected software: STCA Engine v2.8.1, Surveillance Gateway v1.4.0. "
            "Severity: HAZARDOUS (per DO-278A classification). "
            "Required fix: Implement automatic STCA parameter adjustment when surveillance mode changes."
        ),
        "tags": ["degraded-mode", "radar-failure", "ADS-B", "STCA", "hazardous", "DO-278A"],
        "normalizedSections": {
            "intent": "Ensure STCA parameters automatically adjust when surveillance mode degrades from radar to ADS-B-only",
            "conditions": [
                "Primary surveillance radar (PSR/SSR) becomes unavailable",
                "System transitions to ADS-B-only surveillance mode",
                "STCA engine is actively monitoring traffic",
                "Surveillance Gateway detects radar feed dropout"
            ],
            "constraints": [
                "Normal mode separation: 2.0 NM horizontal, 1000 ft vertical",
                "Degraded mode separation: 5.0 NM horizontal, 1000 ft vertical",
                "Mode transition must occur within 10 seconds of radar feed loss detection",
                "DO-278A severity classification: HAZARDOUS",
                "All mode transitions must be logged with timestamp and trigger event"
            ],
            "expectedBehavior": [
                "Surveillance Gateway detects radar feed dropout within 3 radar update cycles (12 sec)",
                "STCA parameter configuration switches to degraded-mode values automatically",
                "Horizontal separation threshold increases from 2.0 NM to 5.0 NM",
                "Controller receives visual notification of degraded surveillance mode",
                "When radar is restored, parameters revert to normal-mode values",
                "All transitions are logged for post-event safety analysis"
            ]
        },
        "createdAt": _ts(2),
    },

    # ── REQ-5: Conformance Monitoring ──────────────────────────────
    {
        "title": "CM-REQ-015: Route Conformance Monitoring with Lateral Deviation Alert",
        "sourceType": "user_story",
        "content": (
            "As an en-route controller, I need the system to continuously monitor each aircraft's "
            "actual position against its cleared flight plan route and alert me when an aircraft "
            "deviates laterally by more than 5 NM from its cleared route or vertically by more than "
            "300 ft from its cleared flight level. The alert should distinguish between 'deviation warning' "
            "(approaching limit: 80% of threshold) and 'deviation alert' (threshold exceeded). "
            "The system should also predict whether the deviation will self-correct based on the current "
            "heading trend over the next 60 seconds. If the deviation is predicted to increase, "
            "escalate to 'non-conformance alert' with recommended controller action. "
            "This capability is essential for RVSM airspace operations above FL290."
        ),
        "tags": ["conformance", "route-monitoring", "RVSM", "lateral-deviation", "alert-levels"],
        "normalizedSections": {
            "intent": "Monitor aircraft conformance to cleared route and flight level with tiered alerting",
            "conditions": [
                "Aircraft has a valid cleared flight plan route",
                "Surveillance data provides position updates at ≤ 5 second intervals",
                "Aircraft is within controlled airspace",
                "Route data includes waypoints, cleared flight level, and cleared heading"
            ],
            "constraints": [
                "Lateral deviation threshold: 5 NM from cleared route centerline",
                "Vertical deviation threshold: 300 ft from cleared flight level",
                "Warning level at 80% of threshold (4 NM lateral, 240 ft vertical)",
                "Self-correction prediction window: 60 seconds",
                "Applicable to RVSM airspace (above FL290)",
                "Must distinguish: warning → alert → non-conformance escalation"
            ],
            "expectedBehavior": [
                "System computes lateral and vertical deviation from cleared route every position update",
                "At 80% threshold (4 NM / 240 ft): 'deviation warning' displayed",
                "At 100% threshold (5 NM / 300 ft): 'deviation alert' displayed",
                "System predicts heading trend for next 60 seconds using last 3 position updates",
                "If deviation predicted to increase: escalate to 'non-conformance alert' with action recommendation",
                "Alerts include aircraft callsign, deviation magnitude, trend direction"
            ]
        },
        "createdAt": _ts(1),
    },
]

# ═══════════════════════════════════════════════════════════════════════
# 2) TEST DESIGNS — linked to requirements above (indices 0 and 3)
# ═══════════════════════════════════════════════════════════════════════

TEST_DESIGNS = [
    # ── Design for STCA-REQ-042 (will be linked after insert) ──────
    {
        "_req_index": 0,  # link to REQUIREMENT_BUNDLES[0]
        "requirementTitle": "STCA-REQ-042: Short Term Conflict Alert within 2 NM / 1000 ft",
        "intent": "Verify STCA alert generation timing, accuracy, and false alert rate under nominal and stressed conditions",
        "assumptions": [
            "Test environment has simulated radar and ADS-B feeds with configurable update rates",
            "Test aircraft performance models (BADA) are loaded for B738, A320, and E190 types",
            "Meteorological conditions are standard (ISA) unless specified in test case",
            "Controller display simulator is connected and records alert timestamps"
        ],
        "testConditions": [
            "At least 2 simulated aircraft tracks are active within 50 NM of each other",
            "Surveillance feed is operational with 4-second update cycle (radar) or 1-second (ADS-B)",
            "STCA engine is running with production configuration parameters",
            "Separation minima set to 2.0 NM horizontal / 1000 ft vertical"
        ],
        "positiveTests": [
            {
                "title": "PT-01: Head-on conflict at FL350 — nominal radar feed",
                "description": "Two B738 aircraft approaching head-on at FL350, each at 450 kts ground speed. Verify STCA generates alert when predicted separation breaches 2.0 NM within 120s.",
                "steps": [
                    "Configure aircraft A (BAW123) at N55°00 E010°00, heading 090, FL350, GS 450kt",
                    "Configure aircraft B (SAS456) at N55°00 E010°30, heading 270, FL350, GS 450kt",
                    "Start simulation clock with 4-second radar update rate",
                    "Monitor STCA alert queue for conflict detection",
                    "Record timestamp of first alert generation",
                    "Verify alert contains both callsigns, predicted CPA point and time",
                    "Verify alert displayed on controller screen within 2 seconds of detection"
                ],
                "expectedOutcome": "STCA alert generated approximately 120 seconds before CPA, displayed within 2 seconds, containing BAW123 and SAS456 callsigns"
            },
            {
                "title": "PT-02: Converging tracks with altitude conflict — ADS-B feed",
                "description": "A320 climbing through FL310 into conflict with E190 level at FL320. Verify altitude-based conflict detection with 1-second ADS-B feed.",
                "steps": [
                    "Configure aircraft A (DLH789) at N56°00 E008°00, heading 045, climbing FL290→FL350, ROC 2000 fpm",
                    "Configure aircraft B (NAX012) at N56°10 E008°20, heading 180, FL320 level, GS 420kt",
                    "Enable ADS-B feed at 1-second update rate",
                    "Start simulation and monitor vertical profile intersection",
                    "Record STCA alert timing relative to predicted FL conflict point",
                    "Verify separation metrics: horizontal distance at altitude conflict point"
                ],
                "expectedOutcome": "STCA detects predicted vertical conflict at FL310-FL320 overlap, generates alert with correct vertical and horizontal separation metrics"
            },
            {
                "title": "PT-03: Multiple simultaneous conflicts in dense traffic",
                "description": "Inject 8 aircraft in a 30 NM radius sector with 3 simultaneous conflict pairs. Verify all 3 conflicts are detected and individually alerted.",
                "steps": [
                    "Configure 8 aircraft tracks in sector ENGM_APP area",
                    "Design 3 conflict geometries: head-on (pair 1), converging (pair 2), same-direction overtake (pair 3)",
                    "Ensure 2 non-conflicting pairs exist as noise traffic",
                    "Start simulation with mixed radar/ADS-B feeds",
                    "Record all STCA alerts generated within 180 seconds",
                    "Verify each conflict pair receives its own distinct alert"
                ],
                "expectedOutcome": "All 3 conflict pairs alerted correctly; non-conflicting pairs do not generate false alerts"
            }
        ],
        "negativeTests": [
            {
                "title": "NT-01: Parallel tracks with adequate separation — no false alert",
                "description": "Two aircraft flying parallel routes 3.5 NM apart at same altitude. Verify no STCA alert is generated.",
                "steps": [
                    "Configure aircraft A at FL370, heading 090, route along N55°00",
                    "Configure aircraft B at FL370, heading 090, route along N55°03.5 (3.5 NM south)",
                    "Run simulation for 300 seconds with 4-second radar updates",
                    "Verify STCA alert queue remains empty for this pair",
                    "Record any nuisance alert timestamps for false-alert-rate calculation"
                ],
                "expectedOutcome": "No STCA alert generated for aircraft maintaining 3.5 NM separation (above 2.0 NM threshold)"
            },
            {
                "title": "NT-02: Aircraft at different flight levels with 1200 ft vertical separation",
                "description": "Crossing tracks at FL330 and FL342 (1200 ft separation). Verify no alert when vertical separation exceeds 1000 ft.",
                "steps": [
                    "Configure aircraft A at FL330 level, heading 090",
                    "Configure aircraft B at FL342 level, heading 180, tracks crossing over A's position",
                    "Run simulation through the crossing point",
                    "Verify horizontal separation breach alone (< 2 NM at crossing) does not trigger alert",
                    "Confirm vertical separation (1200 ft) prevents STCA activation"
                ],
                "expectedOutcome": "No STCA alert generated because vertical separation (1200 ft) exceeds the 1000 ft threshold"
            }
        ],
        "edgeCases": [
            {
                "title": "EC-01: Conflict at exactly 2.0 NM / 1000 ft boundary",
                "description": "Aircraft predicted to reach exactly 2.0 NM horizontal and 1000 ft vertical simultaneously. Test boundary condition behavior.",
                "steps": [
                    "Configure geometry where predicted CPA is exactly 2.0 NM horizontal, 1000 ft vertical",
                    "Use high-precision simulated positions (0.001 NM increments)",
                    "Run 10 iterations with slight variations (±0.1 NM, ±50 ft)",
                    "Record alert/no-alert decision for each iteration",
                    "Verify boundary is treated as 'less than' (< 2.0 NM AND < 1000 ft triggers alert)"
                ],
                "expectedOutcome": "Alert generated for separations below 2.0 NM AND below 1000 ft; no alert at exactly 2.0 NM or exactly 1000 ft"
            },
            {
                "title": "EC-02: Surveillance feed gap during conflict evolution",
                "description": "Radar feed drops for 20 seconds during an evolving conflict. Verify coast-track prediction maintains conflict detection.",
                "steps": [
                    "Configure a developing head-on conflict at FL350",
                    "At T+60s (conflict developing), simulate radar feed dropout for 20 seconds",
                    "Verify system uses coast-track extrapolation during the gap",
                    "Verify conflict alert is either maintained or re-generated when feed resumes",
                    "Record any alert flickering during the dropout period"
                ],
                "expectedOutcome": "STCA maintains conflict alert during feed gap using coast-track prediction; alert does not flicker off/on at feed restoration"
            }
        ],
        "automationCandidates": [
            "PT-01 and PT-02 — parameterizable geometry, can be fully automated with SimATM API",
            "NT-01 — parallel track non-alert, ideal for regression suite",
            "EC-01 — boundary condition sweep, automation reduces manual setup effort"
        ],
        "traceabilityIds": ["STCA-REQ-042", "STCA-REQ-043", "SUR-REQ-010"],
        "openQuestions": [
            "Should STCA alert persist if one aircraft enters an emergency squawk (7700) during the conflict?",
            "What is the expected behavior when coast-track confidence drops below 50% during feed gap?"
        ],
        "createdAt": _ts(4),
    },

    # ── Design for SUR-REQ-031 (Degraded Mode) ────────────────────
    {
        "_req_index": 3,  # link to REQUIREMENT_BUNDLES[3]
        "requirementTitle": "SUR-REQ-031: Degraded Mode Operations Under Radar Failure",
        "intent": "Verify automatic STCA parameter adjustment when surveillance degrades from radar to ADS-B-only mode",
        "assumptions": [
            "Surveillance Gateway can simulate radar feed dropout and restoration",
            "STCA parameter configuration is accessible via runtime API for verification",
            "Test environment supports injecting precise timing for mode transitions",
            "DO-278A hazard severity assessment has been reviewed for this test scope"
        ],
        "testConditions": [
            "STCA engine running with normal-mode parameters (2.0 NM / 1000 ft)",
            "Both radar and ADS-B feeds are active initially",
            "Surveillance Gateway monitoring is enabled",
            "STCA parameter change events are logged"
        ],
        "positiveTests": [
            {
                "title": "PT-01: Radar dropout triggers parameter switch to degraded mode",
                "description": "Simulate complete radar feed loss. Verify STCA horizontal threshold increases from 2.0 NM to 5.0 NM within 10 seconds.",
                "steps": [
                    "Start with normal-mode surveillance (radar + ADS-B both active)",
                    "Verify STCA horizontal threshold = 2.0 NM via parameter API",
                    "Simulate radar feed dropout at T=0",
                    "Monitor Surveillance Gateway mode change detection (expected ≤ 12 sec)",
                    "Query STCA parameter API at T+10 seconds",
                    "Verify horizontal threshold is now 5.0 NM",
                    "Verify vertical threshold remains 1000 ft",
                    "Confirm mode transition logged with timestamp and trigger='radar_feed_loss'"
                ],
                "expectedOutcome": "STCA horizontal separation threshold changes from 2.0 NM to 5.0 NM within 10 seconds of radar feed loss detection"
            },
            {
                "title": "PT-02: Radar restoration reverts parameters to normal mode",
                "description": "After degraded-mode transition, restore radar feed. Verify parameters revert to normal within 10 seconds.",
                "steps": [
                    "Ensure system is in degraded mode (horizontal threshold = 5.0 NM)",
                    "Restore radar feed at T=0",
                    "Monitor Surveillance Gateway for mode restoration detection",
                    "Query STCA parameter API at T+10 seconds",
                    "Verify horizontal threshold reverts to 2.0 NM",
                    "Confirm revert transition logged with trigger='radar_feed_restored'"
                ],
                "expectedOutcome": "STCA parameters revert to normal-mode values within 10 seconds of radar restoration"
            }
        ],
        "negativeTests": [
            {
                "title": "NT-01: Intermittent radar — no premature mode switch",
                "description": "Simulate brief radar dropouts (< 3 update cycles / 12 sec). Verify system does NOT switch to degraded mode.",
                "steps": [
                    "Configure radar feed with 8-second dropout (2 missed cycles)",
                    "Verify STCA parameters remain at normal-mode values throughout",
                    "Repeat with 4-second dropout (1 missed cycle)",
                    "Confirm no spurious mode transition events in log"
                ],
                "expectedOutcome": "STCA remains in normal mode during brief dropouts shorter than 3 update cycles"
            },
            {
                "title": "NT-02: ADS-B dropout with radar still active — no mode change",
                "description": "Simulate ADS-B feed loss while radar remains active. Verify no degraded-mode transition.",
                "steps": [
                    "Ensure both feeds are active, STCA at normal-mode",
                    "Simulate ADS-B feed dropout",
                    "Monitor for 60 seconds",
                    "Verify STCA horizontal threshold remains 2.0 NM",
                    "Verify no degraded-mode alert generated"
                ],
                "expectedOutcome": "No mode change when only ADS-B is lost — radar is the primary surveillance source"
            }
        ],
        "edgeCases": [
            {
                "title": "EC-01: Simultaneous radar and ADS-B failure",
                "description": "Both surveillance feeds lost simultaneously. Verify system enters total-loss mode and generates critical controller alert.",
                "steps": [
                    "Simulate simultaneous dropout of radar AND ADS-B feeds",
                    "Verify STCA enters a 'surveillance-lost' state (not just degraded)",
                    "Verify controller receives CRITICAL alert: 'ALL SURVEILLANCE LOST'",
                    "Verify STCA suspends conflict alerting (cannot predict with no data)",
                    "Confirm event is logged as severity HAZARDOUS"
                ],
                "expectedOutcome": "System enters total surveillance loss state, suspends STCA, and generates CRITICAL controller alert"
            }
        ],
        "automationCandidates": [
            "PT-01 and PT-02 — fully automatable via Surveillance Gateway API simulation endpoints",
            "NT-01 — intermittent radar test can be automated with timing parameter sweep"
        ],
        "traceabilityIds": ["SUR-REQ-031", "STCA-REQ-042", "DR-2026-0247"],
        "openQuestions": [
            "What is the minimum radar feed quality (% of expected updates) before degraded mode should trigger?",
            "Should the system support partial degraded mode (e.g., single radar out of multiple)?"
        ],
        "createdAt": _ts(2),
    },

    # ── Design for CM-REQ-015 (Conformance Monitoring) ─────────────
    {
        "_req_index": 4,  # link to REQUIREMENT_BUNDLES[4]
        "requirementTitle": "CM-REQ-015: Route Conformance Monitoring with Lateral Deviation Alert",
        "intent": "Verify tiered conformance monitoring alerts and self-correction prediction accuracy",
        "assumptions": [
            "Aircraft position simulator can inject controlled lateral deviations",
            "Cleared route data is loaded in the flight data processor",
            "RVSM airspace is configured above FL290 in the test environment",
            "Controller display captures alert levels with sub-second timestamps"
        ],
        "testConditions": [
            "Single aircraft flying a defined route with 5+ waypoints",
            "Surveillance feed at ≤ 5-second update intervals",
            "Route conformance monitoring engine is active",
            "Alert thresholds: warning at 4 NM / 240 ft, alert at 5 NM / 300 ft"
        ],
        "positiveTests": [
            {
                "title": "PT-01: Progressive lateral deviation 0→6 NM triggers warning then alert",
                "description": "Gradually deviate aircraft laterally from route. Verify warning at 4 NM and alert at 5 NM.",
                "steps": [
                    "Aircraft BAW455 flying route NORDI → LAPEX → GIPER at FL350",
                    "At LAPEX, inject progressive heading change causing lateral drift",
                    "Record deviation at each surveillance update",
                    "Verify 'deviation warning' at 4.0 NM lateral offset (±0.2 NM tolerance)",
                    "Verify 'deviation alert' at 5.0 NM lateral offset",
                    "Verify alert includes callsign, deviation magnitude (NM), trend"
                ],
                "expectedOutcome": "Warning at 4.0 NM, alert at 5.0 NM, both with correct metadata"
            },
            {
                "title": "PT-02: Vertical deviation in RVSM airspace triggers tiered alerts",
                "description": "Aircraft at FL350 drifts vertically. Verify 240 ft warning and 300 ft alert.",
                "steps": [
                    "Aircraft NAX789 level at FL350 (RVSM airspace)",
                    "Inject gradual altitude drift: +50 ft per update cycle",
                    "Record altitude deviation vs cleared FL350",
                    "Verify 'deviation warning' at 240 ft deviation",
                    "Verify 'deviation alert' at 300 ft deviation"
                ],
                "expectedOutcome": "Vertical warning at 240 ft, alert at 300 ft, applicable in RVSM airspace"
            }
        ],
        "negativeTests": [
            {
                "title": "NT-01: Normal route following with minor deviations — no alert",
                "description": "Aircraft following route with typical ±1.5 NM navigation accuracy. Verify no alerts generated.",
                "steps": [
                    "Aircraft SAS321 following route with GPS navigation (±0.1 NM typical, ±1.5 NM max)",
                    "Run simulation for 20 minutes of en-route flight",
                    "Verify no deviation warning or alert is generated",
                    "Maximum lateral deviation in test: 1.5 NM (well below 4 NM warning threshold)"
                ],
                "expectedOutcome": "No conformance alerts for deviations within normal navigation accuracy bounds"
            }
        ],
        "edgeCases": [
            {
                "title": "EC-01: Self-correcting deviation — predict trend and avoid escalation",
                "description": "Aircraft deviates to 4.5 NM (warning level) but heading trend shows return to route. Verify no escalation to alert.",
                "steps": [
                    "Inject deviation reaching 4.5 NM lateral offset",
                    "At 4.5 NM deviation, change heading back toward route centerline",
                    "System analyzes last 3 position updates and predicts deviation will decrease",
                    "Verify system keeps 'warning' level but does NOT escalate to 'alert'",
                    "Verify 'self-correcting' indicator is set in the alert metadata"
                ],
                "expectedOutcome": "Warning maintained but not escalated; system correctly predicts self-correction from heading trend"
            }
        ],
        "automationCandidates": [
            "PT-01 — deviation injection is parameterizable, ideal for automated regression",
            "EC-01 — self-correction prediction can be tested with varied heading change rates"
        ],
        "traceabilityIds": ["CM-REQ-015", "RVSM-REQ-003", "NAV-REQ-008"],
        "openQuestions": [
            "Should conformance monitoring be suspended during ATC-instructed turns (which cause temporary deviation)?",
            "What is the minimum number of position updates needed for reliable heading trend prediction?"
        ],
        "createdAt": _ts(1),
    },
]

# ═══════════════════════════════════════════════════════════════════════
# 3) SCENARIO MATRICES — 3 realistic ATM scenario types
# ═══════════════════════════════════════════════════════════════════════

SCENARIO_MATRICES = [
    # ── Conflict Detection Scenarios ───────────────────────────────
    {
        "scenarioType": "conflict_detection",
        "riskLevel": "high",
        "parameters": {
            "airspace": "Oslo ACC (ENGM FIR)",
            "trafficDensity": "35 aircraft/hour",
            "surveillanceMode": "mixed radar + ADS-B",
            "weatherConditions": "CB activity reported N of ENGM, wind 270/45kt at FL350"
        },
        "includeEdgeCases": True,
        "includeFallbacks": True,
        "title": "STCA Conflict Detection Validation — Oslo ACC High-Density Traffic",
        "preconditions": [
            "Oslo ACC sector configuration: 3 active sectors (North, South, Approach)",
            "Traffic load: 35 movements/hour (peak period simulation)",
            "Mixed surveillance: 2 radar heads (Bømoen, Røyken) + ADS-B receivers",
            "STCA engine running v2.8.2 with standard separation parameters",
            "Weather: cumulonimbus activity causing route deviations north of ENGM"
        ],
        "nominalScenarios": [
            {
                "name": "NOM-01: Standard en-route conflict, head-on at FL370",
                "variables": {
                    "aircraftA": "SAS4721 (B738), FL370, heading 065, GS 455kt",
                    "aircraftB": "DLH1832 (A320), FL370, heading 245, GS 448kt",
                    "initialSeparation": "45 NM",
                    "expectedAlertTime": "T-118s before CPA"
                },
                "expectedOutcome": "STCA generates alert at 120±5s before CPA with correct callsigns and predicted conflict geometry"
            },
            {
                "name": "NOM-02: Climbing aircraft conflict with level traffic",
                "variables": {
                    "aircraftA": "NAX142 (B738), climbing FL290→FL370, ROC 1800 fpm",
                    "aircraftB": "FIN823 (E190), FL350 level, heading 180, GS 420kt",
                    "conflictAltitude": "FL347-FL353 (during climb through)",
                    "expectedAlertTime": "T-95s before altitude conflict"
                },
                "expectedOutcome": "STCA detects altitude conflict during climb-through, alerts with vertical and horizontal separation prediction"
            },
            {
                "name": "NOM-03: Same-direction overtake conflict",
                "variables": {
                    "aircraftA": "BAW762 (B777), FL350, heading 090, GS 490kt",
                    "aircraftB": "WZZ5541 (A321), FL350, heading 090, GS 440kt (50kt slower)",
                    "initialSeparation": "12 NM (A behind B)",
                    "expectedAlertTime": "T-110s before separation breach"
                },
                "expectedOutcome": "STCA detects decreasing same-direction separation and alerts before it drops below 2.0 NM"
            }
        ],
        "degradedScenarios": [
            {
                "name": "DEG-01: Single radar failure — Bømoen offline",
                "variables": {
                    "failedRadar": "Bømoen PSR/SSR",
                    "remainingSurveillance": "Røyken radar + ADS-B",
                    "coverageGap": "Sector North above FL250 — reduced to ADS-B only",
                    "stcaMode": "Degraded (5.0 NM horizontal threshold for gap area)"
                },
                "expectedOutcome": "STCA switches to degraded parameters for Sector North gap area; normal parameters maintained where Røyken radar covers"
            },
            {
                "name": "DEG-02: ADS-B message spoofing detected",
                "variables": {
                    "spoofedAircraft": "Unknown target injecting false ADS-B position reports",
                    "affectedArea": "10 NM radius around N60°10 E011°30",
                    "validationAction": "ADS-B validation filter flags inconsistent reports"
                },
                "expectedOutcome": "System filters spoofed ADS-B target, does not generate false STCA alerts based on ghost aircraft"
            }
        ],
        "edgeCases": [
            {
                "name": "EDGE-01: Three-aircraft conflict — simultaneous convergence",
                "variables": {
                    "aircraftA": "SAS891, FL350, heading 090",
                    "aircraftB": "DLH433, FL350, heading 210",
                    "aircraftC": "NAX156, FL350, heading 330",
                    "geometry": "120-degree convergence pattern, CPA within 30 seconds of each other"
                },
                "expectedOutcome": "STCA generates 3 separate conflict alerts (A-B, A-C, B-C) with distinct alert IDs"
            },
            {
                "name": "EDGE-02: Conflict during TCAS RA execution",
                "variables": {
                    "aircraftA": "BAW221, FL350, TCAS RA commanding 'descend'",
                    "aircraftB": "THY308, FL340, level",
                    "complication": "TCAS RA may create new conflict with aircraft B at FL340"
                },
                "expectedOutcome": "STCA considers TCAS RA trajectory modification in prediction; alerts controller about potential secondary conflict"
            }
        ],
        "expectedOutcomes": [
            "All nominal conflicts detected within ±10 seconds of expected alert time",
            "Degraded-mode parameter switch occurs automatically and correctly",
            "No false alerts generated from non-conflicting traffic pairs",
            "Three-aircraft scenario produces all 3 pair-wise alerts"
        ],
        "riskNotes": [
            "HAZARDOUS: Missed conflict alert in degraded mode could lead to loss of separation (LOS)",
            "MAJOR: False STCA alerts erode controller trust, potentially causing 'cry wolf' effect",
            "MAJOR: ADS-B spoofing could mask real conflicts if filtering is too aggressive"
        ],
        "automationNotes": [
            "NOM-01 through NOM-03: fully automatable via SimATM scenario injection API",
            "DEG-01: requires Surveillance Gateway simulation mode for radar dropout",
            "EDGE-02: requires TCAS simulator integration for RA trajectory prediction"
        ],
        "createdAt": _ts(3),
    },

    # ── Sector Handover Scenarios ──────────────────────────────────
    {
        "scenarioType": "sector_handover",
        "riskLevel": "medium",
        "parameters": {
            "sectors": "Oslo ACC South → Stockholm ACC West",
            "protocol": "OLDI v4.2",
            "trafficMix": "70% CPDLC-equipped, 30% voice-only",
            "peakHour": True
        },
        "includeEdgeCases": True,
        "includeFallbacks": True,
        "title": "Cross-ACC Sector Handover Validation — Oslo/Stockholm Boundary",
        "preconditions": [
            "OLDI connection active between Oslo ACC and Stockholm ACC",
            "Test flights crossing FIR boundary at waypoint TOTKI",
            "Mixed fleet: 70% CPDLC-equipped, 30% voice-only",
            "Peak traffic: 22 handovers expected in 60-minute window"
        ],
        "nominalScenarios": [
            {
                "name": "NOM-01: Standard CPDLC-equipped handover at TOTKI",
                "variables": {
                    "flight": "SAS1257 (B738), FL370, CPDLC-equipped",
                    "handoverPoint": "TOTKI (N59°30 E015°00)",
                    "initiationTime": "10 min before boundary ± 30 sec",
                    "expectedAck": "Within 60 seconds"
                },
                "expectedOutcome": "OLDI ABI sent at T-10min, ACT received within 60 sec, frequency auto-switch via CPDLC at boundary crossing"
            },
            {
                "name": "NOM-02: Voice-only aircraft handover",
                "variables": {
                    "flight": "RYR4488 (B738), FL330, voice-only (no CPDLC)",
                    "handoverPoint": "TOTKI",
                    "initiationTime": "10 min before boundary",
                    "frequencyChange": "Manual — controller instructs frequency change"
                },
                "expectedOutcome": "OLDI coordination completed, controller receives prompt to issue voice frequency change instruction"
            }
        ],
        "degradedScenarios": [
            {
                "name": "DEG-01: OLDI connection timeout — Stockholm not responding",
                "variables": {
                    "flight": "NAX773 (B738), FL350, 8 min to boundary",
                    "oldiStatus": "ACT message sent, no acknowledgement after 60 seconds",
                    "fallbackAction": "Visual + audible alert to Oslo ACC controller"
                },
                "expectedOutcome": "System escalates to controller after 60-second timeout with recommended action: initiate voice coordination"
            },
            {
                "name": "DEG-02: CPDLC datalink failure during handover",
                "variables": {
                    "flight": "FIN901 (A320), CPDLC-equipped but datalink lost",
                    "detectionTrigger": "CPDLC message delivery failure",
                    "fallbackAction": "System downgrades to voice-handover procedure"
                },
                "expectedOutcome": "System detects CPDLC failure, cancels auto-frequency-switch, alerts controller to use voice procedure"
            }
        ],
        "edgeCases": [
            {
                "name": "EDGE-01: Revised flight level during handover coordination",
                "variables": {
                    "flight": "DLH450 (A320), initially FL370",
                    "levelChange": "Controller clears descent to FL330 AFTER OLDI ABI sent",
                    "coordination": "Updated OLDI message needed with new FL"
                },
                "expectedOutcome": "System sends OLDI MAC (modification after coordination) with updated FL330; Stockholm acknowledges new level"
            },
            {
                "name": "EDGE-02: Simultaneous handover of 5 aircraft within 3 minutes",
                "variables": {
                    "flights": "5 aircraft crossing TOTKI within 180 seconds",
                    "spacing": "Average 36 seconds between boundary crossings",
                    "oldiLoad": "5 ABI + 5 ACT messages in rapid succession"
                },
                "expectedOutcome": "All 5 handovers processed correctly without message collision or dropped coordination"
            }
        ],
        "expectedOutcomes": [
            "All CPDLC handovers complete with automatic frequency switch",
            "Voice-only aircraft handovers generate controller prompts",
            "OLDI timeout produces immediate controller escalation",
            "Burst of 5 simultaneous handovers processed without errors"
        ],
        "riskNotes": [
            "MAJOR: Failed handover coordination could cause aircraft to enter receiving sector without controller awareness",
            "MINOR: CPDLC failure during handover causes frequency confusion if not detected promptly",
            "MAJOR: Message collision under peak load could delay time-critical coordination"
        ],
        "automationNotes": [
            "NOM-01 and NOM-02: automatable via OLDI message simulator",
            "DEG-01: requires OLDI connection simulation with configurable timeout",
            "EDGE-02: stress-test scenario, needs traffic generator with precise timing control"
        ],
        "createdAt": _ts(2),
    },

    # ── Alert Timing Scenarios ─────────────────────────────────────
    {
        "scenarioType": "alert_timing",
        "riskLevel": "high",
        "parameters": {
            "alertTypes": ["STCA", "MSAW", "APW", "DAIW"],
            "measurementMethod": "End-to-end: detection → display render",
            "targetLatency": "≤ 2 seconds for all safety alerts"
        },
        "includeEdgeCases": True,
        "includeFallbacks": True,
        "title": "Safety Alert End-to-End Latency Validation — All Alert Types",
        "preconditions": [
            "All alert systems active: STCA, MSAW, APW, DAIW",
            "Controller display connected with render timestamp logging",
            "System load at 80% of rated capacity (stress condition)",
            "Alert timing measurement hooks installed in detection and display pipelines"
        ],
        "nominalScenarios": [
            {
                "name": "NOM-01: STCA alert latency under normal load",
                "variables": {
                    "alertType": "STCA",
                    "systemLoad": "50% capacity (20 aircraft)",
                    "expectedLatency": "≤ 1.5 seconds",
                    "measurementPoints": "STCA engine output → display render complete"
                },
                "expectedOutcome": "STCA alert displayed within 1.5 seconds of engine detection event"
            },
            {
                "name": "NOM-02: MSAW (Minimum Safe Altitude Warning) latency",
                "variables": {
                    "alertType": "MSAW",
                    "trigger": "Aircraft descending below sector safe altitude",
                    "systemLoad": "50% capacity",
                    "expectedLatency": "≤ 1.2 seconds"
                },
                "expectedOutcome": "MSAW alert rendered within 1.2 seconds of terrain proximity detection"
            }
        ],
        "degradedScenarios": [
            {
                "name": "DEG-01: Alert latency at 95% system capacity",
                "variables": {
                    "systemLoad": "95% capacity (38 aircraft, 4 simultaneous conflicts)",
                    "alertTypes": "All (STCA, MSAW, APW, DAIW)",
                    "maxAcceptableLatency": "≤ 2.0 seconds (absolute maximum)"
                },
                "expectedOutcome": "All safety alerts still rendered within 2.0 seconds even at 95% load"
            }
        ],
        "edgeCases": [
            {
                "name": "EDGE-01: 10 simultaneous alerts from different systems",
                "variables": {
                    "simultaneousAlerts": "3× STCA + 2× MSAW + 3× APW + 2× DAIW = 10 alerts",
                    "timeWindow": "All 10 trigger within 500ms of each other",
                    "maxAcceptableLatency": "≤ 2.0 seconds for all 10"
                },
                "expectedOutcome": "All 10 alerts rendered within 2.0 seconds; priority ordering is correct (STCA/MSAW before APW/DAIW)"
            }
        ],
        "expectedOutcomes": [
            "All safety alerts meet ≤ 2.0 second latency requirement",
            "Latency does not degrade beyond specification at 95% load",
            "Alert priority ordering is maintained under burst conditions"
        ],
        "riskNotes": [
            "HAZARDOUS: Alert latency > 2 seconds in conflict situations could prevent timely controller intervention",
            "MAJOR: Priority inversion (low-priority alert blocking high-priority) could delay critical safety information"
        ],
        "automationNotes": [
            "All scenarios automatable via alert injection and display timestamp capture",
            "Recommended: run latency sweep from 20% to 100% capacity in 10% increments",
            "Statistical analysis needed: measure P50, P95, P99 latencies per alert type"
        ],
        "createdAt": _ts(1),
    },
]

# ═══════════════════════════════════════════════════════════════════════
# 4) TEST RUN ANALYSES — 2 realistic post-test-run analyses
# ═══════════════════════════════════════════════════════════════════════

TEST_RUN_ANALYSES = [
    # ── Run 1: STCA regression test with failures ─────────────────
    {
        "runId": "STCA-REG-2026-04-08-001",
        "artifactCount": 4,
        "artifactTypes": ["test_log", "json_result", "console_output", "test_log"],
        "runSummary": (
            "STCA regression suite executed on 2026-04-08 against build v2.8.3-rc2. "
            "42 test cases executed: 37 passed, 3 failed, 2 errored. "
            "Failures concentrated in degraded-mode parameter switching tests. "
            "Errors caused by test infrastructure timeout in coast-track prediction tests."
        ),
        "primaryFailureSignals": [
            {
                "signal": "STCA horizontal threshold not updated within 10-second window after radar dropout simulation",
                "count": 2,
                "affectedComponents": ["STCA Engine", "Surveillance Gateway"]
            },
            {
                "signal": "Parameter API returns stale value (2.0 NM) 15 seconds after mode transition should have completed",
                "count": 2,
                "affectedComponents": ["STCA Engine", "Configuration Manager"]
            },
            {
                "signal": "Test infrastructure timeout (30s) exceeded during coast-track extrapolation under high-load scenario",
                "count": 2,
                "affectedComponents": ["Test Harness", "SimATM"]
            }
        ],
        "repeatedPatterns": [
            "All degraded-mode test failures share the same root cause: STCA parameter cache not invalidated on mode change event",
            "Coast-track timeout errors appear only when SimATM is running > 30 aircraft simultaneously",
            "Normal-mode STCA tests (32/32) all pass — issue is isolated to mode transition logic"
        ],
        "probableRootCauses": [
            {
                "cause": "STCA Configuration Manager caches parameters and the cache TTL (30 seconds) is longer than the required mode transition time (10 seconds). On mode change, the cache is not explicitly invalidated.",
                "confidence": "high",
                "affectedTests": [
                    "PT-01: Radar dropout triggers parameter switch to degraded mode",
                    "PT-02: Radar restoration reverts parameters to normal mode",
                    "NT-01: Intermittent radar — no premature mode switch"
                ]
            },
            {
                "cause": "SimATM test infrastructure has a 30-second timeout for scenario steps, but coast-track extrapolation at 30+ aircraft takes up to 45 seconds to converge. This is a test environment limitation, not a production code issue.",
                "confidence": "medium",
                "affectedTests": [
                    "EC-02: Surveillance feed gap during conflict evolution"
                ]
            }
        ],
        "affectedAreas": [
            "STCA Degraded Mode — parameter transition timing",
            "Configuration Manager — cache invalidation on event trigger",
            "Test Infrastructure — SimATM timeout configuration"
        ],
        "severityProposal": "high",
        "suggestedNextSteps": [
            "1. Add explicit cache invalidation call in Configuration Manager when Surveillance Gateway emits mode_change event",
            "2. Reduce parameter cache TTL from 30s to 5s as interim mitigation",
            "3. Increase SimATM step timeout to 60s for coast-track test scenarios",
            "4. Re-run STCA regression suite after fixes, focusing on degraded-mode tests",
            "5. Consider adding a parameter-change timestamp to STCA status endpoint for monitoring"
        ],
        "suggestedRegressionScope": [
            "All degraded-mode tests (SUR-REQ-031 suite)",
            "STCA parameter API response validation",
            "Coast-track prediction tests (with increased timeout)",
            "Normal-mode STCA tests (sanity check — should still pass)"
        ],
        "createdAt": _ts(1),
    },

    # ── Run 2: Sector Handover acceptance test with mixed results ──
    {
        "runId": "OLDI-ACC-2026-04-05-002",
        "artifactCount": 3,
        "artifactTypes": ["test_log", "json_result", "console_output"],
        "runSummary": (
            "OLDI sector handover acceptance test executed against Stockholm ACC integration environment "
            "on 2026-04-05. 28 test cases: 24 passed, 3 failed, 1 skipped. "
            "Failures in burst-handover timing and CPDLC fallback detection. "
            "Skipped: OLDI MAC (modification after coordination) — test data not yet configured."
        ),
        "primaryFailureSignals": [
            {
                "signal": "OLDI ACT message delivery delayed by 3.2 seconds under burst of 5 simultaneous handovers",
                "count": 1,
                "affectedComponents": ["OLDI Gateway", "Message Queue"]
            },
            {
                "signal": "CPDLC datalink failure not detected for 45 seconds (requirement: detect within 15 seconds)",
                "count": 2,
                "affectedComponents": ["CPDLC Monitor", "Handover Controller"]
            },
            {
                "signal": "Frequency auto-switch instruction sent to aircraft AFTER voice-only fallback was activated",
                "count": 1,
                "affectedComponents": ["CPDLC Monitor", "Frequency Manager"]
            }
        ],
        "repeatedPatterns": [
            "CPDLC failure detection delay (45s vs 15s requirement) caused cascading issue in frequency management",
            "OLDI message queue shows FIFO contention under burst — no priority lane for time-critical ACT messages",
            "All single-handover scenarios (non-burst) pass correctly — issue manifests only under concurrent load"
        ],
        "probableRootCauses": [
            {
                "cause": "OLDI Gateway uses a single-threaded message queue. Under burst of 5 concurrent handovers, ABI and ACT messages compete for the same queue slot. No priority mechanism exists for time-critical ACT acknowledgements.",
                "confidence": "high",
                "affectedTests": [
                    "EDGE-02: Simultaneous handover of 5 aircraft within 3 minutes"
                ]
            },
            {
                "cause": "CPDLC Monitor polls for datalink status every 30 seconds instead of using event-driven detection. With polling interval + processing time, worst-case detection delay is 30+15=45 seconds.",
                "confidence": "high",
                "affectedTests": [
                    "DEG-02: CPDLC datalink failure during handover",
                    "Voice-only fallback frequency management"
                ]
            },
            {
                "cause": "Race condition: Frequency Manager sends auto-switch command before CPDLC Monitor has propagated the 'datalink_down' state. No state synchronization barrier exists between the two components.",
                "confidence": "medium",
                "affectedTests": [
                    "DEG-02: CPDLC datalink failure during handover"
                ]
            }
        ],
        "affectedAreas": [
            "OLDI Gateway — message queue concurrency",
            "CPDLC Monitor — failure detection mechanism",
            "Frequency Manager — state synchronization with CPDLC Monitor",
            "Handover Controller — end-to-end flow coordination"
        ],
        "severityProposal": "high",
        "suggestedNextSteps": [
            "1. Implement priority queue in OLDI Gateway: ACT/LAM messages get priority over ABI/MAC",
            "2. Change CPDLC Monitor from 30-second polling to event-driven: subscribe to datalink status change events",
            "3. Add state synchronization barrier: Frequency Manager waits for CPDLC Monitor state before sending auto-switch",
            "4. Configure OLDI MAC test data in Stockholm integration environment to unblock skipped test",
            "5. Re-run burst handover scenario with queue depth metrics collection",
            "6. Add CPDLC detection latency metric to operational monitoring dashboard"
        ],
        "suggestedRegressionScope": [
            "All OLDI handover scenarios (single and burst)",
            "CPDLC failure detection timing tests",
            "Frequency management fallback tests",
            "OLDI MAC coordination (once test data is configured)"
        ],
        "createdAt": _ts(0),
    },
]


# ═══════════════════════════════════════════════════════════════════════
# Seed runner
# ═══════════════════════════════════════════════════════════════════════

async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    req_col = db.get_collection("atm_requirement_bundles")
    des_col = db.get_collection("atm_test_designs")
    sce_col = db.get_collection("atm_scenario_matrices")
    run_col = db.get_collection("atm_test_runs")

    # ── Check if already seeded ────────────────────────────────────
    existing = await req_col.count_documents({})
    if existing > 0:
        print(f"[seed] ATM collections already have {existing} requirement(s).")
        answer = input("  Clear and re-seed? (y/N): ").strip().lower()
        if answer != "y":
            print("[seed] Aborted. No changes made.")
            client.close()
            return
        # Clear all 4 collections
        for col, name in [
            (req_col, "atm_requirement_bundles"),
            (des_col, "atm_test_designs"),
            (sce_col, "atm_scenario_matrices"),
            (run_col, "atm_test_runs"),
        ]:
            r = await col.delete_many({})
            print(f"  Cleared {r.deleted_count} docs from {name}")

    # ── 1. Insert requirement bundles ──────────────────────────────
    print("\n[seed] Inserting 5 requirement bundles...")
    req_ids = []
    for bundle in REQUIREMENT_BUNDLES:
        result = await req_col.insert_one(bundle)
        req_ids.append(result.inserted_id)
        print(f"  + {bundle['title'][:60]}...  id={result.inserted_id}")

    # ── 2. Insert test designs (linked to requirements) ────────────
    print(f"\n[seed] Inserting {len(TEST_DESIGNS)} test designs...")
    for design in TEST_DESIGNS:
        req_idx = design.pop("_req_index")
        design["requirementId"] = str(req_ids[req_idx])
        result = await des_col.insert_one(design)
        print(f"  + Design for '{design['requirementTitle'][:50]}...'  id={result.inserted_id}")

    # ── 3. Insert scenario matrices ────────────────────────────────
    print(f"\n[seed] Inserting {len(SCENARIO_MATRICES)} scenario matrices...")
    for matrix in SCENARIO_MATRICES:
        result = await sce_col.insert_one(matrix)
        print(f"  + {matrix['title'][:60]}...  id={result.inserted_id}")

    # ── 4. Insert test run analyses ────────────────────────────────
    print(f"\n[seed] Inserting {len(TEST_RUN_ANALYSES)} test run analyses...")
    for analysis in TEST_RUN_ANALYSES:
        result = await run_col.insert_one(analysis)
        print(f"  + Run {analysis['runId']}  id={result.inserted_id}")

    # ── Summary ────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SEED COMPLETE — ATM V&V Test Copilot Example Data")
    print("=" * 60)
    stats = {
        "Requirements": await req_col.count_documents({}),
        "Test Designs": await des_col.count_documents({}),
        "Scenario Matrices": await sce_col.count_documents({}),
        "Test Run Analyses": await run_col.count_documents({}),
    }
    for name, count in stats.items():
        print(f"  {name:20s}: {count}")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
