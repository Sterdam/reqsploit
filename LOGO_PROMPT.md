# 🎨 ReqSploit Logo Generation Prompt

## Prompt pour OpenArt / Midjourney / DALL-E

```
Professional cybersecurity logo for "ReqSploit" - Modern MITM proxy and security testing platform.

STYLE:
- Sleek, minimalist, ultra-modern hacker aesthetic
- Dark theme with neon cyber accents
- Professional pentesting tool branding
- Matrix/cyberpunk inspiration without being cliché

COLOR PALETTE:
- Primary: Cyber green (#10B981) - signature neon glow
- Secondary: Deep navy (#0A1929) - professional darkness
- Accent: Electric blue (#3B82F6) - data streams
- Highlight: Neon cyan (#06B6D4) - network connections

CORE CONCEPT:
- Clever integration of "RS" monogram or full "ReqSploit" wordmark
- Visual metaphor: HTTP request interception, MITM proxy, data flow manipulation
- Elements: Network nodes, intercepted packets, encrypted connections, proxy tunneling

DESIGN ELEMENTS TO INCLUDE:
1. Abstract representation of HTTP requests being intercepted mid-flight
2. Network topology/graph with highlighted interception point
3. Shield or lock merged with network flow (security + pentesting)
4. Hexagonal tech pattern or circuit board texture (subtle background)
5. Data packet stream being split/analyzed/modified

TECHNICAL REQUIREMENTS:
- Vector-style artwork, clean scalable design
- Transparent background (PNG with alpha)
- Works in monochrome (single color variants)
- Recognizable at 16px (browser tab favicon) up to 512px (app icon)
- Modern sans-serif typography if text included

MOOD & FEELING:
- Confidence and precision
- Cutting-edge technology
- Ethical hacking expertise
- Professional security tooling
- Intelligence and sophistication

AVOID:
- Generic shield icons
- Overused hacker clichés (skull, anonymous mask)
- Outdated "matrix rain" aesthetic
- Overly complex details that don't scale
- Comic book style or cartoonish elements

INSPIRATION REFERENCES:
- Burp Suite's professional orange/black branding
- Metasploit's clean technical logo
- Wireshark's fin/wave network metaphor
- Modern SaaS security platforms (Snyk, Datadog)

OUTPUT VARIATIONS NEEDED:
1. Full logo with wordmark (horizontal layout)
2. Icon-only square version (app icon, favicon)
3. Monochrome version (single color on transparent)
4. Inverted version (light theme compatibility)

TARGET SIZES:
- 16x16px (favicon)
- 48x48px (extension icon small)
- 128x128px (extension icon large)
- 512x512px (app icon, social media)
- 1024x1024px (high-res marketing)

BRAND PERSONALITY:
ReqSploit is the Tesla of MITM proxies - sleek, intelligent, powerful yet approachable.
Where Burp Suite is the industry standard, ReqSploit is the AI-powered next generation.
Professional enough for enterprise security teams, accessible enough for indie hackers.
```

---

## Alternative Shorter Prompt (OpenArt optimized)

```
Ultra-modern cybersecurity logo for "ReqSploit" MITM proxy tool.
Sleek minimalist hacker aesthetic, dark theme with cyber green (#10B981) neon glow.
Incorporate abstract HTTP request interception, network nodes, data flow.
Professional pentesting branding like Burp Suite but more futuristic.
Clean vector design, scalable 16px-512px, transparent background.
Avoid clichés (skulls, masks). Think Tesla meets Matrix - intelligent sophistication.
```

---

## Midjourney Specific Prompt

```
professional cybersecurity logo design for ReqSploit, modern MITM proxy platform, minimalist hacker aesthetic, dark navy background with neon cyber green (#10B981) accents, abstract network interception visualization, HTTP data packets being intercepted mid-flight, geometric tech patterns, clean vector style, professional pentesting tool branding, ultra-modern, sophisticated, works at 16px favicon size, transparent background, --style raw --v 6.0 --ar 1:1 --q 2
```

---

## DALL-E 3 Specific Prompt

```
Create a professional, minimalist logo for "ReqSploit" - a modern cybersecurity MITM proxy tool.

Design requirements:
- Sleek, ultra-modern hacker aesthetic with dark theme
- Color scheme: cyber green (#10B981) neon glow on deep navy (#0A1929)
- Incorporate abstract visualization of HTTP requests being intercepted
- Geometric network topology with highlighted interception node
- Clean vector style, professional pentesting branding
- Must be recognizable from 16px (favicon) to 512px (app icon)
- Transparent or dark background
- Typography: modern sans-serif if text included
- Mood: intelligent, sophisticated, cutting-edge security
- Inspiration: Burp Suite professionalism meets futuristic AI-powered tools
- Avoid: skulls, masks, cliché hacker symbols, overly complex details

The logo should represent: network interception, data flow control, intelligent security testing, professional pentesting excellence.
```

---

## Design Concepts to Consider

### Concept 1: Intercepted Packet Flow
```
→→→ ⚡ →→→
   RS
```
Data flow arrows with "RS" monogram at interception point, neon glow effect.

### Concept 2: Network Graph with Focal Node
```
  ○──○
  │\ │
  ○─●─○  (● = ReqSploit interception node)
    │
    ○
```
Minimalist network topology, central node highlighted in cyber green.

### Concept 3: Split Data Stream
```
───┐
   ├→ RS
───┘
```
Single data stream splitting through proxy point.

### Concept 4: Hexagonal Shield Network
```
  ╱──╲
 ╱ RS ╲
 ╲────╱
```
Hexagon (tech/honeycomb) with network connections, security metaphor.

---

## File Naming Convention

Generated files should be named:
- `reqsploit-logo-full.png` (horizontal wordmark)
- `reqsploit-icon-512.png` (square app icon)
- `reqsploit-icon-128.png` (extension icon)
- `reqsploit-icon-48.png` (small extension icon)
- `reqsploit-icon-16.png` (favicon)
- `reqsploit-logo-mono.png` (monochrome version)

---

## Post-Generation Tasks

Once you have the logo:

1. **Replace Extension Icons**:
   ```bash
   cp reqsploit-icon-128.png ~/burponweb/extension/public/icons/icon128.png
   cp reqsploit-icon-48.png ~/burponweb/extension/public/icons/icon48.png
   cp reqsploit-icon-16.png ~/burponweb/extension/public/icons/icon16.png
   ```

2. **Update Frontend Favicon**:
   ```bash
   cp reqsploit-icon-16.png ~/burponweb/frontend/public/favicon.ico
   ```

3. **Create PWA Icons** (multiple sizes):
   - 192x192px for Android
   - 512x512px for splash screens

4. **Rebuild Extension**:
   ```bash
   cd ~/burponweb/extension
   npm run build
   ```

---

## Brand Guidelines (Future Reference)

**Primary Logo Usage**:
- Full wordmark logo on light backgrounds: dark version
- Full wordmark logo on dark backgrounds: cyber green version
- Icon-only for small spaces (< 100px width)

**Color Codes**:
- Cyber Green: #10B981 (RGB: 16, 185, 129)
- Deep Navy: #0A1929 (RGB: 10, 25, 41)
- Electric Blue: #3B82F6 (RGB: 59, 130, 246)
- Neon Cyan: #06B6D4 (RGB: 6, 182, 212)

**Typography** (if using text):
- Primary: Inter, SF Pro, or similar modern sans-serif
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI"
- Weight: 600-700 (Semi-bold to Bold)
