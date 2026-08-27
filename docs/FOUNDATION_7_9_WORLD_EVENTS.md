# MOR'IA Foundation 7.9 — World Event Domain

Foundation 7.9 extracts global event lifecycle into `OfficialWorldEventDomain`.

The domain now owns content/fallback event rotation, duration and completion grace rules, map/target validation, global progress, participant accounting, bounded per-character reward queues and exactly-once reward claims.

`OfficialSystems` remains a compatibility façade. Existing snapshots and `world_event_claim` actions remain unchanged.

This boundary enables seasonal invasions, realm bosses, multi-stage campaigns, server-wide objectives, regional events and event-specific reward tables without growing the core runtime monolith.
