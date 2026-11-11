# Szachy DC4I: Design and Release Refresh (2026-11-11)

## Intent
Ship a genuinely improved, free, Polish-first Android chess trainer after Beta 2. Improve import friction, trustworthy explanations, and visual quality, with a distinct original brand identity suitable for small Android launcher icons. Keep upstream attribution and GPL-3.0-or-later. Changes must be useful and verifiable, not invented AI or online-community capabilities.

## Approach choices
1. Native rewrite: full Compose app. Rejected for this release: discards the stable Stockfish/PGN/React test base and costs months.
2. Capacitor enhancements and original design system: selected. Extend Android receiving Intents, retain Dexie and chess.js, update verified review explanation UX, create coherent tokenized styles and scalable knight icon.
3. Web-only cosmetic update: rejected, cannot satisfy Android PGN sharing.

## Deliverable A: Android Share PGN
- User shares a completed PGN or selected text/PGN file into Szachy from Chess.com, Files or another app. Only ACTION_SEND text/plain, application/x-chess-pgn, or bounded content URI up to 2 MB.
- Android opens or resumes Szachy and preselects existing PGN import, pre-filling the text, without silently submitting it.
- Validate plausible PGN, guard against incomplete games (do not offer active assistance), rely on existing chess.js import parser for legal moves and deduplication.
- No broad storage permission, no background scraping or remote username data collection. Invalid files show honest feedback and a retry path.
- Handles cold start and already-open app without losing the share. Bounded lifecycle state.

## Deliverable B: Review clarity
- In completed-game review, show engine analysis depth and evidence: move shown vs best alternative SAN, line when available, and a plain-language explanation grounded in recorded engine data.
- When no tactical explanation can be verified, present no confirmed tactic in this move rather than hallucinated coaching. Never claim perfect certainty.
- Accessible legibility, move comparison, and exercises. Existing review behavior and retries must remain intact.

## Deliverable C: Premium visual system
- Distinctive original knight logo, deliberately simple geometric vector for 48x48px launcher. No text or misleading promo marketing in icon.
- Dark background midnight navy #0c1220, raised indigo/slate surfaces #161f32; aqua #5ee2cc primary accent, warm gold #f7c66c secondary; bright text. Light mode fully adjusted for contrast.
- Accessible touch targets >=44 px, visible keyboard focus, reduced motion, responsive screen grid, no horizontal scrolling.
- Home screen: clear task-first hero, quick analysis/import/training/challenges, recent games and daily puzzle; preserve existing routes.
- No proprietary assets copied from Chess.com or others. Rework Android/PWA icon PNGs and original SVG source. Respect Android adaptive icon safe area.

## Constraints
No changes to Mac mini services. Make changes on isolated git branches; enforce TDD for behavior. Preserve package com.dc4i.szachy, no ads, no mandatory login, no hidden paywall. Document credits and privacy. Do not auto-submit to public Google Play; debug GitHub beta is okay. New build name should be Beta 3 (not production 1.0).

## Acceptance
Unit, lint, typecheck, Playwright desktop/mobile and Android assembleDebug/bundleRelease pass. Android emulator share Intent is end-to-end tested including cold/warm app, invalid data and PGN import. Visual screenshots at 360x640 and 1280x860 inspected, no contrast regressions. GitHub prerelease includes APK, AAB unsigned, hashes and changelog; source pushed.
