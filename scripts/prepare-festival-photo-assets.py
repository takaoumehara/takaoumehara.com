"""Prepare reviewed local KIE outputs for the site, preserving source photos.

No network calls. Run after all edit and privacy jobs have completed.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/festival-photo-edit'
ASSETS = ROOT / 'public/assets/festival-design'
DEST = ASSETS / 'editorial'
PAGE = ROOT / 'src/case-studies/festival-design.html'
DOCS = ROOT / 'docs/festival-photo-edit'
body = PAGE.read_text()
names = re.findall(r'<img[^>]+src="/assets/festival-design/(?:editorial/)?([^"/]+)"', body)
excluded = ('Aki', 'aki', 'noren', 'treasure')
photos = [Path(n).stem for n in names if n.endswith('.webp') and not n.startswith(excluded)]
assert len(photos) == len(set(photos)) == 26, 'Expected exactly 26 distinct photographs'
no_faces = {'yurayura-photo-1600', 'tsurimaster-fish', 'katanuki-play-1600', 'katanuki-1600'}
selected = {}
for stem in photos:
    if stem not in no_faces:
        image = OUT / (stem + '-private.png')
        assert image.exists(), 'Identity replacement missing: ' + stem
    else:
        image = OUT / (stem + '-refined.png')
        if not image.exists():
            image = OUT / (stem + '.png')
    assert image.exists(), 'Photo edit missing: ' + stem
    with Image.open(image) as im:
        im.verify()
    selected[stem] = image

DEST.mkdir(exist_ok=True)
DOCS.mkdir(parents=True, exist_ok=True)
manifest = []
prompts = {}
for stem, source in selected.items():
    image = Image.open(source).convert('RGB')
    # Deliver full generated resolution; WebP removes PNG transfer overhead.
    dest = DEST / (stem + '.webp')
    image.save(dest, 'WEBP', quality=92, method=6)
    original = ASSETS / (stem + '.webp')
    manifest.append({'photo': stem, 'original': str(original.relative_to(ROOT)),
                     'edited': str(dest.relative_to(ROOT)), 'selectedOutput': source.name,
                     'width': image.width, 'height': image.height, 'bytes': dest.stat().st_size,
                     'originalSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
                     'editedSha256': hashlib.sha256(dest.read_bytes()).hexdigest()})
    # Keep the prompt record without temporary API upload URLs or credentials.
    prompts[stem] = {p.stem: p.read_text() for p in (OUT / 'prompts').glob(stem + '*.txt')}
    pattern = r'(<img\b[^>]*src=")/assets/festival-design/(?:editorial/)?' + re.escape(stem) + r'\.webp("[^>]*>)'
    def update(match):
        tag = match.group(1) + '/assets/festival-design/editorial/' + stem + '.webp' + match.group(2)
        tag = re.sub(r'width="\d+"', f'width="{image.width}"', tag)
        return re.sub(r'height="\d+"', f'height="{image.height}"', tag)
    body, count = re.subn(pattern, update, body)
    assert count == 1, 'Expected one photo reference: ' + stem

body = body.replace("Per Takao, every child's face in these photos\n     is already AI-converted, so they are used as is.",
                    "2026-10-10: photographs edited through KIE (Nano Banana Pro, then GPT Image 2 for faces).\n     AI face replacement, branded happi, crowd additions and Yurayura canopy support reconstruction;\n     original photographs retained, edited versions under assets/festival-design/editorial.")
body = body.replace('The school shop on the day: goods on tables under the navy えるあい商店 noren, a volunteer in a 祭 T-shirt in front',
                    'Children and parents browsing merchandise at えるあい商店 under its original navy noren, with adult volunteers in branded happi')
body = body.replace('The Yurayura Coin tent under its magenta noren, volunteers behind the glass tanks',
                    'Yurayura Coin: the original magenta noren on a reconstructed crossbar, adult volunteers in happi and children playing at the glass tanks')
PAGE.write_text(body)
(DOCS / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
(DOCS / 'prompts.json').write_text(json.dumps(prompts, indent=2, ensure_ascii=False) + '\n')

rows = []
canvas = Image.new('RGB', (1500, ((len(photos) + 4) // 5) * 270), 'white')
draw = ImageDraw.Draw(canvas)
for i, stem in enumerate(photos):
    im = Image.open(DEST / (stem + '.webp'))
    im.thumbnail((290, 230))
    x, y = i % 5 * 300, i // 5 * 270
    canvas.paste(im, (x, y))
    draw.text((x, y + 235), stem, fill='black')
    base = '../../public/assets/festival-design/'
    rows.append(f'<section><h2>{html.escape(stem)}</h2><div class="pair"><figure><img src="{base}{stem}.webp" alt="元写真"><figcaption>元写真</figcaption></figure><figure><a href="{base}editorial/{stem}.webp"><img src="{base}editorial/{stem}.webp" alt="編集版"></a><figcaption>編集版（クリックで原寸）</figcaption></figure></div></section>')
canvas.save(OUT / 'final-contact-sheet.jpg', quality=95)
review = '''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>秋祭り写真：元写真と編集版</title><style>body{font:16px/1.6 system-ui;background:#f5f4f0;color:#202020;margin:0;padding:32px}main{max-width:1500px;margin:auto}h1{font-size:28px}h2{font-size:18px}section{margin:36px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}img{width:100%;max-height:700px;object-fit:contain;background:#fff}figcaption{margin-top:8px;color:#666}@media(max-width:700px){body{padding:16px}.pair{grid-template-columns:1fr}}</style><main><h1>秋祭り写真：元写真と編集版</h1><p>26枚。会場・ゲーム・元グラフィックを参照したAI編集。顔、ハッピ、賑わい、光と色を調整。</p>'''
(OUT / 'review.html').write_text(review + ''.join(rows) + '</main></html>')
print(f'Prepared {len(manifest)} photos, {sum(m["bytes"] for m in manifest)/1024/1024:.1f} MiB total')
