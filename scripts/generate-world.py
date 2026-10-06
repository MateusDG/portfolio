"""Create an original pixel map using Natural Earth public-domain boundaries."""
import json
import urllib.request
from pathlib import Path

source = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
world = json.load(urllib.request.urlopen(source, timeout=30))
polygons = []
for feature in world['features']:
    geo = feature['geometry']
    if geo['type'] == 'Polygon':
        shapes = [geo['coordinates']]
    else:
        shapes = geo['coordinates']
    for shape in shapes:
        ring = shape[0]
        polygons.append((ring, feature['properties'].get('ADMIN') == 'Brazil', (min(p[0] for p in ring), max(p[0] for p in ring), min(p[1] for p in ring), max(p[1] for p in ring))))

def inside(px, py, ring):
    hit = False
    previous = ring[-1]
    for current in ring:
        x1, y1 = previous
        x2, y2 = current
        if (y1 > py) != (y2 > py) and px < (x2-x1) * (py-y1) / (y2-y1) + x1:
            hit = not hit
        previous = current
    return hit

cells = []
for row in range(37):
    lat = 83 - row * 3.9
    for column in range(84):
        lon = -178 + column * 4.3
        for ring, brazil, (left, right, bottom, top) in polygons:
            if left <= lon <= right and bottom <= lat <= top and inside(lon, lat, ring):
                cells.append([column, row, int(brazil)])
                break
out = Path(__file__).resolve().parent.parent / 'dist/assets/world-blocks.json'
out.write_text(json.dumps({'source': source, 'license': 'Natural Earth public domain', 'cells': cells}), encoding='utf-8')
print(f'World map: {len(cells)} land blocks.')
