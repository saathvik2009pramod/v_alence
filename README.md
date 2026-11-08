# Valence website

Open index.html in a browser. The site is static and needs no installation, API keys, or build step. Keep these files together.

- index.html contains page structure and case-study text.
- styles.css controls layout, colors, responsive styles, and animation.
- model.js contains the pure payout, expected-value, and bounded-search calculations.
- app.js connects controls, the animated search, and the canvas chart.
- logo.svg is an editable vector mark.

The simulation is illustrative. The smooth payout uses a cubic Bézier whose x parameter is linear, yielding y = 3t² − 2t³ over 90–110% attainment. Threshold payout remains discontinuous. The search considers waiting and 61 discounts in half-point steps. Results are expected values, not realized sales predictions.

The Safelite case cites Edward P. Lazear (2000), “Performance Pay and Productivity,” American Economic Review 90(5), 1346–1361. https://doi.org/10.1257/aer.90.5.1346 . It is historical evidence about incentive design, not a Valence customer result. External source retrieval was unavailable during this revision; verify the linked paper before adding detailed quantitative claims.

All dependencies are local. Change the brand color in styles.css and logo.svg. There is no submission form, tracking, or backend.

## Capabilities update

Overlay the files from Valence-Changed-Files.zip onto the existing site folder. Retain model.js and logo.svg from the previous download. Open capabilities.html for payout exploration, animated rule comparison, and probability sensitivity.

Both pages now embed MADE Okine Sans from the included fonts folder, including the Valence wordmark and canvas chart labels. Keep that folder beside index.html and capabilities.html. The original font license is included in fonts/LICENSE.txt. The supplied fonts are marked personal-use only; commercial use requires the appropriate license from MadeType.

## Terms and security update

Replace index.html, capabilities.html, and styles.css. Add terms.html, privacy.html, and vercel.json beside index.html. The changed-files ZIP contains these files and this README only.

For the flat website folder supplied in these downloads, deploy that folder as the Vercel project root. Its vercel.json uses outputDirectory "." and defines Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and Strict-Transport-Security. The separate repository-root configuration uses outputDirectory "dist". Do not overwrite a pre-existing Vercel configuration with unrelated routes or integrations without merging those settings.

The HTML also contains a CSP meta tag for supported protections on other static hosts. frame-ancestors and the additional HTTP security headers require host support; Vercel applies them after deploying vercel.json. The hosted ChatGPT preview is not a Vercel deployment and does not establish those headers are active there. Verify HTTP response headers on your actual Vercel domain after deployment.

For local testing, serve the website folder with python3 -m http.server 8000 and open http://localhost:8000. This also avoids file-URL restrictions on embedded fonts.

The security checks covered local references, external dependencies, inline scripts/event handlers, browser persistence, and simulation operation under the HTML CSP. They are not a penetration test or a guarantee against every attack. The Terms and Privacy pages are prototype drafts reflecting current application behaviour. Update operator/contact information and processing descriptions when the service changes.
