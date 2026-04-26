Generate the complete Supabase SQL migration for the EaZi Platform.

Read the `database` section of `eazi-project-spec.json` and generate a single SQL file at `supabase/migrations/001_initial_schema.sql` that includes:

1. All extensions (uuid-ossp, postgis)
2. All enum types for every status/type/role field across all tables
3. All 19+ tables with complete column definitions, constraints, checks, and foreign keys
4. All indexes listed in the spec
5. All triggers (handle_new_user, update_user_location, update_updated_at, update_service_rating)
6. All functions (handle_new_user, update_user_location, update_updated_at, update_service_rating, get_admin_dashboard_stats, is_admin)
7. Enable Realtime publication for tables listed in `realtime_tables`
8. All RLS policies for every table as specified in each table's `rls` section

IMPORTANT:
- The SQL must be executable as a single migration — no errors, no dependencies on manual steps
- Use IF NOT EXISTS / CREATE OR REPLACE where appropriate
- The handle_new_user function must use SECURITY DEFINER to write to public tables from auth trigger
- The is_admin function must use SECURITY DEFINER
- Every table must have RLS enabled with ALTER TABLE ... ENABLE ROW LEVEL SECURITY

After generating the file, report the total number of tables, indexes, triggers, functions, and RLS policies created.
