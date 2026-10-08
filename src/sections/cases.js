import { $, $$ } from '../lib/dom.js';
import { lenis } from '../lib/smooth.js';

const shots = [
  ['dashboard', 'visão executiva', 'Visão executiva: clientes ativos, transações por cliente, movimentação e atividade da carteira'],
  ['atividade', 'atividade', 'Atividade e retenção: coortes e continuidade do relacionamento'],
  ['rede', 'agências', 'Rede de agências: intensidade de uso por agência com denominadores explícitos'],
  ['credito', 'crédito', 'Crédito: propostas e valores por status'],
  ['alavancas', 'alavancas', 'Alavancas comerciais: ranking para validação, sem efeitos causais identificados'],
];
const asset = (name) => `${import.meta.env.BASE_URL}assets/banvic/${name}.webp`;

const CASES = {
  banvic: {
    kicker: 'estudo de caso · engenharia de dados',
    html: () => `
      <article class="cs">
        <h2 id="case-title">BanVic</h2>
        <p class="cs-intro">Plataforma de dados e inteligência comercial construída como prova de conceito para a certificação de engenharia de dados da Indicium. Do snapshot do ERP a um dashboard que a equipe comercial consegue usar, sem perder uma linha no caminho.</p>
        <div class="cs-stats">
          <div><strong>76.206</strong><span>linhas reconciliadas</span></div>
          <div><strong>7</strong><span>tabelas publicadas em uma transação</span></div>
          <div><strong>30</strong><span>testes aprovados na revisão final</span></div>
          <div><strong>55,8 s</strong><span>execução final do pipeline</span></div>
        </div>
        <h3>O problema</h3>
        <p>A fonte é um <strong>snapshot completo</strong> do ERP, sem CDC. O desafio era transformá-lo em uma base confiável para análise: preservar a origem, provar que nada foi alterado e tornar a infraestrutura reproduzível em qualquer máquina.</p>
        <h3>A arquitetura</h3>
        <div class="cs-pipe"><span>ZIP oficial</span><b>→</b><span>sensor Airflow</span><b>→</b><span>snapshot</span><b>→</b><span>7 cargas Meltano em pods</span><b>→</b><span>staging</span><b>→</b><span>QA</span><b>→</b><span>publicação transacional</span><b>→</b><span>views analytics</span><b>→</b><span>FastAPI</span><b>→</b><span>dashboard ECharts</span></div>
        <ul>
          <li>Kubernetes local com <strong>Kind</strong>, provisionado por <strong>Terraform</strong> e <strong>Helm</strong> (chart oficial do Airflow).</li>
          <li><code>config/data_contract.json</code> verifica arquivos, cabeçalhos, tipos e chaves antes da carga.</li>
          <li>Colunas <code>text</code> no schema raw preservam valores e zeros à esquerda; as views fazem a conversão de tipos.</li>
          <li>Validação compara contagens e <strong>hashes de todos os valores</strong>, chaves e relações. Cinco vínculos órfãos da própria fonte viram avisos e são preservados.</li>
          <li>As sete tabelas e o marcador de snapshot entram na <strong>mesma transação</strong>. Falha em qualquer etapa significa rollback.</li>
          <li>Credenciais em Kubernetes Secrets, conta somente leitura para a API e nenhum dado pessoal de cliente enviado ao navegador.</li>
        </ul>
        <table class="cs-table">
          <thead><tr><th>tabela</th><th>linhas</th></tr></thead>
          <tbody>
            <tr><td>agencias</td><td>10</td></tr><tr><td>clientes</td><td>998</td></tr><tr><td>colaborador_agencia</td><td>100</td></tr>
            <tr><td>colaboradores</td><td>100</td></tr><tr><td>contas</td><td>999</td></tr><tr><td>propostas_credito</td><td>2.000</td></tr><tr><td>transacoes</td><td>71.999</td></tr>
          </tbody>
          <tfoot><tr><td>total</td><td>76.206</td></tr></tfoot>
        </table>
        <h3>Resiliência, testada de verdade</h3>
        <p>Os cenários do simulador da página são os mesmos da revisão: <strong>falha transitória</strong> (<code>--fail-once contas</code>) se recupera no retry; <strong>falha permanente</strong> (<code>--fail-always contas</code>) termina com o DAG em falha, código de saída diferente de zero e o snapshot anterior intacto. Republicar uma execução concluída não altera os dados.</p>
        <h3>O dashboard</h3>
        <p>Seis telas com filtros por período, canal e agência, coortes, diagnósticos de evidência, simulador de tamanho amostral e exportação CSV.</p>
        <div class="gallery" id="gallery">
          <div class="gallery-main"><img id="gallery-img" src="${asset('dashboard')}" alt="${shots[0][2]}" width="1400" height="980" loading="lazy"></div>
          <div class="gallery-tabs" role="group" aria-label="Telas do dashboard">
            ${shots.map(([id, label], i) => `<button type="button" data-shot="${id}" aria-pressed="${i === 0}">${label}</button>`).join('')}
          </div>
        </div>
        <p class="cs-note">Capturas reais do dashboard, preservadas nas evidências do projeto. A fonte registra comportamento, não intervenções nem custos: a aplicação diz explicitamente que <strong>nenhum efeito causal de investimento está identificado</strong>. Associação forte orienta um piloto; não garante retorno.</p>
        <div class="cs-links"><a class="btn btn-solid" href="https://github.com/MateusDG/data-engineer-indicium" target="_blank" rel="noopener noreferrer">ver código e documentação ↗</a></div>
      </article>`,
    mount() {
      const img = $('#gallery-img');
      $$('[data-shot]').forEach((button) => button.addEventListener('click', () => {
        const shot = shots.find((s) => s[0] === button.dataset.shot);
        $$('[data-shot]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        img.style.opacity = 0;
        const next = new Image();
        next.onload = () => { img.src = next.src; img.alt = shot[2]; img.style.opacity = 1; };
        next.src = asset(shot[0]);
      }));
    },
  },
  tcc: {
    kicker: 'estudo de caso · TCC · Sistemas de Informação · UFOP',
    html: () => `
      <article class="cs">
        <h2 id="case-title">Recomendação com ontologias fuzzy</h2>
        <p class="cs-intro"><em>Sistema de Recomendação Baseado em Ontologias Fuzzy para Comércio Eletrônico.</em> A pergunta: como combinar conhecimento do domínio, preferências imprecisas e sinais de interação para recomendar produtos e <strong>explicar</strong> cada escolha?</p>
        <div class="cs-stats">
          <div><strong>194 mil</strong><span>metadados examinados</span></div>
          <div><strong>11.666</strong><span>produtos curados</span></div>
          <div><strong>102.105</strong><span>interações mantidas</span></div>
          <div><strong>93,9%</strong><span>precisão da curadoria (IC95% 91,6–95,6)</span></div>
        </div>
        <h3>Os dados</h3>
        <p>Recorte do <strong>Amazon Reviews 2023</strong> combinando Appliances e Home &amp; Kitchen, escolhido porque eletrodomésticos de embutir eram pouco representados na fonte original. Três milhões de reviews varridas, 97.082 usuários distintos e um piloto com <strong>189 produtos reais do catálogo da Kouzina</strong> e 1.494 arestas de similaridade.</p>
        <h3>O motor</h3>
        <div class="cs-pipe"><span>curadoria</span><b>→</b><span>ontologia v1.1</span><b>→</b><span>perfis</span><b>→</b><span>300 candidatos</span><b>→</b><span>Mamdani · 15 regras + R00</span><b>→</b><span>ranking híbrido</span><b>→</b><span>explicações</span><b>→</b><span>FastAPI</span><b>→</b><span>React</span></div>
        <ul>
          <li><strong>Ontologia de domínio</strong> com categorias, ambientes, atributos e relações auditáveis. A similaridade combina 50% atributos ontológicos e 50% texto (TF-IDF).</li>
          <li><strong>Inferência fuzzy Mamdani</strong> com Simpful, centroide vetorizado e parâmetros versionados. Categoria ou ambiente sem evidência recebem prior neutro (R00).</li>
          <li><strong>Ranking híbrido</strong>: o peso fuzzy varia de 0,35 a 0,70 conforme a confiança no perfil; o resto combina categoria, ambiente, similaridade e popularidade.</li>
          <li><strong>API FastAPI e interface React/TypeScript</strong> com jornada consultiva, ratings explícitos, medidores fuzzy e rastreio das regras disparadas.</li>
        </ul>
        <h3>Pesquisa também é dizer o que não funcionou</h3>
        <p>Na avaliação offline (F5), o modelo fuzzy original <strong>perdeu</strong> para os baselines de categoria e popularidade. Esse resultado negativo está preservado como evidência. A evolução híbrida v2 melhorou o ranking frente a uma referência fuzzy contemporânea em 200 usuários, num protocolo com limitações temporais explícitas; as variantes v3/v4 não justificaram promoção.</p>
        <p class="cs-note">Estágio: TCC em andamento, conclusão prevista para dezembro de 2026. O protótipo (F1 a F8) está implementado; a monografia, a revisão humana das relações ontológicas e a avaliação consultiva com a Kouzina ainda estão em consolidação. Nada aqui afirma superioridade geral nem impacto em vendas.</p>
        <h3>Uma evolução aplicada</h3>
        <p>O repositório público <strong>Kouzina Reco</strong> explora a frente comercial: API de recomendações, widget JavaScript, ingestão de catálogo e telemetria. É um projeto separado do protótipo acadêmico, que vive num repositório privado.</p>
        <div class="cs-links"><a class="btn btn-solid" href="https://github.com/MateusDG/saas-fuzzy" target="_blank" rel="noopener noreferrer">explorar o Kouzina Reco ↗</a></div>
      </article>`,
  },
  site: {
    kicker: 'nota · como este site foi feito',
    html: () => `
      <article class="cs">
        <h2 id="case-title">Como este site foi feito</h2>
        <p class="cs-intro">A ideia central: <strong>quase nada é 0 ou 1</strong>. Por isso o nome é feito de partículas com grau de pertinência, o TCC tem um laboratório fuzzy de verdade e o BanVic roda um DAG na sua frente.</p>
        <h3>Stack</h3>
        <ul>
          <li>HTML, CSS e JavaScript sem framework, empacotados com <strong>Vite</strong>.</li>
          <li><strong>Three.js</strong> para os voxels de contribuição, carregado só quando a seção se aproxima.</li>
          <li><strong>GSAP</strong> e <strong>Lenis</strong> para animações e rolagem suave; tudo desliga com "movimento off" ou com a preferência do sistema.</li>
          <li>Tipografia <strong>Doto</strong> (dot-matrix) e <strong>JetBrains Mono</strong>, servidas localmente.</li>
        </ul>
        <h3>Contribuições públicas e privadas</h3>
        <p>O calendário público do GitHub não mostra o trabalho em repositórios privados. Um script (<code>scripts/sync-github.py</code>) usa a API autenticada: as públicas vêm do calendário oficial; as privadas são os commits do autor em todos os branches dos repositórios privados, sem duplicar SHAs. Nomes de repositórios privados só aparecem quando eu autorizo.</p>
        <h3>Os segredos</h3>
        <p>São 18. O contador fica no canto inferior esquerdo e guarda seu progresso neste navegador. O Bit, o mascote do chão do hero, sabe algumas dicas.</p>
        <h3>Acessibilidade</h3>
        <p>Navegação por teclado, foco visível, modais nativos, textos alternativos, respeito a <code>prefers-reduced-motion</code> e nenhum retorno que dependa só de som: os efeitos sonoros são opcionais e vêm desligados.</p>
      </article>`,
  },
};

export function initCases() {
  const dialog = $('#case-dialog');
  const body = $('#case-body');
  const kicker = $('#case-kicker');
  let trigger;

  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-case]');
    if (!button) return;
    const item = CASES[button.dataset.case];
    if (!item) return;
    trigger = button;
    kicker.textContent = item.kicker;
    body.innerHTML = item.html();
    item.mount?.();
    dialog.showModal();
    body.scrollTop = 0;
    lenis?.stop();
  });
  $('#case-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { lenis?.start(); trigger?.focus({ preventScroll: true }); });

  const secrets = $('#secrets-dialog');
  secrets.addEventListener('close', () => lenis?.start());
  for (const d of [dialog, secrets]) {
    d.addEventListener('click', (e) => {
      if (e.target === d) d.close(); // clique no backdrop
    });
    d.querySelector('[data-close]')?.addEventListener('click', () => d.close());
  }
}
