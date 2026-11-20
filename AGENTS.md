# Project rules

- Rewards are credited only server-side (SSV route or owner-only server functions calling SECURITY DEFINER SQL executable by service_role); never from the browser, so users can't grant themselves balance.
- SSV callbacks bind to the watcher via custom_data (= ad_view_requests.transaction_id) and user_id, decided by `resolveSsvBinding` in src/lib/ssv-binding.ts; AdMob's own transaction_id is stored as network_transaction_id for dedupe. Keep this single source so binding rules stay testable.
- The rewarded ad unit id lives in the `ad_settings` table (owner-editable), never in code, so it can change without a rebuild.
- Tests use vitest (`bunx vitest run`), next to the code they cover.
- AdMob SSV signature and ad-unit checks live in pure helpers in src/lib/ssv-verify.ts (tested with a locally generated P-256 key), so the public SSV route stays thin and the rules stay testable.
- AdMob client rules (platform detection, test-unit swap in dev builds, LoadAdError parsing/explanations) live in pure helpers in src/lib/admob-diagnostics.ts; the native bridge in src/lib/rewarded-ad.ts reads `window.Capacitor.Plugins.AdMob` first. The Capacitor Android wrapper lives in `android/`; its AdMob application ID belongs in Android resources, while the rewarded unit ID remains owner-managed in `ad_settings`.
- Android runs bundled files from dist/client: `CAPACITOR_BUILD=1` makes vite.config.ts enable TanStack SPA mode to emit a static index.html shell (web build unchanged); no server.url, so the APK never depends on a remote host that may 403. Server functions (owner AI diagnose / manual SSV approve) need the web app.
