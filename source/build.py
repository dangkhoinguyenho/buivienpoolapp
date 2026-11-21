#!/usr/bin/env python3
"""Builds self-contained register.html / manager.html (+ PWA files) into dist/."""
import json, os, shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, DIST = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'dist')
os.makedirs(DIST, exist_ok=True)
read = lambda f: open(os.path.join(SRC, f), encoding='utf-8').read()
css, core = read('core.css'), read('core.js')

def page(name, title, js, color):
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{title}"><meta name="theme-color" content="{color}">
<link rel="manifest" href="manifest-{name}.json"><link rel="apple-touch-icon" href="icon-{name}.png"><link rel="icon" href="icon-{name}.png">
<title>{title}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet"><style>{css}</style></head>
<body><div id="app"></div>
<script>{core}</script>
<script>{js}</script>
</body></html>"""

apps = [('register', 'Pool Register', read('register.js'), '#0d1714', (31, 138, 85), '$'),
        ('manager', 'Pool Manager', read('manager.js'), '#0d1714', (40, 70, 120), 'M')]
for name, title, js, color, rgb, glyph in apps:
    open(os.path.join(DIST, f'{name}.html'), 'w', encoding='utf-8').write(page(name, title, js, color))
    json.dump({'name': title, 'short_name': title.split()[-1], 'start_url': f'{name}.html', 'display': 'standalone',
               'background_color': '#0d1714', 'theme_color': color,
               'icons': [{'src': f'icon-{name}.png', 'sizes': '512x512', 'type': 'image/png'}]},
              open(os.path.join(DIST, f'manifest-{name}.json'), 'w'), indent=1)
    # icon: rounded felt square with a white ball and glyph
    S = 512; im = Image.new('RGB', (S, S), rgb); d = ImageDraw.Draw(im)
    d.ellipse((96, 96, 416, 416), fill=(250, 250, 250))
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 220)
    except Exception: f = ImageFont.load_default()
    bb = d.textbbox((0, 0), glyph, font=f); w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.text(((S - w) / 2 - bb[0], (S - h) / 2 - bb[1]), glyph, font=f, fill=rgb)
    im.save(os.path.join(DIST, f'icon-{name}.png'))

open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Pool Hall</title><style>{css}
.wrap{{max-width:420px;margin:12vh auto;padding:20px;text-align:center}} a.big{{display:block;margin:14px 0;padding:26px;border-radius:16px;color:#fff;text-decoration:none;font-size:22px;font-weight:800}}</style></head>
<body><div class="wrap"><h1>🎱 Pool Hall</h1>
<a class="big" style="background:#1f8a55" href="register.html">Register · Thu ngân</a>
<a class="big" style="background:#284678" href="manager.html">Manager · Quản lý</a>
<p class="muted small">Open one, then Share → Add to Home Screen.</p><p><a href="guide.html" style="color:#0a6fd6;font-weight:600">📘 Setup &amp; user guide</a></p></div></body></html>""")

open(os.path.join(DIST, 'sw.js'), 'w').write("""// Offline support: app pages are network-first (so updates arrive), Firebase SDK is cache-first.
const C = 'poolhall-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['register.html', 'manager.html', 'index.html']).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'www.gstatic.com' || u.hostname === 'fonts.gstatic.com' || u.hostname === 'fonts.googleapis.com') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cl = res.clone(); caches.open(C).then(c => c.put(e.request, cl)); return res; })));
  } else if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(res => { const cl = res.clone(); caches.open(C).then(c => c.put(e.request, cl)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true })));
  }
});
""")
# ---- guide with embedded screenshots
import base64, io, re as _re
def guide_html():
    g = read('guide.html')
    def emb(m):
        path = f'/home/claude/guideshots/{m.group(1)}.png'
        if not os.path.exists(path): return ''
        im = Image.open(path).convert('RGB'); im.thumbnail((1100, 1100)); buf = io.BytesIO(); im.save(buf, 'JPEG', quality=72)
        return '<img alt="" src="data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode() + '">'
    return _re.sub(r'\{\{img:(\w+)\}\}', emb, g)
GUIDE = guide_html()
open(os.path.join(DIST, 'guide.html'), 'w', encoding='utf-8').write(GUIDE)
# ---- in-Claude demo: simulator + both apps on one origin (no service worker, local data only)
DEMO = os.path.join(ROOT, 'demo'); os.makedirs(DEMO, exist_ok=True)
for name, title, js, color, rgb, glyph in apps:
    html = page(name, title, js, color).replace('<script>' + core, '<script>window.PH_DEMO=true;' + core, 1)
    html = html.replace(f'<link rel="manifest" href="manifest-{name}.json"><link rel="apple-touch-icon" href="icon-{name}.png"><link rel="icon" href="icon-{name}.png">', '<link rel="icon" href="data:,">')
    open(os.path.join(DEMO, f'{name}.html'), 'w', encoding='utf-8').write(html)
sim = read('sim.html').replace("<script>\n'use strict';", "<script>" + core + "</script>\n<script>\n'use strict';", 1)
open(os.path.join(DEMO, 'index.html'), 'w', encoding='utf-8').write(sim)
open(os.path.join(DEMO, 'guide.html'), 'w', encoding='utf-8').write(GUIDE)
print('built', sorted(os.listdir(DIST)), sorted(os.listdir(DEMO)))
