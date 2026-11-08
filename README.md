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

Both pages prefer Neiko. The included @font-face uses locally installed Neiko / Neiko-Regular, with Arial as fallback. A licensed webfont was not supplied. To enable Neiko for every visitor, place your licensed WOFF2 file in the site folder and change the @font-face src in styles.css to its URL. The designer’s free release is personal-use only; see https://www.behance.net/gallery/218952455/Neiko-Typeface-%28Free-Font%29 . The fallback remains active on devices without the font.
