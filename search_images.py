import urllib.request
import json

def get_wikimedia_images(query, limit=5):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit={limit}&prop=imageinfo&iiprop=url&format=json"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            pages = data.get('query', {}).get('pages', {})
            urls = []
            for page_id in pages:
                imageinfo = pages[page_id].get('imageinfo', [])
                if imageinfo:
                    urls.append(imageinfo[0].get('url'))
            return urls
    except Exception as e:
        print(f"Error for {query}: {e}")
        return []

places = [
    "Бульвар Эркиндик Бишкек",
    "Bishkek Park",
    "Ala Archa National Park",
    "Oak Park Bishkek",
    "Issyk Kul",
    "Cafe Bublik Bishkek",
    "Парк Ынтымак Бишкек",
    "Ala Too Square",
    "Chunkurchak",
    "Asia Mall Bishkek",
    "Dordoi Plaza",
    "Navat Bishkek",
    "Promzona Club Bishkek",
    "Capito Coffee Bishkek",
]

for p in places:
    print(f"--- {p} ---")
    urls = get_wikimedia_images(p, 5)
    for u in urls:
        print(u)
