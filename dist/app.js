const $ = (selector) => document.querySelector(selector);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const email = 'mateusdinizgo@hotmail.com';
let toastTimer;
function toast(message) { const el = $('#toast'); el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 4500); }
function hideIntro() { $('.intro').classList.add('is-hidden'); document.body.classList.add('is-ready'); }
$('#skip-intro').addEventListener('click', hideIntro);
setTimeout(hideIntro, reducedMotion ? 0 : 2600);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { hideIntro(); closeMenu(); } });
const menuButton = $('.menu-toggle');
function closeMenu() { $('#navigation').classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Abrir menu'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; $('#navigation').classList.toggle('is-open', open); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
$('#navigation').addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', (event) => { if (!event.target.closest('.header')) closeMenu(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  document.querySelectorAll('[data-category]').forEach(row => { row.hidden = button.dataset.filter !== 'all' && row.dataset.category !== button.dataset.filter; });
}));

const details = {
  banvic: {
    kicker: 'Projeto / Engenharia de dados',
    content: `<h2 id="dialog-title">BanVic</h2><p class="dialog-intro">Uma plataforma de dados e inteligência comercial, construída como prova de conceito para a certificação de engenharia de dados da Indicium.</p><div class="detail-stats"><div><strong>76.206</strong><span>linhas reconciliadas</span></div><div><strong>7</strong><span>tabelas de origem</span></div><div><strong>30</strong><span>testes aprovados em 05/10</span></div></div><h3>O problema</h3><p>Transformar um snapshot do ERP em uma base confiável para análise, preservando todos os valores de origem e tornando a infraestrutura reproduzível.</p><h3>Como construí</h3><div class="pipeline"><span>ERP</span><span>→</span><span>Meltano</span><span>→</span><span>Airflow</span><span>→</span><span>PostgreSQL</span><span>→</span><span>FastAPI / Dashboard</span></div><ul><li>Kubernetes local com Kind, infraestrutura como código com Terraform e Helm.</li><li>Validação de contratos, contagens, chaves, hashes de valores e vínculos entre as tabelas.</li><li>Publicação das sete tabelas em uma única transação, com rollback, retries e trilha de auditoria.</li><li>Dashboard comercial com atividade, retenção, agências, crédito e exportação CSV.</li></ul><h3>Evidência e resultado</h3><p>A revisão de 05/10/2026 registrou 30 testes aprovados, cinco cenários reais de resiliência e reconciliação integral das 76.206 linhas. O pipeline final executou em 55,826 segundos no ambiente local de referência.</p><p class="detail-note">Estágio: POC local validada. O dashboard apresenta associações e prioridades para validação; a fonte não permite afirmar efeitos causais de investimentos.</p><img class="detail-image" src="assets/banvic-dashboard.webp" alt="Dashboard real do BanVic com atividade, retenção, coortes e distribuição de recência da carteira" loading="lazy" width="1425" height="1742"><p class="detail-caption">Captura real do dashboard comercial, preservada na revisão do projeto.</p><a class="pixel-button" href="https://github.com/MateusDG/data-engineer-indicium" target="_blank" rel="noopener noreferrer">Ver código e documentação ↗</a>`
  },
  tcc: {
    kicker: 'Pesquisa / TCC · Sistemas de Informação · UFOP',
    content: `<h2 id="dialog-title">Recomendação com ontologias fuzzy</h2><p class="dialog-intro">Sistema de Recomendação Baseado em Ontologias Fuzzy para Comércio Eletrônico. Meu TCC na Universidade Federal de Ouro Preto, com foco em recomendações e explicações rastreáveis.</p><div class="detail-stats"><div><strong>11.666</strong><span>produtos curados</span></div><div><strong>102.105</strong><span>interações no recorte</span></div><div><strong>189</strong><span>produtos no catálogo piloto</span></div></div><h3>A pergunta da pesquisa</h3><p>Como combinar conhecimento do domínio, preferências imprecisas e sinais de interação para recomendar produtos e explicar as escolhas feitas pelo sistema?</p><h3>O que está implementado</h3><ul><li>Curadoria dos dados Amazon Reviews 2023, nos domínios Appliances e Home & Kitchen.</li><li>Ontologia com categorias, ambientes, atributos e relações de similaridade.</li><li>Inferência fuzzy explicável e ranking híbrido, com recuperação de candidatos e avaliação offline.</li><li>API FastAPI, interface React e integração para declarar preferências, consultar recomendações e acompanhar explicações.</li><li>Protótipo com catálogo real da Kouzina e documentação das decisões e dos experimentos.</li></ul><h3>Pesquisa também é reconhecer os limites</h3><p>Os experimentos registram resultados positivos, negativos e inconclusivos. O modelo fuzzy original não superou os baselines de categoria e popularidade; a evolução híbrida melhorou o ranking em um protocolo restrito. Isso não demonstra superioridade geral nem impacto em vendas.</p><p class="detail-note">Estágio: TCC em andamento. O protótipo está implementado, mas a monografia e as avaliações humanas ainda precisam ser consolidadas. Os números descrevem o recorte documentado na revisão de 15/09/2026.</p><h3>Uma evolução aplicada</h3><p>O repositório público Kouzina Reco explora uma frente comercial relacionada: API de recomendações, widget JavaScript, ingestão de catálogo e telemetria. Ele é um projeto separado do protótipo acadêmico do TCC.</p><a class="pixel-button" href="https://github.com/MateusDG/saas-fuzzy" target="_blank" rel="noopener noreferrer">Explorar o MVP relacionado ↗</a>`
  }
};
const dialog = $('#project-dialog');
let dialogTrigger;
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const project = details[button.dataset.project]; if (!project) return;
  dialogTrigger = button; $('#dialog-kicker').textContent = project.kicker; $('#dialog-content').innerHTML = project.content;
  dialog.showModal(); document.body.classList.add('modal-open'); dialog.scrollTop = 0; $('#close-dialog').focus();
}));
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('modal-open'); dialogTrigger?.focus({ preventScroll: true }); });

const secrets = new Set();
function discover(key, message) { const found = !secrets.has(key); secrets.add(key); $('#secrets-count').textContent = secrets.size; toast(found ? `Segredo encontrado: ${message}` : message); }
$('#hero-character').addEventListener('click', () => { $('.speech').textContent = 'Bora construir?'; discover('builder', 'O pequeno construtor acordou.'); });
$('#secrets-button').addEventListener('click', () => toast(`${secrets.size}/3 descobertos. Dica: converse com o construtor ou explore o terminal.`));
let keySequence = [];
const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
document.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea')) return;
  keySequence.push(event.key); keySequence = keySequence.slice(-10);
  if (keySequence.join('|') === konami.join('|')) { discover('konami', 'Modo jogador 2 ativado. ↑ ↑ ↓ ↓ ← → ← → B A'); document.body.classList.toggle('player-two'); }
});

const output = $('#terminal-output');
let history = [], historyPosition = 0;
function terminalLine(text, className) { const p = document.createElement('p'); if (className) p.className = className; p.textContent = text; output.append(p); while (output.childElementCount > 45) output.firstElementChild.remove(); output.scrollTop = output.scrollHeight; return p; }
function terminalLinks(items) { const p = document.createElement('p'); items.forEach(([label, href], index) => { if (index) p.append(document.createTextNode(' · ')); const a = document.createElement('a'); a.textContent = label; a.href = href; if (href.startsWith('https')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } p.append(a); }); output.append(p); output.scrollTop = output.scrollHeight; }
function runCommand(raw) {
  const command = raw.trim().toLowerCase(); if (!command) return;
  if (command === 'clear' || command === 'limpar') { output.replaceChildren(); $('#terminal-input').value = ''; return; }
  terminalLine(`guest~ $ ${raw.trim()}`, 'muted'); history.push(raw.trim()); historyPosition = history.length;
  switch(command) {
    case 'help': case 'ajuda': terminalLine('Comandos: about · projects · skills · contact · email · github · linkedin · whatsapp · whoami · clear'); break;
    case 'about': case 'sobre': terminalLine('Mateus Diniz Gottardi. Desenvolvedor full stack na Kouzina desde 2023 e estudante de Sistemas de Informação na UFOP. Software, engenharia de dados e pesquisa em recomendação.'); break;
    case 'projects': case 'projetos': terminalLinks([['BanVic','#banvic'],['TCC Fuzzy','#tcc'],['Todos os projetos','#projects']]); break;
    case 'skills': case 'stack': terminalLine('Software: Java / TypeScript / React\nDados: Python / SQL / PostgreSQL\nInfra: Docker / Kubernetes / Terraform / Airflow\nPesquisa: ontologias / lógica fuzzy / recomendação'); break;
    case 'contact': case 'contato': terminalLine('Vamos conversar sobre software, dados ou uma ideia que precisa sair do papel.'); terminalLinks([['Enviar e-mail',`mailto:${email}`],['WhatsApp','https://wa.me/5527998619377'],['LinkedIn','https://www.linkedin.com/in/mateusdg/']]); break;
    case 'email': terminalLinks([[email,`mailto:${email}`]]); break;
    case 'github': terminalLinks([['@MateusDG no GitHub','https://github.com/MateusDG']]); break;
    case 'linkedin': terminalLinks([['Mateus Diniz no LinkedIn','https://www.linkedin.com/in/mateusdg/']]); break;
    case 'whatsapp': terminalLinks([['Conversar no WhatsApp','https://wa.me/5527998619377']]); break;
    case 'whoami': terminalLine('Você é guest. Bem-vindo ao meu pequeno universo de blocos.'); break;
    case 'sudo': case 'sudo hire mateus': discover('terminal', 'Permissão concedida para uma boa conversa.'); terminalLine('Para começar: contact'); break;
    case 'coffee': case 'cafe': case 'café': discover('terminal', 'Café é o combustível oficial dos próximos blocos.'); terminalLine('☕ Compilando ideias…'); break;
    default: terminalLine(`Comando não encontrado: ${raw.trim()}. Digite help para ver as opções.`);
  }
  $('#terminal-input').value = '';
}
$('#terminal-form').addEventListener('submit', event => { event.preventDefault(); runCommand($('#terminal-input').value); });
document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => runCommand(button.dataset.command)));
$('#terminal-input').addEventListener('keydown', event => {
  if (event.key === 'ArrowUp' && history.length) { event.preventDefault(); historyPosition = Math.max(0, historyPosition - 1); event.target.value = history[historyPosition]; }
  if (event.key === 'ArrowDown') { event.preventDefault(); historyPosition = Math.min(history.length, historyPosition + 1); event.target.value = history[historyPosition] || ''; }
});
$('#copy-email').addEventListener('click', async () => { try { await navigator.clipboard.writeText(email); $('#copy-status').textContent = 'E-mail copiado.'; toast('E-mail copiado.'); } catch { $('#copy-status').textContent = `Copie o e-mail: ${email}`; toast(`Copie: ${email}`); } });

// Pixel illustrations are original vector-like canvas compositions, not project screenshots.
function polygon(ctx, points, color) { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); }
function cube(ctx,x,y,w,h,top,left,right) { const d=w*.5; polygon(ctx,[[x,y-h],[x+w,y-h+d],[x,y-h+2*d],[x-w,y-h+d]],top); polygon(ctx,[[x-w,y-h+d],[x,y-h+2*d],[x,y+2*d],[x-w,y+d]],left); polygon(ctx,[[x,y-h+2*d],[x+w,y-h+d],[x+w,y+d],[x,y+2*d]],right); }
function drawBanvic(time = 0, build = 1) {
  const canvas=$('#banvic-art'), ctx=canvas.getContext('2d'); ctx.clearRect(0,0,960,640);
  const rows=13, cols=18, w=21, originX=380, originY=180;
  for(let z=0;z<rows;z++) for(let x=0;x<cols;x++) { const px=originX+(x-z)*w, py=originY+(x+z)*w*.5; const height=((x*7+z*3)%5===0)?9:3; cube(ctx,px,py,w-1,height,'#202a21','#10170f','#141e15'); }
  const towers=[[3,2,125],[6,3,95],[9,2,160],[12,4,112],[14,7,143],[10,9,95],[6,9,150]];
  towers.forEach(([x,z,height],i)=>{
    const px=originX+(x-z)*w,py=originY+(x+z)*w*.5,coral=i===3;
    const growth=Math.min(1,Math.max(0,(build-i*.055)*1.55));
    height*=1-Math.pow(1-growth,3);
    cube(ctx,px,py,32,height,coral?'#e18c71':'#78d79b',coral?'#7e4737':'#27563a',coral?'#b66c52':'#3c8155');
    for(let k=0;k<5;k++){
      if(44+k*18>height+20)continue;
      ctx.globalAlpha=.45+.45*(.5+.5*Math.sin(time*1.2+i-k*.7));
      ctx.fillStyle=coral?'#f1c1a0':'#9aeaaf';ctx.fillRect(px+6,py-height+44+k*18,8,5);ctx.fillRect(px-22,py-height+31+k*18,7,5);ctx.globalAlpha=1;
    }
  });
  if(build>.6)for(let i=0;i<9;i++){
    const fraction=(time*.18+i/9)%1, x=2+fraction*13,z=10-fraction*7;
    const px=originX+(x-z)*w,py=originY+(x+z)*w*.5;
    ctx.fillStyle=i%3===0?'#e7a586':'#94efa9';ctx.fillRect(px-3,py-4,6,4);
  }
  ctx.font='18px Silkscreen';ctx.fillStyle='#79957b';ctx.fillText('BANVIC / DATA PLATFORM',200,575);
}
function drawFuzzy(time = 0, build = 1) {
  const canvas=$('#fuzzy-art'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,960,640);
  const ox=400,oy=165,w=18;
  for(let z=0;z<12;z++)for(let x=0;x<16;x++){const px=ox+(x-z)*w,py=oy+(x+z)*w*.55;const dist=Math.hypot(x-8,z-6);const wave=Math.sin(time*1.4-dist*.8)*5;const h=Math.max(4,(80-dist*11+wave)*build);cube(ctx,px,py,w-1,h,dist<3?'#9b85bc':dist<5?'#655176':'#29212e','#1c1721','#38263f');}
  const nodes=[[260,205,28,'#e18c71'],[490,170,32,'#b1a1d0'],[670,290,24,'#71ce96'],[360,380,28,'#d9bf7e'],[580,395,23,'#a593c5'],[230,310,19,'#70a9bc']];
  nodes.forEach((node,i)=>{node[1]+=Math.sin(time*1.1+i)*8;});
  ctx.globalAlpha=build;ctx.strokeStyle='#64526f';ctx.lineWidth=3;
  [[0,1],[1,2],[0,3],[3,4],[4,2],[0,5],[5,3],[1,4]].forEach(([a,b],i)=>{
    ctx.beginPath();ctx.moveTo(nodes[a][0],nodes[a][1]);ctx.lineTo(nodes[b][0],nodes[b][1]);ctx.stroke();
    const travel=(time*.22+i*.17)%1,x=nodes[a][0]+(nodes[b][0]-nodes[a][0])*travel,y=nodes[a][1]+(nodes[b][1]-nodes[a][1])*travel;
    ctx.fillStyle=nodes[a][3];ctx.fillRect(x-4,y-4,8,8);
  });
  nodes.forEach(([x,y,s,color])=>{s*=build;ctx.fillStyle='#171b12';ctx.fillRect(x-s/2-5,y-s/2-5,s+10,s+10);ctx.fillStyle=color;ctx.fillRect(x-s/2,y-s/2,s,s);ctx.fillStyle='#e5dfd780';ctx.fillRect(x-s/2+4,y-s/2+4,7,7)});
  ctx.globalAlpha=1;
  ctx.font='18px Silkscreen';ctx.fillStyle='#b09bb7';ctx.fillText('KNOWLEDGE / PREFERENCES',195,575);
}
document.fonts.ready.then(()=>{drawBanvic();drawFuzzy();});

let contributions;
const chart = $('#contribution-canvas');
let plotted=[];
let graphView = '3d', graphSelection = null;
function drawContributions(build = 1) {
  if(!contributions)return;
  const ctx=chart.getContext('2d');ctx.clearRect(0,0,1400,530);plotted=[];
  const days=contributions.days, weekCount=Math.ceil(days.length/7), w=11.2, ox=165, oy=45;
  const shades=[['#273027','#141c14','#1b251b'],['#355c3d','#1b3423','#284930'],['#4c8757','#295234','#397044'],['#64b975','#377c4a','#47945a'],['#83e59e','#49945d','#61bb77']];
  const sorted=days.map((day,i)=>({...day,week:Math.floor(i/7),row:i%7})).sort((a,b)=>(a.week+a.row)-(b.week+b.row));
  sorted.forEach(day=>{
    let x,y,h;
    const selected=graphSelection===day.date,colors=shades[day.level]||shades[0];
    if(graphView==='2d'){
      x=80+day.week*23;y=130+day.row*34;h=0;
      ctx.fillStyle=selected?'#e18c71':colors[0];ctx.fillRect(x-9,y-9,18,18);
      if(selected){ctx.strokeStyle='#e6e7de';ctx.lineWidth=2;ctx.strokeRect(x-12,y-12,24,24);}
    }else{
      x=ox+(day.week-day.row)*w*1.78;y=oy+(day.week+day.row)*w*.50;
      const growth=Math.min(1,Math.max(0,(build-day.week*.004)*1.28));
      h=day.level===0?3:(day.level*13+5)*(1-Math.pow(1-growth,3));
      cube(ctx,x,y,w-1,h,...(selected?['#eeb698','#ad614b','#d28669']:colors));
    }
    plotted.push({...day,x,y,h,w});
  });
  ctx.fillStyle='#727e69';ctx.font='13px Silkscreen';
  if(graphView==='2d'){ctx.fillText('DOM',16,134);ctx.fillText('SÁB',16,338);ctx.fillText('OUT 2025',80,402);ctx.fillText('OUT 2026',1170,402);}
  else{ctx.fillText('OUT 2025',30,150);ctx.fillText('OUT 2026',weekCount*w*1.78+85,470);}
}
fetch('assets/github-contributions.json').then(response=>{if(!response.ok)throw Error();return response.json()}).then(data=>{
  contributions=data;drawContributions();$('#contribution-count').textContent=` · ${data.total.toLocaleString('pt-BR')} contribuições no último ano`;
  $('#contribution-date').textContent=`Dados públicos do GitHub · Atualizado em ${new Date(data.updated+'T12:00:00').toLocaleDateString('pt-BR')} · Passe o cursor ou toque nos blocos para ver a data.`;
  chart.setAttribute('aria-label',`${data.total} contribuições públicas de MateusDG no GitHub no último ano. Dados coletados em ${data.updated}.`);
}).catch(()=>{$('#contribution-count').textContent=' · Ver atividade no GitHub';$('#contribution-date').textContent='Os dados de atividade estão indisponíveis no momento.';});
function describeDay(day){const tooltip=$('#contribution-tooltip');tooltip.textContent=`${new Date(day.date+'T12:00:00').toLocaleDateString('pt-BR')} · ${day.count===null?'Nível '+day.level+' de atividade':day.count+' contribuições'}`;tooltip.hidden=false;graphSelection=day.date;drawContributions();}
function showDay(event){if(!plotted.length)return;const rect=chart.getBoundingClientRect(),x=(event.clientX-rect.left)*1400/rect.width,y=(event.clientY-rect.top)*530/rect.height;const day=plotted.reduce((best,p)=>{const score=Math.abs(x-p.x)+Math.abs(y-(p.y-p.h/2))*1.7;return !best||score<best.score?{...p,score}:best},null);if(day.score>40){$('#contribution-tooltip').hidden=true;graphSelection=null;return;}describeDay(day);}
chart.addEventListener('pointermove',showDay);chart.addEventListener('click',showDay);chart.addEventListener('pointerleave',()=>{$('#contribution-tooltip').hidden=true;graphSelection=null;drawContributions();});
chart.addEventListener('keydown',event=>{
  if(!contributions||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();let index=contributions.days.findIndex(d=>d.date===graphSelection);
  if(event.key==='Home')index=0;else if(event.key==='End')index=contributions.days.length-1;
  else index=Math.min(contributions.days.length-1,Math.max(0,index+(event.key==='ArrowRight'?1:-1)));
  describeDay(contributions.days[index]);
});
document.querySelectorAll('[data-chart-view]').forEach(button=>button.addEventListener('click',()=>{graphView=button.dataset.chartView;document.querySelectorAll('[data-chart-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));drawContributions();}));
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;document.querySelectorAll('#navigation a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));});},{rootMargin:'-10% 0px -65% 0px'});
document.querySelectorAll('main>section[id]').forEach(section=>observer.observe(section));
let worldData, worldZoom = 1;
function drawWorld(time=0,build=1){
  if(!worldData)return;
  const ctx=$('#world-canvas').getContext('2d');
  ctx.clearRect(0,0,1200,540);
  ctx.save();const focus=(worldZoom-1)/1.4;
  ctx.translate(600,270);ctx.scale(worldZoom,worldZoom);ctx.translate(-(600-118*focus),-(270+105*focus));
  worldData.cells.forEach(([x,y,br])=>{
    const growth=Math.min(1,Math.max(0,(build-x*.003)*1.45)),offset=(1-growth)*40;
    ctx.globalAlpha=growth*(br?.8+.2*Math.sin(time*1.1):1);
    ctx.fillStyle=br?'#78d99b':((x+y)%6===0?'#384431':'#232d20');ctx.fillRect(60+x*13,30+y*13-offset,10,10);
  });ctx.globalAlpha=1;
  ctx.fillStyle='#e18c71';ctx.fillRect(476,369,12,12);ctx.strokeStyle='#e18c71';ctx.lineWidth=2;ctx.strokeRect(469,362,26,26);
  if(time>0){const size=26+(time*.5%1)*46;ctx.globalAlpha=1-(time*.5%1);ctx.strokeRect(482-size/2,375-size/2,size,size);ctx.globalAlpha=1;}
  ctx.font='14px Silkscreen';ctx.fillStyle='#e6e7de';ctx.fillText('BR',505,382);
  ctx.restore();
}
fetch('assets/world-blocks.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{worldData=data;drawWorld();}).catch(()=>{$('#world-map').hidden=true;});
$('#world-map').addEventListener('click',()=>toast('João Monlevade, Minas Gerais. Meu ponto de partida para construir software e dados.'));
