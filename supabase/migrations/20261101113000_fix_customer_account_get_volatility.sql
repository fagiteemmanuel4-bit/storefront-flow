-- customer_account_get performs expiry cleanup and updates session activity.
-- STABLE functions cannot safely perform those writes; VOLATILE is required.
ALTER FUNCTION public.customer_account_get(text) VOLATILE;
