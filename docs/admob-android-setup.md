# AdMob rewarded ads — phone app setup

AdMob rewarded ads only run inside an installed Android/iOS app that contains the
Google Mobile Ads SDK. They never load in a web browser (desktop or phone), so
the web app shows the "no SDK" diagnosis there. The Capacitor Android wrapper is
included in `android/` and can be opened directly in Android Studio.

## 1. Build and sync the phone app

Run these commands whenever the web app changes, then rebuild/reinstall the APK
from Android Studio. `cap sync` copies the real web build and registers the AdMob
plugin; opening an older APK does not include later fixes.

```bash
bun install
CAPACITOR_BUILD=1 bun run build   # also writes dist/client/index.html for the APK
bunx cap sync android
cd android && ./gradlew assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.
Use a signed release build for production rather than this debug APK.

The web code already talks to `window.Capacitor.Plugins.AdMob` (src/lib/rewarded-ad.ts):
`initialize` → `prepareRewardVideoAd({ adId, isTesting, ssv: { userId, customData } })` →
`showRewardVideoAd`, and records `onRewardedVideoAdFailedToLoad` / `FailedToShow` errors.

## 2. android/app/src/main/AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="com.google.android.gms.permission.AD_ID" />

    <application ...>
        <!-- AdMob APP id (contains "~"), NOT the ad unit id (contains "/") -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="@string/admob_app_id" />
    </application>
</manifest>
```

The application ID itself is stored once in `android/app/src/main/res/values/strings.xml`
as `admob_app_id`. Missing APPLICATION_ID can crash during the SDK's startup provider
(`MobileAdsInitProvider`) before the first screen appears; a mismatched ID returns 1.
The manifest, network permissions, AdMob app ID resource, and theme color resources are
included in this repository. Do not replace the app ID (`~`) with the rewarded unit ID (`/`).

If a crash remains after installing the newly rebuilt APK, capture the actual exception with
`adb logcat -d --brief AndroidRuntime:E *:S` immediately after launch. That log distinguishes
a native startup exception from a web-page error; reinstalling the old APK cannot apply this fix.

## 3. Test vs real ads

- Development builds (`import.meta.env.DEV`) use Google's public test unit and `isTesting: true`.
  Test ads never credit the wallet (the SSV route only credits the owner's configured unit).
- Production builds use the ad unit saved by the owner in the ads dashboard.

## 4. Rewards

The wallet is credited only by the server after Google's signed SSV callback reaches
`/api/public/ads/ssv`. Nothing in the app grants a reward on the device.
