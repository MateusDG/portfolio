# Mateus Diniz · entre o 0 e o 1

Portfólio de Mateus Diniz Gottardi, refeito do zero. A ideia central vem do TCC: **quase nada é 0 ou 1**. O nome é feito de partículas com grau de pertinência (μ), o BanVic roda um DAG na frente do visitante, o TCC tem um laboratório fuzzy de verdade e as contribuições do GitHub aparecem em voxels 3D, incluindo o trabalho em repositórios privados.

## Executar

Requer Node.js 20+.

```sh
npm install
npm run dev       # http://127.0.0.1:5173
npm run build     # gera dist/
npm run preview   # serve dist/ em http://127.0.0.1:4173
```

`dist/` é a pasta publicada (ver `.openai/hosting.json`). Qualquer hospedagem estática serve: os caminhos são relativos.

## Atualizar as contribuições do GitHub

```sh
npm run sync      # python scripts/sync-github.py
npm run build
```

O script usa o GitHub CLI autenticado (`gh auth login`) ou a variável `GH_TOKEN` e grava `public/data/github.json`:

- **Públicas**: calendário oficial do GitHub (GraphQL `contributionCalendar`), o mesmo do perfil.
- **Privadas**: commits do autor em todos os branches dos repositórios privados, próprios e de colaboração, deduplicados por SHA. Esses commits não entram no calendário público, então não há contagem dupla.
- Nomes de repositórios privados só aparecem se estiverem em `PRIVATE_LABELS` no script; os demais são agregados como "Outros repositórios privados".

O "último commit" do cartão de status é calculado em relação à data atual, então fica honesto mesmo se o snapshot envelhecer.

## Estrutura

| caminho | o que é |
|---|---|
| `index.html` | todo o conteúdo e a semântica da página |
| `src/main.js` | orquestra módulos, controles flutuantes e dados |
| `src/sections/intro.js` | boot: o portfólio como um DAG do Airflow |
| `src/sections/hero.js` | nome em partículas amostradas da fonte Doto e controle μ |
| `src/sections/critters.js` | o terrário do hero: Bit, pato de borracha, Fuzz, bugs e o servidor-casa |
| `src/sections/banvic.js` | simulador do DAG `banvic_ingestion` (sucesso, retry e falha permanente) |
| `src/sections/fuzzylab.js` | inferência Mamdani didática + ranking híbrido |
| `src/sections/contrib.js` / `voxels.js` | estatísticas e voxels 3D (Three.js, carregado sob demanda) |
| `src/sections/terminal.js` | terminal com comandos |
| `src/sections/eggs.js` | easter eggs (Konami, Matrix, tela azul, tema claro…) |
| `src/sections/cases.js` | estudos de caso em modal |
| `src/lib/` | movimento, som, segredos, rolagem suave, revelações, navegação, cursor |
| `src/styles/` | tokens, layout das seções e widgets |
| `public/assets/banvic/` | capturas reais do dashboard do BanVic (WebP) |

## Segredos

São 21, com contador no canto inferior esquerdo e progresso salvo no navegador. Algumas dicas estão no painel de segredos; os bichinhos do terrário sabem outras.

## Acessibilidade e desempenho

- Respeita `prefers-reduced-motion`; o botão **movimento** desliga intro, partículas, Lenis e animações, e a preferência fica salva.
- Som opcional e desligado por padrão; todo retorno também é visual.
- Navegação por teclado, foco visível, `<dialog>` nativo, textos alternativos e um único `h1`.
- Canvas e WebGL só animam com a seção visível; Three.js é carregado quando a seção do GitHub se aproxima, com calendário 2D de reserva se WebGL falhar.
- Fontes da primeira dobra pré-carregadas (plugin em `vite.config.js`), `scrollbar-gutter: stable` contra deslocamento de layout ao fim da intro e animações contínuas apenas em `transform`/`opacity`.
- O terrário pausa todas as animações fora da tela; os bichinhos se movem com `transform` direto, sem variáveis CSS por quadro.
- Lighthouse no build de produção com compressão: performance 96 (mobile) / 98 (desktop), acessibilidade 100, SEO 100. Boas práticas chega a 100 servido por HTTPS.

## Origem das informações

- Currículo, experiência e contatos: currículos em PDF do autor.
- BanVic: README e revisão final de requisitos de 05/10/2026 do repositório `data-engineer-indicium`; capturas em `evidence/commercial/`.
- TCC: panorama de 15/09/2026 do repositório `recommendation_fuzzy` (privado). O laboratório da página é uma simulação didática inspirada no motor do protótipo, com catálogo ilustrativo.
- Contribuições: API do GitHub, conforme descrito acima.

Referência de estilo: [samuelrizzon.dev](https://www.samuelrizzon.dev/). Fontes: Doto e JetBrains Mono (SIL Open Font License), servidas localmente via Fontsource.
