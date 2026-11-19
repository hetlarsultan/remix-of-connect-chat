DROP POLICY IF EXISTS messages_select_signed_in ON public.messages;
CREATE POLICY messages_select_chat_members ON public.messages
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid())
);