-- Phase 12: PostGIS location support for services

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add location columns to services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- Create spatial index for fast geo queries
CREATE INDEX IF NOT EXISTS services_location_gist_idx
  ON services USING GIST (location);

-- Keep location column in sync when lat/lng updated
CREATE OR REPLACE FUNCTION sync_service_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_service_location ON services;
CREATE TRIGGER trg_sync_service_location
  BEFORE INSERT OR UPDATE OF latitude, longitude ON services
  FOR EACH ROW EXECUTE FUNCTION sync_service_location();

-- RPC: find services within radius_km of a point
CREATE OR REPLACE FUNCTION find_nearby_services(
  lat    DOUBLE PRECISION,
  lng    DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 25
)
RETURNS SETOF services
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM services
  WHERE location IS NOT NULL
    AND is_available = TRUE
    AND ST_DWithin(
      location,
      ST_MakePoint(lng, lat)::geography,
      radius_km * 1000
    )
  ORDER BY ST_Distance(
    location,
    ST_MakePoint(lng, lat)::geography
  );
$$;
