-- Fix FK constraint for noprer_revistoria to point to public.noprer(id) instead of noprer_legado_v1
ALTER TABLE public.noprer_revistoria
DROP CONSTRAINT IF EXISTS noprer_revistoria_noprer_id_fkey;

ALTER TABLE public.noprer_revistoria
ADD CONSTRAINT noprer_revistoria_noprer_id_fkey
FOREIGN KEY (noprer_id)
REFERENCES public.noprer(id)
ON DELETE CASCADE;
