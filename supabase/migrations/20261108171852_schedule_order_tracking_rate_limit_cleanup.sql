do $migration$
begin
  if not exists (
    select 1 from cron.job
    where jobname = 'cleanup-order-tracking-rate-limits'
  ) then
    perform cron.schedule(
      'cleanup-order-tracking-rate-limits',
      '0 * * * *',
      'delete from private.order_tracking_lookup_rate_limits where updated_at < now() - interval ''24 hours'';'
    );
  end if;
end
$migration$;
