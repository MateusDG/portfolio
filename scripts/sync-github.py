"""Gera public/data/github.json com contribuições públicas E privadas reais do último ano.

Requer o GitHub CLI autenticado (`gh auth login`) ou a variável GH_TOKEN.

- Público: calendário oficial do GitHub (GraphQL `contributionCalendar`), igual ao do perfil.
- Privado: commits do usuário em todos os branches dos repositórios privados
  (próprios e de colaboração), deduplicados por SHA. Esses commits não aparecem
  no calendário público, então não há contagem dupla.

Nomes de repositórios privados só aparecem quando listados em PRIVATE_LABELS;
os demais viram "Repositório privado".
"""
import datetime as dt
import json
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

USER = 'MateusDG'
TZ = dt.timezone(dt.timedelta(hours=-3))  # America/Sao_Paulo (sem horário de verão)
OUT = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'github.json'

# Rótulos públicos para repositórios privados. Ausente aqui = anônimo.
PRIVATE_LABELS = {
    'MateusDG/kouzina': 'Kouzina Club · e-commerce',
    'MateusDG/recommendation_fuzzy': 'TCC · recomendação fuzzy',
}


def gh(*args, paginate=False):
    cmd = ['gh', 'api', *args]
    if paginate:
        cmd += ['--paginate', '--slurp']
    raw = subprocess.run(cmd, check=True, capture_output=True, text=True, encoding='utf-8').stdout
    data = json.loads(raw)
    if paginate:  # --slurp devolve uma lista de páginas
        return [item for page in data for item in page]
    return data


def graphql(query, **variables):
    args = ['graphql', '-f', f'query={query}']
    for key, value in variables.items():
        args += ['-F', f'{key}={value}']
    return gh(*args)['data']


today = dt.datetime.now(TZ).date()
start = today - dt.timedelta(days=364)
start -= dt.timedelta(days=(start.weekday() + 1) % 7)  # semana começa no domingo, como no GitHub
frm = dt.datetime.combine(start, dt.time(0, 0), TZ).isoformat()
to = dt.datetime.combine(today, dt.time(23, 59, 59), TZ).isoformat()

data = graphql('''
query($from: DateTime!, $to: DateTime!) {
  viewer {
    createdAt
    followers { totalCount }
    publicRepos: repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    privateRepos: repositories(ownerAffiliations: OWNER, privacy: PRIVATE) { totalCount }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalRepositoryContributions
      totalPullRequestContributions
      totalIssueContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner isPrivate primaryLanguage { name } }
        contributions { totalCount }
      }
    }
  }
}''', **{'from': frm, 'to': to})['viewer']

collection = data['contributionsCollection']
public_by_day = {d['date']: d['contributionCount'] for w in collection['contributionCalendar']['weeks'] for d in w['contributionDays']}
repo_rows = {}
for item in collection['commitContributionsByRepository']:
    repo = item['repository']
    if repo['isPrivate']:  # se o perfil passar a incluir privados, eles vêm do REST abaixo
        continue
    repo_rows[repo['nameWithOwner']] = {
        'name': repo['nameWithOwner'].split('/')[1], 'private': False,
        'lang': (repo['primaryLanguage'] or {}).get('name'), 'commits': item['contributions']['totalCount'],
    }

private_repos = [r for r in gh(f'user/repos?affiliation=owner,collaborator,organization_member&visibility=private&per_page=100', paginate=True)]
private_by_day = Counter()
since = dt.datetime.combine(start, dt.time(0, 0), TZ).astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
for repo in private_repos:
    full = repo['full_name']
    seen = set()
    for branch in gh(f'repos/{full}/branches?per_page=100', paginate=True):
        commits = gh(f'repos/{full}/commits?sha={branch["name"]}&author={USER}&since={since}&per_page=100', paginate=True)
        for c in commits:
            if c['sha'] in seen:
                continue
            seen.add(c['sha'])
            when = dt.datetime.fromisoformat(c['commit']['author']['date'].replace('Z', '+00:00')).astimezone(TZ).date()
            if start <= when <= today:
                private_by_day[when.isoformat()] += 1
    if seen:
        repo_rows[full] = {
            'name': PRIVATE_LABELS.get(full, 'Repositório privado'), 'private': True,
            'lang': repo.get('language'), 'commits': len(seen),
        }
    print(f'  privado {full if full in PRIVATE_LABELS else "(anônimo)"}: {len(seen)} commits')

days, cursor = [], start
while cursor <= today:
    key = cursor.isoformat()
    days.append({'d': key, 'pub': public_by_day.get(key, 0), 'prv': private_by_day.get(key, 0)})
    cursor += dt.timedelta(days=1)

totals_pub = sum(d['pub'] for d in days)
totals_prv = sum(d['prv'] for d in days)
active = [d['pub'] + d['prv'] > 0 for d in days]
longest = run = 0
for a in active:
    run = run + 1 if a else 0
    longest = max(longest, run)
current = 0
for a in reversed(active):
    if not a:
        break
    current += 1
busiest = max(days, key=lambda d: d['pub'] + d['prv'])

lang_weight = defaultdict(int)
for row in repo_rows.values():
    if row['lang']:
        lang_weight[row['lang']] += row['commits']
lang_total = sum(lang_weight.values()) or 1
by_weekday = [0] * 7
for d in days:
    by_weekday[(dt.date.fromisoformat(d['d']).weekday() + 1) % 7] += d['pub'] + d['prv']

# Repositórios anônimos são agregados para não expor quantos existem individualmente.
named = sorted((r for r in repo_rows.values() if r['name'] != 'Repositório privado'), key=lambda r: -r['commits'])
anon = [r for r in repo_rows.values() if r['name'] == 'Repositório privado']
if anon:
    named.append({'name': 'Outros repositórios privados', 'private': True, 'lang': None, 'commits': sum(r['commits'] for r in anon)})

result = {
    'username': USER,
    'generatedAt': dt.datetime.now(TZ).isoformat(timespec='minutes'),
    'range': {'from': start.isoformat(), 'to': today.isoformat()},
    'totals': {
        'all': totals_pub + totals_prv, 'public': totals_pub, 'private': totals_prv,
        'publicCommits': collection['totalCommitContributions'],
        'reposCreated': collection['totalRepositoryContributions'],
        'activeDays': sum(active),
    },
    'streak': {'longest': longest, 'current': current},
    'busiestDay': {'date': busiest['d'], 'count': busiest['pub'] + busiest['prv']},
    'byWeekday': by_weekday,
    'languages': [{'name': k, 'share': round(v / lang_total, 4)} for k, v in sorted(lang_weight.items(), key=lambda kv: -kv[1])[:6]],
    'repos': named[:10],
    'profile': {
        'since': data['createdAt'][:10], 'followers': data['followers']['totalCount'],
        'publicRepos': data['publicRepos']['totalCount'], 'privateRepos': data['privateRepos']['totalCount'],
    },
    'days': days,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'GitHub: {totals_pub} públicas + {totals_prv} privadas = {totals_pub + totals_prv} contribuições ({start} → {today}).')
