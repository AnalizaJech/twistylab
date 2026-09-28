"""Encode real browser screenshots in output/readme-frames into README media."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output' / 'readme-frames'
DEST = ROOT / 'docs' / 'media'
DEST.mkdir(parents=True, exist_ok=True)
SIZE = (1000, 760)
BG = '#0e120f'
ACCENT = '#c0ee83'
def load_font(size, bold=False):
    candidates = [
        'C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',
        'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf',
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)

title_font = load_font(23, bold=True)
small_font = load_font(14)

def frame(file, title, subtitle):
    canvas = Image.new('RGB', SIZE, BG)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((20, 21, 26, 48), radius=3, fill=ACCENT)
    draw.text((38, 17), title, font=title_font, fill='#e7eae4')
    draw.text((38, 49), subtitle, font=small_font, fill='#94a095')
    image = Image.open(SOURCE / file).convert('RGB')
    image = ImageOps.contain(image, (960, 652), Image.Resampling.LANCZOS)
    x = (SIZE[0] - image.width) // 2
    y = 86 + (652 - image.height) // 2
    draw.rounded_rectangle((x - 1, y - 1, x + image.width, y + image.height), radius=8, outline='#2b342c')
    canvas.paste(image, (x, y))
    return canvas

def encode(name, frames, durations):
    sheet = Image.new('RGB', (256 * len(frames), 192), BG)
    for i, image in enumerate(frames):
        sheet.paste(image.resize((256, 192)), (256 * i, 0))
    palette = sheet.quantize(colors=256)
    indexed = [image.quantize(palette=palette, dither=Image.Dither.NONE) for image in frames]
    target = DEST / name
    indexed[0].save(target, save_all=True, append_images=indexed[1:], duration=durations, loop=0, optimize=True, disposal=1)
    with Image.open(target) as image:
        print(f'{name}: {image.n_frames} frames, {target.stat().st_size / 1024:.0f} KiB, {image.size}')
    frames[0].save(DEST / name.replace('.gif', '-poster.png'), optimize=True)

tour = [
    ('Cronómetro', 'Mezclas reales, visor 3D y sesiones en un mismo espacio.'),
    ('Preparación', 'Mantén Espacio hasta estar listo; suelta para empezar.'),
    ('Cada resolución cuenta', 'El cronómetro mide el tiempo y guarda tu resultado.'),
    ('Tu sesión, guardada', 'Cada intento alimenta el historial y las estadísticas.'),
    ('Historial con contexto', 'Notas, penalizaciones y reproducción de la mezcla.'),
    ('Mide tu progreso', 'Mejores tiempos, medias móviles y gráficas.'),
    ('Hazlo tuyo', 'Apariencia, inspección, precisión y controles configurables.'),
    ('Español / English', 'Cambia el idioma y conserva tu preferencia.'),
    ('Tus datos, contigo', 'Exporta CSV o guarda e importa una copia JSON.'),
    ('16 puzzles para explorar', 'Búsqueda, favoritos y filtros que aparecen cuando los necesitas.'),
    ('Laboratorio de movimientos', 'Caras, capas anchas, rotaciones y giros inversos o dobles.'),
]
encode('workspace-tour.gif', [frame(f'tour-{i:02}.png', *text) for i, text in enumerate(tour)], [1700, 900, 1100] + [1800] * 8)

responsive = [
    ('desktop', 'Escritorio · 1440 × 960', 'Visor, cronómetro y sesión en paralelo.'),
    ('tablet', 'Tablet · 768 × 1024', 'La distribución se adapta al espacio disponible.'),
    ('mobile', 'Móvil · 390 × 844', 'Cronómetro táctil y visor compacto.'),
    ('mobile-play', 'Laboratorio en móvil', 'El puzzle sigue siendo el protagonista.'),
    ('mobile-editor', 'Editor de algoritmos', 'Altura fija y scroll interno; sin redimensionado manual.'),
    ('mobile-filters', 'Catálogo en móvil', 'Filtros desplegables y una sola zona de scroll.'),
]
encode('responsive.gif', [frame(f'size-{tag}.png', title, subtitle) for tag, title, subtitle in responsive], [2100] * len(responsive))

play = [frame(f'play-{i:02}.png', 'Movimientos 3D, en acción', "R U R′ U′ Rw Uw′ Fw2 · notación validada, animación y memoria de movimientos") for i in range(31)]
encode('playground.gif', play, [1000] + [130] * 29 + [1500])
