# Deploy Mode Context

You are in deployment mode. Priorities:
1. Run ALL tests before deploying: `pnpm test && pnpm build`
2. Check for environment variables in production
3. Verify Stripe webhook endpoints are configured
4. Check Supabase RLS policies are in place
5. No console.log, no debug code, no TODO comments

Pre-deploy checklist:
- [ ] All tests pass
- [ ] Build succeeds without warnings
- [ ] Environment variables set in Vercel/hosting
- [ ] Stripe webhook URL updated to production
- [ ] Database migrations applied
- [ ] RLS policies verified
