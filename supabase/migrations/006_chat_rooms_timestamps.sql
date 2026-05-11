-- Add missing created_at / updated_at to chat_rooms
-- The TypeScript types already declared these columns but the schema never added them,
-- causing "column updated_at does not exist" errors in the chat repository.

ALTER TABLE public.chat_rooms
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Trigger: bump chat_rooms.updated_at whenever a message is inserted into that room
CREATE OR REPLACE FUNCTION public.bump_chat_room_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_rooms
  SET updated_at = NOW()
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_chat_room_on_message ON public.messages;
CREATE TRIGGER trg_bump_chat_room_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_chat_room_updated_at();
