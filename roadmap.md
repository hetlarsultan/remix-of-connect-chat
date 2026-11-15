# Roadmap

- [x] In-app notice when an SSV transaction moves from pending to success/failure (works outside the Earn page)
- [x] Owner page tracking SSV transactions per user, with manual approve/reject when automatic verification fails
- [x] "Copy verification link" button in ad settings that generates the correct AdMob SSV URL
- [x] Bind every SSV reward to the watcher via user_id + custom_data
- [x] Publish the app
- [x] Diagnose "ads unavailable on this device": detailed LoadAdError log, retry button, test ads in dev
- [ ] Watch a real rewarded ad on a phone and confirm the log + wallet (blocked: needs the native phone app with the AdMob SDK; can't be done from here)
- [ ] Reconnect this remix to its own backend and verify sign-in, chat and rewards data access
- [ ] Set up owner access for hetlarsultan2016@gmail.com to the ads dashboard and payouts
- [ ] Test sign-up, guest join, room messages, private messages and friend requests; fix failures
- [ ] Add and activate forgot-password email recovery and a reset-password page
