INSERT INTO "USER_GROUPS" (name, description, permissions) VALUES
(
  'SUPERADMIN',
  'Full access to all modules and all data',
  '{
    "tier": "SUPERADMIN",
    "domains": ["all"],
    "modules": {
      "dashboard": { "access": true, "visibility": "all" },
      "bts_tracker": { "access": true, "visibility": "all" },
      "site_detail": { "access": true, "visibility": "all" },
      "spv_queue": { "access": true, "visibility": "all" },
      "agent_monitor": { "access": true, "visibility": "all" },
      "reports": { "access": true, "visibility": "all" },
      "user_management": { "access": true }
    }
  }'::jsonb
),
(
  'CONTRIBUTOR',
  'Domain-scoped access — own sites/data only',
  '{
    "tier": "CONTRIBUTOR",
    "domains": ["design", "verify", "vendor", "field", "integration"],
    "modules": {
      "dashboard": { "access": true, "visibility": "all" },
      "bts_tracker": { "access": true, "visibility": "own_scope" },
      "site_detail": { "access": true, "visibility": "own_scope" },
      "spv_queue": { "access": false },
      "agent_monitor": { "access": false },
      "reports": { "access": true, "visibility": "domain_scope" },
      "user_management": { "access": false }
    }
  }'::jsonb
),
(
  'PMO',
  'Cross-domain read-heavy, reporting and approval',
  '{
    "tier": "PMO",
    "domains": ["all"],
    "modules": {
      "dashboard": { "access": true, "visibility": "all" },
      "bts_tracker": { "access": true, "visibility": "all" },
      "site_detail": { "access": true, "visibility": "all" },
      "spv_queue": { "access": true, "visibility": "all" },
      "agent_monitor": { "access": true, "visibility": "all" },
      "reports": { "access": true, "visibility": "all" },
      "user_management": { "access": false }
    }
  }'::jsonb
),
(
  'EXTERNAL_VIEWER',
  'Read-only, summary/report only, no raw evidence',
  '{
    "tier": "EXTERNAL_VIEWER",
    "domains": [],
    "modules": {
      "dashboard": { "access": true, "visibility": "summary_only" },
      "bts_tracker": { "access": false },
      "site_detail": { "access": false },
      "spv_queue": { "access": false },
      "agent_monitor": { "access": false },
      "reports": { "access": true, "visibility": "summary_only" },
      "user_management": { "access": false }
    }
  }'::jsonb
),
(
  'ADMIN',
  'Full access including user management (module TBD)',
  '{
    "tier": "ADMIN",
    "domains": ["all"],
    "modules": {
      "dashboard": { "access": true, "visibility": "all" },
      "bts_tracker": { "access": true, "visibility": "all" },
      "site_detail": { "access": true, "visibility": "all" },
      "spv_queue": { "access": true, "visibility": "all" },
      "agent_monitor": { "access": true, "visibility": "all" },
      "reports": { "access": true, "visibility": "all" },
      "user_management": { "access": true }
    }
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;
