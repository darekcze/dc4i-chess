# Szachy market review: Google Play, 11 November 2026

**Scope and method.** Qualitative scan of publicly visible app descriptions and selected Google Play user reviews, corroborated with chess community discussion. This is **not** an automated census or statistically representative review analysis. Dates below are dates of cited reviews, not necessarily release dates. Ratings and counts are snapshots and may change. No review texts, product art or proprietary course materials are copied into Szachy.

## Competitive landscape and observed gaps

| Product | Strong points | Evidence / opportunity |
| --- | --- | --- |
| [Chess.com](https://play.google.com/store/apps/details?id=com.chess) | Large player network, bots, puzzles and game review | 4.7 stars, 100M+ installs. September 12, 2026 review questions the accuracy of coach explanations; September 4 review reports coach voice interfering with background audio. August 7 review criticizes ads and pricing. Distinguish trustworthy post-game analysis from server multiplayer. |
| [Lichess](https://play.google.com/store/apps/details?id=org.lichess.mobileV2) | Free open-source platform, Stockfish, online play, studies, offline puzzles | 3.9 stars in recent captured listing. May 16, 2026 reviews report harder navigation and slower entry to puzzles. Prioritize one-tap paths, fast loading and accessibility. |
| [Chessis](https://play.google.com/store/apps/details?id=com.chessimprovement.chessis) | Explainable review, game import, board editor and humanized bots | 1M+ installs; developer lists unlimited in-depth review, move alternatives and removal of ads under Pro. Offer unlimited analysis and transparent offline-first alternatives. |
| [Chessable](https://play.google.com/store/apps/details?id=com.chessable.chessable) | Large opening/course library with spaced repetition | June 3, 2026 review reports pieces overlapping/disappearing after switching variations; 2025 reviews complain about access to previously free courses. Test board state consistency and keep essential training free. |
| [Dr. Wolf](https://play.google.com/store/apps/details?id=com.chess.chesscoach) | Engaging personalized coach that reuses previous mistakes | June 20, 2025 review praises practice on personal mistakes. Developer describes three free coached games then a subscription. Build local, evidence-based spaced training rather than chatty paid advice. |
| [Chess - Offline Board Game](https://play.google.com/store/apps/details?id=com.gamovation.chessclubpilot) | Accessible offline levels and hints | July 2, 2026 review objects to puzzles rejecting alternative winning moves, repetitive exercises and no draw-offer control. Accept engine-verified alternatives and diversify practice. |

Community references: [r/chess training apps (May-June 2026)](https://www.reddit.com/r/chess/comments/1t7igqz/whats_the_best_chess_training_app/) and [free tools / missing features (2026)](https://www.reddit.com/r/chess/comments/1sb91sp/which_free_chess_tools_do_you_recommend_and_what/). They are useful anecdotal inputs, **not** proof of market share or majority preference.

## Product differentiation

**Szachy by DC4I** is a free, Polish-first, open-source personal chess improvement app (GPL-3.0-or-later), based on the openly credited upstream Open Chess project. It does not replace Chess.com or Lichess multiplayer and must never assist ongoing third-party games. Its core promise is a dependable loop: import a *finished* game, inspect verified engine variations, practice the exact mistakes, then track improvement across reviewed games.

## Roadmap and release gates

| Priority | Workstream | Measurable acceptance |
| --- | --- | --- |
| P0 | Personal mistake scheduling | Due/new/mastered computed from actual solved attempts; no fake progress; no DST boundary errors; alternatives checked with Stockfish; unit tests. |
| P0 | Local daily and weekly challenges | Based only on local completed games and distinct solved puzzles, accurately labeled offline, no public leaderboard or forced account, accessible on mobile. |
| P0 | Evidence-based insights | Accurate per-color, per-phase and 30-day comparison on completed reviewed games; clear low-sample caveats; no invented Elo. |
| P0 | Quality and privacy | Polish and English UX, real Android API 36 APK/AAB, GPL credits, offline handling, browser+Android testing, public privacy policy. |
| P1 | Robust PGN intake and recovery | One-tap PGN sharing, malformed PGN feedback, deduplication and resumable import without losing user data. |
| P1 | Coach explanation quality | Show engine depth, line of best reply and material/threat evidence; allow 'cannot determine from this position' instead of hallucinating. |
| P1 | Accessibility and friction | Large board controls, screen-reader hints, contrast and text scaling, launch-to-puzzle in one tap, voice off by default. |
| P2 | Community challenges | Opt-in accounts, moderation, server rules, cheating controls and GDPR; not included until built and tested. |
| P2 | Optional cross-device sync / camera-to-FEN | Consent, cost and privacy review; avoid mandatory cloud account and restricted assets. |

**Public Google Play must remain gated** on real-device installation, actual account verification, production signing/Play App Signing, Data safety disclosure and store review. A debug-signed GitHub beta is not a Play production release. Product claims must match verified behavior, not roadmap intentions.
