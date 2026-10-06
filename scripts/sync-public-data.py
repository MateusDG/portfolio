"""Refresh the public GitHub contribution snapshot. No token is required."""
import datetime
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

class CalendarParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.days = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'td' and attrs.get('data-date') and 'data-level' in attrs:
            self.days.append({'date': attrs['data-date'], 'level': int(attrs['data-level']), 'count': None})

url = 'https://github.com/users/MateusDG/contributions'
request = urllib.request.Request(url, headers={'User-Agent': 'MateusDG-Portfolio'})
html = urllib.request.urlopen(request, timeout=25).read().decode()
parser = CalendarParser()
parser.feed(html)
match = re.search(r'id="js-contribution-activity-description"[^>]*>\s*([\d,]+)', html)
if not match or not parser.days:
    raise RuntimeError('The GitHub calendar could not be parsed; existing snapshot preserved.')
data = {'username': 'MateusDG', 'source': url, 'updated': datetime.date.today().isoformat(), 'total': int(match[1].replace(',', '')), 'days': sorted(parser.days, key=lambda d: d['date'])}
destination = Path(__file__).resolve().parent.parent / 'dist' / 'assets' / 'github-contributions.json'
destination.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
print(f"GitHub: {data['total']} contributions, {len(data['days'])} days.")
