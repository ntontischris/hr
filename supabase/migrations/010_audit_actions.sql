-- Add missing audit log actions
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN (
    'chat', 'document_upload', 'document_delete', 'document_update',
    'login', 'logout', 'role_change', 'settings_change',
    'user_invite', 'user_update', 'user_delete', 'password_reset'
  ));
