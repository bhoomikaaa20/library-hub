-- Drop existing constraint if it exists and recreate properly
ALTER TABLE public.borrow_records
DROP CONSTRAINT IF EXISTS borrow_records_user_id_fkey;

-- Add foreign key relationship between borrow_records and profiles
ALTER TABLE public.borrow_records
ADD CONSTRAINT borrow_records_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;