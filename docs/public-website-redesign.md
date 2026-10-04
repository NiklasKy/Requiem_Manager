# Public website redesign

The anonymous homepage introduces Requiem first, then its two open divisions, the application criteria, community history, and the footer. Aion 2 and World of Warcraft Forever receive equal prominence. Applications take place in Discord; the website directs visitors to the criteria before presenting the Discord invitation.

## Design direction

The October 4 direction is a contemporary performance brand with a cinematic opening and an editorial layout: charcoal surfaces, warm white text, Requiem red, fluid gutters, and full viewport sections. The opening uses the community's supplied banner and animation rather than the preceding large red R. The high-resolution banner provides the base; a slowed, softly blended video adds movement from the supplied GIF. Game artwork begins in the next section. The community's own art and large type provide the identity without generated effects, decorative dot grids, or fictional statistics.

The frontend-design feasibility score is 15: impact 4, context fit 5, feasibility 5, performance 4, minus consistency risk 3. The purpose is to establish the community, help a visitor choose a division, explain expectations, and then open the Discord application path. The primary differentiation anchor is Requiem's animated skull imagery behind the large wordmark.

`LandingPage.css` scopes the design to `.rq-public`. Its variables define the dark background, one red accent family, neutral text, spacing, and font roles. Manrope provides section headings and body text. UnifrakturCook Bold gives the Requiem wordmark a sharper Gothic identity in the header, hero, and footer; its title-case lettering remains readable at smaller sizes. Fonts are hosted locally with their license files. The UI/UX design-system skill's suggested purple and 3D direction was rejected because it conflicts with the requested dark/red identity and restrained motion.

The mobile opening places the banner above the headline rather than across the copy. A solid footer strip keeps membership text readable. The game split remains two equal panels on desktop and stacks on narrow phones. The history logo stays visible beside the longer record on desktop and sits above it on phones.

### Internet references

The following official sites were reviewed in Chromium on October 4, 2026. Their visual approach informed the brand hierarchy; their code, videos, and brand assets were not copied.

| Reference | Applied idea |
| --- | --- |
| [Team Liquid](https://teamliquid.com/) and its [brand kit](https://teamliquid.com/brand-kit) | Let the organization's own mark lead the opening rather than individual game art. |
| [Fnatic](https://fnatic.com/) | Strong typography, clear community identity, and restrained framing. |
| [Current Requiem website](https://requiem-guild.com/) | Retain the existing logo and identity while replacing the dense effects and repeated panels. |

Browser screenshots and text observations are in the original backup's `inspiration-brand` directory. Earlier publisher-site research remains in `inspiration`.

## Page structure and application path

1. `PublicHero.js` introduces Requiem, hardcore and semi-hardcore play, the animated community banner, and the valid public membership count. Its primary action links to `#divisions`.
2. `DivisionSplit.js` displays Aion 2 and World of Warcraft Forever with equal prominence. Both actions link to `#apply`. Clicking an action also updates the selected division in the later application copy.
3. `#apply` presents four community-supplied criteria, followed by the sole Discord invitation. Choosing a division does not submit an application, select a Discord role, or change the invitation URL. The copy explains that visitors complete their application in the division's Discord area.
4. `GameHistory.js` shows the Requiem logo beside twelve community-supplied games and achievements, with a publisher source for the Throne & Liberty conquest win.
5. The footer contains application navigation, member tool access, and a return-to-top link.

### Member tools

The header and footer now offer **Member tools** instead of linking to the internal `/login` route. Both buttons open `MemberTools.js`, a native modal dialog with equal entries for the two divisions:

| Division | Tool | Fixed destination |
| --- | --- | --- |
| Aion 2 | GuildVoice | `https://guildvoice.dream-dev.online/` |
| WoW Forever | OXM | `https://forever.oxm.gg/my/dashboard` |

The selector follows the existing contemporary performance design: charcoal background, red accents, a Gothic Requiem wordmark, Manrope labels, compact game artwork, and plain rows separated by rules. Its purpose is a single choice of division tool. It retains the homepage's design feasibility score of 15 and adds no frontend dependency or new font. The design-system skill's purple, orange, and playful type suggestions were rejected against the established dark/red direction. The dialog enters over 180 ms, with reduced motion disabling the animation.

Each fixed HTTPS destination opens in a new tab with `noopener noreferrer`. No credential form, iframe, or internal backend link appears in this selector. The native dialog supplies modal semantics, keyboard focus containment, Escape handling, and focus restoration to the opening button. A close button and backdrop click also dismiss it; the homepage cannot scroll while it is open. Existing authentication routes remain available to direct callers.

Both supplied URLs returned HTTP 200 during a read-only check on October 4, 2026. The Aion tool's document title was GuildHarbor; the displayed GuildVoice label follows the user's supplied tool name. The check does not verify a member login or any authenticated tool action.

`JOIN_CRITERIA` contains the community's confirmed requirements: no gooning, simping, or ERP; a competitive mindset with the ambition to dominate the server; willingness to make a basic pay-to-win investment, since Requiem is not a free-to-play guild; and enjoyment of PvP. These replace the preceding dummy entries and their sample label. No spending amount, purchase frequency, or division-specific exception is specified.

The user replaced the sample game lineup with the following community history: Revelation Online, ArcheAge: Unchained, Riders of Icarus, MU Online, MapleStory 2, New World, Lost Ark, Throne & Liberty, Bless Online, Tower of Fantasy, Tarisland, and Where Winds Meet. The expanded names for AAU, WWM, and the supplied Tower of Fantasy nickname were confirmed by the user. `COMMUNITY_HISTORY` stores the titles, local game icons, achievement copy, and fixed source link. Each of the twelve entries has a game-specific icon beside its name. Icons are decorative because the adjacent heading already identifies the game. It preserves the supplied rankings, guild placements, activity milestones, town ownership, and PvP results. These are community-supplied historical claims, not a current live leaderboard.

[Amazon Games' Conquest of Guilds Global Winners article](https://www.playthroneandliberty.com/en-us/news/articles/conquest-of-guilds-global-winners), dated October 21, 2024 and checked on October 4, 2026, lists Requiem first among the Early Access server winners. That source supports the conquest result, not the other games or the separate Talus and Lightbringer ranking periods. The source link appears inside the Throne & Liberty entry.

Division descriptions are editorial drafts. No age limit, server, faction, raid schedule, release countdown, or recruitment quota is invented. The public title uses **World of Warcraft Forever**, following the latest requested label; Blizzard's page uses **World of Warcraft: Forever**.

The fixed invitation `https://discord.gg/requiem-community` was verified against Discord's public invite endpoint on October 4, 2026 and resolves to Requiem. The membership figure appears only when `/api/landing-stats` supplies a positive safe integer. Failed, zero, or malformed responses display community copy without a number. The homepage no longer renders the achievements feed; authenticated member features retain their existing implementation.

## Motion

`useSectionMotion.js` observes visibility, the document visibility state, and the operating system's reduced-motion preference. `PublicHero.js` uses that state to play or pause a native video and handles playback rejection while retaining the banner. There is no animation dependency or JavaScript frame loop.

- The banner and video share a slow, 24-second CSS camera drift. The supplied GIF now produces a four-second, 60 fps muted loop. Adjacent source frames are blended to create intermediate images; the 240 encoded frames are distinct. A short 200 ms end blend reduces the jump back to the opening image. This retains the approximately four-second pace while replacing the preceding 25 fps frame steps. The softly blended video adds the original artwork's moving light and smoke while the higher-resolution poster remains underneath. Foreground copy has a short entrance sequence.
- Softening is baked into the video at conversion time. The large rendered video no longer has a CSS blur filter, reducing the browser's ongoing rendering work.
- Division imagery floats vertically over 16 and 18 seconds at a constant scale. Mouse movement and hover do not alter image transforms.
- The Warcraft wrapper has a static `scaleX(-1)` so the characters face toward the middle. Image animation runs separately and preserves that orientation.
- Motion pauses when its section leaves the viewport or the document becomes hidden. There is no pause button, as requested.
- Reduced motion removes the hero video and disables homepage animations and transitions, including when the preference changes while the page is open. An initial reduced-motion visit requests no video. The Warcraft mirror remains.
- Internal anchor links use native smooth scrolling on the document root while the public homepage is mounted. The existing header offsets still apply. Reduced motion restores instant navigation, and member routes keep their existing scroll behavior.
- Fixed dark gradients and separate metadata backdrops keep the artwork captions readable. Narrow screens reserve more image space above the body copy.

## Assets

The current homepage uses approximately 315 kB of compressed game artwork, loaded lazily below the hero. The opening requests a 123 kB WebP banner plus a 146 kB WebM loop; a 135 kB MP4 is available as an alternative. The browser chooses a supported video source rather than requesting both during normal playback. The original GIF is approximately 7.8 MB and is not shipped or loaded by the page. The two fonts referenced by the public stylesheet total approximately 42 kB. Font licenses are shipped in `frontend/public/licenses`. The twelve game icons total approximately 17 kB and load lazily from the same site; no third-party image or font request is needed at runtime.

| File | Source |
| --- | --- |
| `artwork/requiem-banner.webp` | User-supplied `F:\#Communitys\Requiem\Requiem_Banner_invite.png`, 1920 x 1080, compressed without resizing |
| `artwork/requiem-atmosphere.webm`, `artwork/requiem-atmosphere.mp4` | User-supplied `F:\#Communitys\Requiem\req_animated.gif`, 500 x 281 and 105 frames; converted to 500 x 282, 60 fps with blended intermediate frames, a softened loop boundary, and no audio |
| `artwork/aion-2-hero.webp` | [Official Aion 2 website](https://aion2.plaync.com/), [logo-free poster](https://assets.playnccdn.com/res/aion2/update/2026/global/260421_teaser/9th/pc/img/main/5637950c681a22d14e99cfc681949894a4caa005.webp) |
| `artwork/wow-forever.webp` | [Official World of Warcraft: Forever page](https://worldofwarcraft.blizzard.com/en-us/forever), [masthead artwork](https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt4d412035d16da095/6aa204fb2c0580bfcf273e54/masthead-art.jpg) |
| `artwork/aion-2.webp` | Earlier [official Aion key artwork](https://fizz-download.playnccdn.com/download/v2/buckets/marketing-platform/files/1a0f3228747-dc4a8c06-d1db-4f23-9ce9-c265f6511508); retained for older snapshots, unused by this homepage |
| `src/assets/fonts/manrope-latin-variable.woff2` | [Google Fonts Manrope](https://fonts.google.com/specimen/Manrope), weights 400-600; `OFL-Manrope.txt` |
| `src/assets/fonts/unifraktur-cook-latin-700.woff2` | [Google Fonts UnifrakturCook](https://fonts.google.com/specimen/UnifrakturCook), weight 700; [SIL Open Font License](https://github.com/google/fonts/blob/main/ofl/unifrakturcook/OFL.txt) copied to `OFL-UnifrakturCook.txt` |
| `icons/games/*.webp` | Nine publisher-supplied Steam app icons, the official Lost Ark touch icon, the official Webzen MU Online logo, and the Tarisland game icon mirrored on Uptodown; individual source pages and URLs are recorded in `icons/games/sources.json` |
| `icons/Requiem-logo.png`, `icons/discord.svg` | Existing project assets |

Older Barlow font files remain available for previous design snapshots. Publisher artwork is attributed in the footer. No generated game artwork is used. Tarisland's original global site and App Store listing were unavailable, so its publisher icon comes from the Level Infinite listing on [Uptodown](https://tarisland.en.uptodown.com/windows). Game icons and trademarks belong to their respective owners. Steam supplies several icons at 32 x 32; these stay compact and are not presented as high-resolution artwork.

Conversion uses ImageMagick and the pinned imageio-ffmpeg 0.6.0 helper outside the repository, under the v4 snapshot's `tools` directory. The original banner and GIF are untouched. No frontend package or lockfile is changed. The current video pipeline uses `setpts=2*PTS`, `scale=500:-2`, `minterpolate=fps=60:mi_mode=blend`, and `gblur=sigma=0.8`, processing a complete repeated cycle into an external lossless intermediate. The final four-second clip blends its last 200 ms toward its opening frame using `xfade`. It is encoded with VP9 CRF 33 for WebM and H.264 CRF 24 with `yuv420p` and `faststart` for MP4. Frame blending was chosen to preserve the logo lettering and light transitions without optical-flow deformation. Review intermediates remain outside the repository. Game icons are converted to WebP with metadata stripped and a maximum source size of 96 x 96; no smaller image is upscaled during conversion.

## Backups and local preview

Backups are outside the repository under `F:\#Communitys\Requiem\Backups`:

| Directory | Preserved state |
| --- | --- |
| `2026-10-03-frontend-before-redesign` | Original frontend source, build configuration, ZIP archives, SHA-256 manifests, anonymous public-site files, aggregate API responses, and desktop/mobile screenshots |
| `2026-10-03-design-v1-before-motion` | First redesign before the full-width motion revision |
| `2026-10-04-design-v2-before-floating` | Full-width version with mouse parallax and a pause control |
| `2026-10-04-design-v3-before-brand` | Floating split-hero design before this community-first revision |
| `2026-10-04-design-v4-before-cinematic` | Community-first opening with the large red R, smooth navigation, and six sample games, before adding the banner animation and actual history |
| `2026-10-04-design-v5-before-gothic` | Cinematic opening, both quarter-speed video files, and twelve historical game entries before the faster loop, Gothic wordmark, and game icons |
| `2026-10-04-design-v6-before-member-tools` | Gothic opening, real game history, and confirmed criteria before replacing the public internal-login links with external division tools |
| `2026-10-04-design-v7-before-smooth-hero` | Both 25 fps video files and the hero sources/styles before adding 60 fps intermediate frames and removing the browser blur filter |

Each snapshot has restoration notes. Secrets, private environment files, dependencies, databases, and backend state are excluded. Original source and public-site archives remain unchanged.

The local preview helper binds to `127.0.0.1:3012` and serves the review build with the correct WebM and MP4 MIME types. It proxies only the two existing public aggregate endpoints. It does not implement member authentication or a member backend.

```powershell
Set-Location -LiteralPath 'F:\#Communitys\Requiem\Requiem_Manager\frontend'
$env:REACT_APP_API_URL = 'http://localhost:3012'
$env:GENERATE_SOURCEMAP = 'false'
npm.cmd run build
node 'F:\#Communitys\Requiem\Backups\2026-10-03-frontend-before-redesign\preview-public.mjs'
```

The existing production Docker build supplies its own API URL. This preview is for local review; no deployment or commit is included.

## Security and validation

The change follows the supplied [frontend rules](https://github.com/SecureCodeWarrior/ai-security-rules/blob/main/frontend.md) and [JavaScript rules](https://github.com/SecureCodeWarrior/ai-security-rules/blob/main/language-specific/javascript.md): fixed destinations, React text rendering, frozen editorial configuration, type-checked public data, caught playback promises, and `noopener noreferrer` for the external invitation and publisher source. It adds no injected HTML, external scripts, dynamic style attributes, or frontend dependencies. Backend, authentication, protected routes, and deployment configuration are unchanged.

The production build compiles successfully. Current Chromium checks cover ten widths from 320 to 2560 px, full-width sections, valid anchors, mobile banner placement above copy, all twelve history titles and successfully decoded game icons, the locally loaded Gothic font in all three wordmarks, non-overlapping header actions, unclipped hero lettering, the fixed publisher source, the single Discord link, smooth navigation below the header, and the persistent Warcraft mirror. Icons have empty alternative text and lazy loading; the review helper loads all of them before screenshots so every entry can be inspected. Browser captures use a fixture membership count; they are local review images. Normal rendering reports no browser errors. Earlier review also covered equal division panels, the division-to-criteria actions, keyboard skip navigation, member login, the existing unauthenticated admin redirect, and valid/failed/malformed public-count fixtures.

Motion checks verify that the 500 x 282 video decodes and advances, camera drift changes the transform, offscreen navigation pauses and resumes playback, and live reduced-motion changes remove and restore the video. The current WebM encoding contains 240 distinct frames at 60 fps with a four-second duration. Initial reduced-motion visits request no video. Earlier blocked-video review retained the poster and navigation. A failed-WebM fixture plays the MP4 alternative. Earlier division-art checks verified that mouse movement does not change image transforms. An OS background-tab test and a full Discord OAuth round trip were not exercised.

The current automated axe check reports zero WCAG 2/2.1 A/AA violations. Artwork contrast produces incomplete automated cases, so hero text is also checked conservatively against hypothetical white artwork beneath its fixed horizontal and vertical overlays. Across ten widths, including the mobile breakpoint edges, minimum contrast is 6.63:1 for normal hero copy and 16.10:1 for the heading. Unchanged division overlays were previously checked at 5.42:1 and 7.49:1 respectively. These checks do not constitute a full accessibility certification. Current screenshots, icon source downloads, and results are in `design-review-gothic` beside the original backup; earlier directories describe preceding designs.

Source and archive hashes are checked separately from browser review. No production deployment or Git commit is performed.

After replacing the sample criteria, the production build was rebuilt successfully. A focused Chromium review at 320, 390, and 1440 px confirmed that the four supplied requirements render without clipped text or horizontal overflow, the sample label is absent, and the single Discord invitation remains below them. Captures and results are in `design-review-criteria` beside the original backup.

The member-tool revision also compiles successfully. A focused Chromium review covered opening from both header and footer, keyboard focus containment, Escape and close-button dismissal, backdrop dismissal, focus restoration, locked background scrolling, ten widths from 320 to 2560 px, and a short 390 x 420 viewport with a scrollable dialog. Neither the modal nor its triggers overlap or overflow. Both tool links opened their exact supplied addresses in new tabs with a null opener; external destinations were intercepted as browser fixtures, so this verifies navigation rather than a real tool login. Reduced motion disables the dialog entrance. An axe review of the open dialog and surrounding homepage reported zero WCAG 2/2.1 A/AA violations; screenshots and results are in `design-review-member-tools`. The public homepage contains no internal-login link.

The smooth-hero build compiles successfully. An 8.5-second Chromium sampling run on desktop and mobile measured a median media-frame step of 17 ms, compared with 40 ms in the preceding clip, across two loop wraps per viewport. Playback quality reported 3 dropped frames out of 514 on desktop and 4 out of 513 on mobile; this headless review does not guarantee a frame rate on every display. Decoded frame hashes confirm 240 distinct frames, and the first/last-frame pixel difference is approximately half the preceding loop's difference. The review also verifies offscreen pause/resume, live and initial reduced motion, a playable four-second MP4 fallback, the high-resolution poster, and the narrow layout. Captures and measurements are in `design-review-smooth-hero`. The browser now reports no CSS video filter and no JavaScript errors.
