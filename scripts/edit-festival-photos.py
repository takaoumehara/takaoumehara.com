"""Resumable KIE photo editing; credentials stay in local environment files.

Run from the repo: python3 scripts/edit-festival-photos.py [photo stems...]
Outputs and per-photo prompts/tasks are retained under output/festival-photo-edit.
No existing public image is overwritten by this runner.
"""
import argparse
import base64
import concurrent.futures
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import threading
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/assets/festival-design'
OUT = ROOT / 'output/festival-photo-edit'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'prompts').mkdir(exist_ok=True)
KEY = os.environ.get('KIE_AI_API', '')
for env in [ROOT / '.env.local', ROOT.parent / '.env.local']:
    if not KEY and env.exists():
        for line in env.read_text().splitlines():
            if line.startswith('KIE_AI_API='):
                KEY = line.split('=', 1)[1].strip().strip('\"\u0027')
if not KEY:
    raise SystemExit('KIE_AI_API missing from local environment files')

COMMON = '''Use case: compositing / photorealistic-natural.
Edit image 1, the actual festival photograph. Return one finished photograph, never a collage.
This is a coherent editorial photography series of the LI Japanese supplementary-school autumn festival in an indoor school hall. Preserve this exact room, checkerboard floor, booths, handmade game hardware, printed graphics, props, camera viewpoint and game mechanics. Do not move it outdoors, redesign the games, turn it into a commercial fair, or add unrelated attractions.
FACE PRIVACY: replace EVERY visible person's face, adults and children, including small background faces, with a different believable entirely fictional face. Keep approximate age group, gaze and natural emotion, but substantially CHANGE facial structure, eye spacing, eyebrows, nose, mouth and jaw so these are unmistakably DIFFERENT people. Small cosmetic retouching is insufficient. Keep diverse Japanese and multicultural school families. Do not reproduce their original facial identity. Anatomically natural eyes, hands and expressions; no smoothing, blurred faces, masks, celebrity faces or repeated clones. Preserve the original activity and body poses unless additions below require a small natural adjustment.
ART DIRECTION across the whole series: professional candid event editorial, optimistic and lively, soft neutral daylight balanced with the indoor lighting, gently warm skin, clean whites, accurate vivid magenta/yellow/red/navy brand inks, open shadows, controlled highlights, fine natural texture and tasteful contrast. Full-frame 35mm/50mm documentary photography, realistic perspective, appropriate depth of field with game equipment and signage readable. Improve exposure, white balance, detail and visual balance. No dramatic orange/teal grade, no artificial sun rays, no film borders, no glossy CGI or excessive background blur. Keep believable imperfections of a real handmade school festival.
VOLUNTEER CLOTHING: adult booth volunteers wear an open short Japanese happi jacket OVER their existing casual shirt and trousers, with loose three-quarter sleeves, charcoal-black lapel bands, small white circular 祭 chest crests, large white circular 祭 crest on the back surrounded by 知行合一, and geometric red/green/purple/black checks, stripes and diagonal blocks at sleeve cuffs and lower hem. Solid main jacket bodies alternate black, festival red, deep purple and green. The lapels have small vertical white 'LI HOSHUKO AKIMATSURI' and 'LI 補習校 秋祭り'. Match the user's garment design: flat straight open-front hip-length happi, not a kimono, bathrobe, vest or costume; casually worn unbelted over everyday clothes. Supporting brand pattern and logo references are only for this clothing, never for changing the booth artwork. Children and visiting parents wear ordinary casual clothes.
ACTIVITY: in wide booth/event shots, show a believable modest bustle of preschool children accompanied by parents, primary-school children and a few middle/high-school students engaged with this booth's actual game, queuing politely, watching and enjoying themselves. Keep the game and banner visible. Do not add a crowd to a product/detail photograph. Preserve every printed Japanese title, illustration, target silhouette, scoring board and handmade object faithfully; use the supplied flat banner as the exact reference where provided. Natural fabric folds and perspective are fine; inventing/replacing the design or title is not.
'''

SPECS = {
 'venue-entrance': ('Keep the existing banner, patterned pillars, lanterns and hall. Make the gathering feel like an active welcoming school festival, with happy children of several school ages and parents passing through; staff near the gate may wear the specified happi.', None),
 'flying-chicken-booth': ('Children are playing the original Flying Chicken throwing game, lining up near the existing yellow target shelf. Preserve all printed target silhouettes and the original yellow flying-chicken banner. Volunteers assist from the sides.', 'Aki24_FlyingChiken.png'),
 'flying-chicken-targets': ('This is an equipment detail of the cut-out targets on the yellow shelving. Keep exact targets, rows, points chart and handmade shelf geometry. Improve light and composition; any background volunteer wears happi. Do not add children in front of the targets.', 'Aki24_FlyingChiken.png'),
 'flying-chicken-photo-1600': ('Preserve the yellow target shelves, silhouettes, red/white backdrop and actual Flying Chicken banner. Add a small group of children naturally trying and watching the throwing game, with an adult volunteer beside the shelf, without hiding the targets.', 'Aki24_FlyingChiken.png'),
 'korinto-team': ('Preserve the staff group portrait, same number and approximate positions of people, including the child. All adult staff wear the specified branded happi over casual clothes. Children remain in casual clothes. Replace every face. Keep the red Korinto banner intact, with a little lively festival activity behind, not a new crowd in front.', 'Aki24_Korinto.png'),
 'korinto-board': ('Foreground product/mechanics detail: preserve the exact wooden nail field, existing hand-drawn numbers, scoring pockets and curved board. Do not change the nail layout or invent game hardware. Background volunteers wear happi and naturally explain to one or two children, staying out of the board foreground.', None),
 'korinto-photo-1600': ('Keep the original two red-framed wooden pinball boards, supports and cafeteria tables. Show exactly ONE child in casual clothes, back toward the camera, standing with BOTH feet on the checkerboard FLOOR, playing at the near-end ball-launch control of one board. Exactly one adult in branded happi calmly watches from the side. The other board is empty. Nobody sits, stands, kneels or climbs on tables or benches; move a bench aside only if needed for natural floor access. No crowd, no simultaneous players around a board, no reaching across its nail field. Preserve the red banner and actual game mechanics.', 'Aki24_Korinto.png'),
 'korinto-play': ('Keep original wooden red-framed boards, scoring geometry and visible hand positions. The children and teens naturally play; booth adults assist in branded happi. Add only a few watching children farther back if space allows.', 'Aki24_Korinto.png'),
 'guruguru-team': ('Preserve the group portrait and two eye-shaped red spinning targets on their stands, original flag and red/white backdrop. Replace all faces. Adult booth staff wear the branded happi; children wear ordinary casual clothes. Do not add additional people in front.', 'Aki24_Guruguru_H.png'),
 'guruguru-throw': ('Keep the player mid-throw, ball, two original eye-shaped spinning discs, stand heights and booth position. Volunteer wears branded happi over casual clothes. A couple of children wait behind without entering the throwing lane.', 'Aki24_Guruguru_H.png'),
 'guruguru-photo-1600': ('Preserve the two red eye-shaped spinning targets exactly, actual stands and gameplay. Children throw and watch with safe space around the targets; staff wear branded happi. Do not replace targets with dartboards or circles lacking the original eye design.', 'Aki24_Guruguru_H.png'),
 'yurayura-booth': ('IMPORTANT STRUCTURAL CORRECTION: retain this blue pop-up canopy in this indoor hall, but add a physically plausible straight rigid horizontal aluminum crossbar spanning between the two front vertical legs, connected by proper clamps and brackets. Hang the magenta noren evenly from this crossbar with small grommet ties; it has mild realistic fabric folds but no sagging collapsed support or floating attachments. Image 2 is the exact flat original ゆらゆらコイン banner: reproduce its magenta ground, white wavy Japanese lettering, coin/small shapes and complete original proportions faithfully on the fabric. Never invent text. Keep the glass water tanks and dishes on the original table. Adult volunteers behind tanks wear branded happi. Several children with parents naturally queue and drop coins into tanks, keeping the main banner and glass tanks visible.', 'Aki24_Yurayura.png'),
 'yurayura-tank': ('Close-up through the water: preserve the glass tank, waterline, bubbles, sinking coin, small scoring dishes and existing scoring chart. Show the original coin-dropping action accurately. Replace any face seen through/reflected in the glass. Keep believable light refraction; no fish or invented objects. Keep this tight detail, no added crowd.', None),
 'yurayura-photo-1600': ('Preserve the top-down tank composition, original bowls on the tank floor, water and hands dropping a single coin. Do not change the game into fishing or add coins raining down. Professional sharp water/glass detail; no added crowd.', None),
 'superball-team': ('Keep the volunteer group portrait under the original navy Superball banner and the inflatable blue pool. All adult booth staff wear branded happi over their casual clothes; replace all faces. Add only a small hint of children waiting in background if visible, keeping group and banner readable.', 'Aki24_Superball.png'),
 'superball-scoop': ('Keep the existing child, scoop/bowl, blue pool and many small colorful superballs. Preserve actual scooping action and natural hands. Replace the child face and any background faces. Keep vertical close framing; no extra foreground crowd.', None),
 'superball-pool-1600': ('Keep overhead view of children around the same blue inflatable pool, small multicolored floating balls, scoops and bowls. Preserve the group activity and each child age and pose; replace visible faces. Adults helping may wear the branded happi, but children stay in casual clothes.', None),
 'tsurimaster-rods': ('Keep low viewpoint by the original blue inflatable fishing pool, handmade patterned fish, rods and string lengths. Show children fishing naturally; any adult volunteer wears branded happi over their casual outfit. Keep this actual indoor room and printed fish designs.', 'Aki24_TsuriMaster.png'),
 'tsurimaster-play': ('Preserve existing child fishing with the original rod, blue inflatable pool and original handmade patterned fish. The adult assisting wears branded happi. Replace visible faces; add only a few school-age children waiting behind. Preserve tent and red-white backdrop.', 'Aki24_TsuriMaster.png'),
 'tsurimaster-1600': ('Keep the existing blue pool, handmade fish and rods. Children including primary-school students and a teen are enjoying the fishing activity; adult volunteers in branded happi assist. Do not replace the flat decorated handmade fish with live fish.', 'Aki24_TsuriMaster.png'),
 'tsurimaster-fish': ('Product detail: keep every handmade colorful geometrically patterned fish and the blue pool, exact illustrated prints, shapes and arrangement. Improve crispness and reflected light with natural texture. No people or additional objects.', None),
 'katanuki-table': ('Preserve the close documentary view of students concentrating at the existing orange table, original kits, illustrated worksheets, toothpicks and tiny cut-out candy shapes. Replace every visible face; maintain anatomy and fine hand work. Background staff wear branded happi. Keep a focused, enjoyable game atmosphere.', 'Aki24_Katanuki_H.png'),
 'katanuki-play-1600': ('Keep close/top-down hands working on the existing cut-out sweet at the original white illustrated instruction sheet. Preserve all original diagrams, Japanese text and pink material. No additional crowd or staging; realistic careful handwork and professional detail photography.', None),
 'katanuki-1600': ('Flat product detail of the pink cut-out sweets. Preserve the exact eight separate pieces, arrangement and every original etched silhouette precisely. Enhance soft natural studio-quality lighting, pink material texture, clean white background. Do not invent extra shapes, people, marks or lettering.', None),
 'otakara-exchange': ('Make this existing prize redemption booth lively: children from preschool with parents through primary and secondary-school ages examine the actual displayed prizes and redeem their cards with helpful adult volunteers in branded happi. Keep the original numbered displays, actual prize tables, original black/yellow お宝交換所 banner and room geometry. Leave clear visibility of merchandise and banner.', 'Aki24_Otakara.webp'),
 'eruai-shoten': ('This is the えるあい商店 shopping corner. Keep the original tables and exact merchandise display, original navy noren with white えるあい商店 lettering and emblem, and the school hall. Show a believable lively small crowd of preschoolers with parents, elementary children browsing, middle/high-school students selecting items and paying. Adult volunteers behind the tables and the original foreground adult wear the branded happi over casual clothes; do not dress shoppers in uniforms. Show natural exchanges and joyful curiosity, not posed people. Keep the banner entirely readable and merchandise visible.', 'Aki24_LI_Shoten.webp'),
}

UPLOAD_LOCK = threading.Lock()
UPLOADS_FILE = OUT / 'uploads.json'
UPLOADS = json.loads(UPLOADS_FILE.read_text()) if UPLOADS_FILE.exists() else {}

def request(url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as response:
        result = json.load(response)
    if result.get('code') != 200:
        raise RuntimeError(f"KIE {result.get('code')}: {result.get('msg')}")
    return result['data']

def upload(path):
    # Small reference uploads are serialized to avoid duplicate uploads.
    with UPLOAD_LOCK:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in UPLOADS:
            return UPLOADS[digest]
        mime = mimetypes.guess_type(path.name)[0] or 'image/png'
        data = request('https://kieai.redpandaai.co/api/file-base64-upload', {
            'base64Data': 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode(),
            'uploadPath': 'festival-photo-edit', 'fileName': digest[:12] + '-' + path.name})
        UPLOADS[digest] = data['downloadUrl']
        UPLOADS_FILE.write_text(json.dumps(UPLOADS, indent=2))
        return data['downloadUrl']

def process(stem, refine=False, privacy=False):
    suffix = '-private' if privacy else '-refined' if refine else ''
    photo = OUT / (stem + '.png') if refine or privacy else ASSETS / (stem + '.webp')
    if privacy and (OUT / (stem + '-refined.png')).exists():
        photo = OUT / (stem + '-refined.png')
    task_file = OUT / (stem + suffix + '.task.json')
    output = OUT / (stem + suffix + '.png')
    if output.exists():
        print(stem + ': already downloaded', flush=True)
        return
    detail, banner = SPECS[stem]
    refs = [photo]
    if banner:
        refs.append(ASSETS / banner)
    # Garment references and branding, never booth replacement artwork.
    happi_refs = sorted((OUT / 'references').glob('happi-*.png'))
    if happi_refs:
        refs.extend(happi_refs)
    else:
        refs.extend([ASSETS / 'Aki_Pattern_Fine_All.png',
                     Path('/Users/takao/Documents/00_Product_Develpment/000_Akimatsuri/akimatsuri-branding/Logo/Akimatsuri_Mark_White.png')])
    prompt = COMMON + '\nSHOT-SPECIFIC EDIT: ' + detail
    prompt += '\nINPUT ROLES: image 1 is the only photo to edit. '
    if banner:
        prompt += 'Image 2 is the exact original flat banner artwork for this booth. '
    if happi_refs:
        prompt += 'Remaining images are the exact original happi garment front/back design sheets in different colorways. Reproduce these on the adult volunteer jackets, with real cloth and natural folds. Do not copy the white sheet background into the photograph.'
    else:
        prompt += 'Remaining images are the geometric brand pattern and the white festival crest, supporting the specified happi jacket print only.'
    prompt += '\nFINAL PRIORITY: This is also a complete identity replacement task: make all visible faces recognizably different fictional identities from image 1, including the adults. Do not merely retouch or preserve faces. Children and teenage customers wear casual clothes, no happi. Photographic realism and faithful game/signage design must remain.'
    refinement = OUT / 'prompts' / (stem + '.refine.txt')
    if refine:
        prompt = refinement.read_text()
        refs = [photo]
    if privacy:
        prompt = '''Recast the people in this event photograph as entirely NEW FICTIONAL PARTICIPANTS. Replace EVERY face of every adult and child, including tiny background faces and reflections, with a distinct unrelated imaginary person of the same broad age group, apparent gender presentation and approximate skin-tone range. Preserve the demographic appearance of each participant while changing facial identity. Do not change women into men or alter the overall family/community demographic mix. Change face shapes, eye spacing, eyebrows, noses, mouths and jawlines substantially. It is essential that none of the original facial identities remain recognizable. Natural diverse Japanese and multicultural families. This is face anonymization, not cosmetic retouching: do not preserve original faces. Preserve natural emotional expressions, gaze direction, body positions, age groups and human anatomy. You may subtly change hair style to fit the new identities. Keep the identical photograph composition, room, game equipment, signs, all printed Japanese lettering and illustrations, merchandise, garment designs, body poses, background, photographic lighting and color. Only replace identities; do not restage the festival or redesign anything. Preserve professional event photography, believable skin texture and anatomy. No blur, masks, celebrities, repeated clones, over-smoothed skin, illustration or CGI. Every visible face must be a different new fictional person, including all adults.'''
        refs = [photo]
        notes = OUT / 'prompts' / (stem + '.privacy-notes.txt')
        if notes.exists():
            prompt += '\n' + notes.read_text()
    (OUT / 'prompts' / (stem + suffix + '.txt')).write_text(prompt)
    if task_file.exists():
        task = json.loads(task_file.read_text())
    else:
        urls = [upload(path) for path in refs]
        from PIL import Image
        w, h = Image.open(photo).size
        ratios = ['4:3', '3:2', '16:9', '3:4', '9:16', '1:1']
        ratio = min(ratios, key=lambda s: abs(w/h - int(s.split(':')[0])/int(s.split(':')[1])))
        body = {'model': 'nano-banana-pro', 'input': {'prompt': prompt, 'image_input': urls,
                'aspect_ratio': ratio, 'resolution': '2K', 'output_format': 'png'}}
        if privacy:
            body = {'model': 'gpt-image-2-image-to-image', 'input': {'prompt': prompt,
                    'input_urls': urls, 'aspect_ratio': ratio, 'resolution': '2K'}}
        task = request('https://api.kie.ai/api/v1/jobs/createTask', body)
        task['request'] = body
        task_file.write_text(json.dumps(task, indent=2, ensure_ascii=False))
        print(stem + ': submitted ' + task['taskId'], flush=True)
    deadline = time.monotonic() + 1200
    while time.monotonic() < deadline:
        state = request('https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + task['taskId'])
        task['result'] = state
        task_file.write_text(json.dumps(task, indent=2, ensure_ascii=False))
        if state['state'] == 'success':
            urls = json.loads(state['resultJson'])['resultUrls']
            with urllib.request.urlopen(urls[0], timeout=90) as response:
                content = response.read()
            from PIL import Image
            import io
            Image.open(io.BytesIO(content)).verify()
            output.write_bytes(content)
            print(stem + ': saved, credits=' + str(state.get('creditsConsumed')), flush=True)
            return
        if state['state'] == 'fail':
            raise RuntimeError(f"{stem}: {state.get('failCode')} {state.get('failMsg')}")
        time.sleep(12)
    raise TimeoutError(stem + ': still pending; rerun to resume without new charge')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('photos', nargs='*', choices=list(SPECS))
    parser.add_argument('--refine', action='store_true')
    parser.add_argument('--privacy', action='store_true')
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    photos = args.photos or list(SPECS)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(process, stem, args.refine, args.privacy): stem for stem in photos}
        failures = []
        for future in concurrent.futures.as_completed(futures):
            try:
                future.result()
            except Exception as error:
                failures.append(futures[future])
                print(futures[future] + ': ERROR ' + str(error), flush=True)
    if failures:
        raise SystemExit('Incomplete: ' + ', '.join(failures))
