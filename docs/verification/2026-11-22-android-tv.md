# Android TV lab candidate, 22 November 2026

English | [Polski](../pl/2026-11-22-android-tv.md)

## Scope and observed failure

Dariusz authorized installation, real-device testing and scoped corrective builds
for Living Room TV (Google Chromecast, Android 14). The active controller observed
Szachy 0.8.0 / 8000 in a 407 px portrait pillarbox on a 1280 x 720 capture, with
wrapped home action text and a clipped bottom navigation label. Source inspection
confirmed portrait-only orientation, no Leanback launcher and no board key input.

Source baseline: main `fa4ecf09199c61a7b13aa4f6906b4a970afdef89`, already version
0.8.1. Package versions remain derived from package.json; no manual release bump.
This is a private lab candidate, not a store release or production deployment.

## Changes

- Adds a Google TV launcher category/banner and makes touchscreen optional.
- Detects Android television mode, requests landscape on TV and retains portrait
  on phones. The native WebView marks TV input with a specific user-agent suffix.
- Adds directional focus among visible controls and restricts modal navigation
  to the open dialog. Up/down can leave horizontal radio groups on TV.
- Makes the chessboard focusable with a contrasting square cursor. Arrows move
  in displayed orientation and OK selects a piece or a legal destination through
  the existing chessground move path. Moving past an edge releases board focus.
- Prevents move-history arrow shortcuts from consuming TV navigation. Mouse and
  touch input continue through the existing paths.

## Local verification

| Check | Result |
| --- | --- |
| npm ci | PASS |
| npm run lint | PASS, zero errors/warnings |
| npm test | PASS, 392 tests in 43 files |
| npm run typecheck / npm run android | PASS |
| Playwright desktop, mobile and TV | PASS, 24 tests |
| Gradle :app:assembleDebug | PASS |
| APK signature verification | PASS, installed signer retained |

The three new TV tests use arrow/Enter events to navigate sections, play e2-e4
and receive a bot reply, leave the board, and play e7-e5 with black orientation.
The initial E2E attempt could not launch because this host lacked the pinned
Playwright browser. Installing its Chromium headless shell resolved that test
infrastructure prerequisite. The subsequent complete suite passed.

## Artifact receipt

- Package: com.dc4i.szachy, versionName 0.8.1, versionCode 8001.
- File: Szachy-0.8.1-tv-candidate.apk, 14,386,776 bytes.
- SHA-256: 1dd7762d1830e086fa87edb5742dbfcd1f98aae5f22628310a92bb9ccf81cb7c.
- Signer SHA-256: 80485ca87c606dd37384034d4ea3adaac5ac1c6edf2d8ff6fb27abd9077fc1a3.
- Built on Mac mini, signed with the existing matching debug identity on Mac Pro.
  The private signing key was not copied. APK transfers used existing authenticated
  SSH aliases. The final artifact is on Mac mini under
  /Volumes/AI-Hot/Services/Scratch/chromecast-lab-20261122/.

Use an in-place update. Do not uninstall user data to handle a signature mismatch.
The old Beta 2 APK is retained as a rollback artifact; a version downgrade must
preserve user data and be evaluated separately.

## Physical acceptance and delivery boundary

At this source checkpoint, the active controller is testing the candidate on
Chromecast. Browser PASS and APK build PASS do not establish physical TV PASS.
Record the actual launcher, landscape, D-pad gameplay, Back and resume results
before accepting the device deployment. No phone physical-device test is claimed.

Source changes are preserved on `fix/android-tv-remote-20261122`. A PR is deferred
because observed repository pull_request workflows are active and would start
GitHub-hosted execution during the existing owner-authorized billing pause.
No hosted run, workflow dispatch, main merge, release or Pages publication was
requested. Continue through the existing Android Lab [AIOS #225](https://github.com/darekcze/AIOS/issues/225)
and [Szachy roadmap #1](https://github.com/darekcze/dc4i-chess/issues/1).

## Iteration 2: physical findings and corrective candidate

The active controller subsequently verified candidate 8001 on Living Room TV:
in-place installation, Leanback resolution and full-width landscape passed. With
only D-pad input, e2-e4 was played and Ivan replied e7-e5. Board focus was visible.
Evidence: chess-tv-before-move.png and chess-tv-e4.png/xml in the private lab directory.

Two physical failures remained. From the color selector, Down could focus a bot
hidden outside its scroll container and move the visible focus upward. After a
move, the stacked mobile game layout placed action buttons behind the fixed bottom
navigation. Android density 213 maps the 1280 x 720 display to approximately
960 x 540 CSS pixels, below the desktop breakpoint.

The correction rejects clipped targets when entering another scroll area and
allows movement within the current scrolling area before leaving it. Focus margins
keep the outline visible. Directional distance uses the gap between rectangles,
so a wide button directly below a radio group remains a natural target. TV-only
CSS uses board/side columns at 800 to 1023 CSS pixels and ends the main viewport
above the bottom bar. Phone layout and default release version derivation stay intact.

### Iteration 2 verification and artifact

- Scoped lint, TypeScript, Android sync and native Gradle build passed.
- Seven TV browser regressions passed: the prior three gameplay checks, setup
  clipping at both 960 and 1280 px, D-pad bot selection/list scrolling/start,
  and game actions remaining beside the board above navigation after a move.
- A separate Feed TV agent reviewed the clipping/navigation and TV layout delta
  without editing it. No blocking issue remained in that scope.
- The test report covers the targeted seven TV scenarios for this correction.
  The previous complete 24-test run belongs to candidate 8001.
- Code source: 5efeb4886be2396c477f8851af852c9afebee539.
- Private version: 0.8.2-tv.alpha.1, versionCode 8002.
- File: Szachy-0.8.2-tv.alpha.1.apk, 14,390,872 bytes.
- SHA-256: 4b013f45604621762ecd7219a8e0285ed7c301f453cbb23c8d6e71b3c71b1b81.
- Signer: 80485ca87c606dd37384034d4ea3adaac5ac1c6edf2d8ff6fb27abd9077fc1a3,
  matching the already installed identity.
- Native build parameters:
  -PandroidVersionCode=8002 -PandroidVersionName=0.8.2-tv.alpha.1.
  These optional Gradle properties distinguish private iterations while leaving
  package.json and default public release derivation unchanged.
- The Mac mini recipient hash was checked after signing on Mac Pro and transfer.
  The key remained on Mac Pro. Receipt: chess-tv2-receipt.json in the private lab directory.

At this checkpoint, candidate 8002 is ready for physical installation and repeat
acceptance by the controller. Its physical result is not inferred from browser tests.
The measured 960 px setup sequence from focused Play heading is Down to Bots,
Down to Pip, OK to select. Down proceeds through the scrolling bot rows; after the
last row it exits to color, and the next Down reaches Play. From color, Down now
reaches Play directly. Existing data must be retained during the update.
