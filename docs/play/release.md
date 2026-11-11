# Release checklist

- Play Console app name: Szachy. Package: com.dc4i.szachy. Verify the package is available before creating the listing.
- Build with Node 22, JDK 21 and Android SDK 36: `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run android`, then `cd android && ./gradlew bundleRelease assembleDebug`. The release bundle is unsigned unless a local keystore is explicitly configured. Do not commit signing material. Play App Signing and upload-key setup are separate operator actions.
- CI uploads the unsigned AAB and debug APK as workflow artifacts. Identical dependency versions and toolchain are pinned, but byte-for-byte reproducibility is not guaranteed by Android tooling; compare artifact hashes when required.
- Review listing-pl.md, screenshots, content rating, target audience, accessibility and real-device offline/import/review/coach flows. Confirm all included asset licences and GPL source distribution, including corresponding source and modifications.
- Publish privacy-pl.md at a stable public URL with the actual publisher identity and contact before submission. Review all network endpoints and the exact release build configuration.
- Data safety: for the default build, gameplay and coaching are stored locally; user-initiated external imports send usernames and network request metadata to third-party services. Assess actual collection/sharing and SDK behaviour under Play's definitions before making declarations. No ads or account required by default. Reassess if sync or other services are enabled. These notes are not a completed Play Console declaration.
- Sign only in the authorized release environment; verify application ID, versionCode, target SDK, bundle contents, signing certificate and Play test-track behaviour before publication.
