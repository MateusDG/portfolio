// One visibility-aware animation loop, shared by the original pixel scenes.
// Historical data is unchanged; animation only assembles its visual blocks.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let motionEnabled = !motionPreference.matches;
try { motionEnabled = motionEnabled && localStorage.getItem('portfolio-motion') !== 'off'; } catch { /* Storage is optional. */ }
const motionToggle = $('#motion-toggle');
const jobs = new Map();
let frameId = 0, previousFrame = 0, motionTime = 0, previousPaint = 0;
let cityVersion = 0, heroBuildStart = 0, jumpStart = -10;
let chartBuildStart = null;
let worldZoomTarget = 1;

function updateMotionState() {
  document.body.classList.toggle('motion-active', motionEnabled);
  document.body.classList.toggle('motion-paused', !motionEnabled);
  motionToggle.setAttribute('aria-pressed', String(motionEnabled));
  motionToggle.querySelector('span').textContent = motionEnabled ? 'Movimento on' : 'Movimento off';
  motionToggle.disabled = motionPreference.matches;
  motionToggle.title = motionPreference.matches ? 'Seu dispositivo prefere movimento reduzido.' : 'Ativar ou pausar as animações';
  if (!motionEnabled) {
    cancelAnimationFrame(frameId); frameId = 0; previousFrame = 0;
    jobs.forEach(job => job.draw(0, 1));
    hideIntro();
  } else startLoop();
}
motionToggle.addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  try { localStorage.setItem('portfolio-motion', motionEnabled ? 'on' : 'off'); } catch { /* Optional. */ }
  updateMotionState();
});
motionPreference.addEventListener('change', () => {
  motionEnabled = !motionPreference.matches;
  try { if (localStorage.getItem('portfolio-motion') === 'off') motionEnabled = false; } catch { /* Optional. */ }
  updateMotionState();
});

// Build the title with real, accessible text rather than a rasterized heading.
const title = $('#hero-title'), titleText = 'Mateus Diniz';
title.setAttribute('aria-label', titleText);
title.replaceChildren();
[...titleText].forEach((letter, index) => {
  const span = document.createElement('span'); span.className = 'hero-letter';
  span.textContent = letter; span.style.setProperty('--letter', index); span.setAttribute('aria-hidden', 'true'); title.append(span);
});
const titleCursor = document.createElement('span'); titleCursor.className = 'cursor'; titleCursor.textContent = '_'; titleCursor.setAttribute('aria-hidden', 'true'); title.append(titleCursor);

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
  });
}, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.section-heading,.featured-project,.more-projects-heading,.project-row,.player-card,.log-entry,.world-layout,.terminal').forEach((element,index) => {
  element.classList.add('reveal'); element.style.setProperty('--reveal-delay', `${element.classList.contains('featured-project') ? (index % 2) * 90 : 0}ms`); revealObserver.observe(element);
});
document.querySelectorAll('.section-heading .index').forEach(label => {
  const sprite = document.createElement('span'); sprite.className = 'section-sprite'; sprite.setAttribute('aria-hidden','true');
  sprite.innerHTML = $('#hero-character svg').outerHTML; label.append(sprite);
});

function pixelSprite(ctx, x, y, color, scale = 3, time = 0) {
  ctx.fillStyle = color;
  ctx.fillRect(x+3*scale,y,10*scale,2*scale);ctx.fillRect(x,y+2*scale,16*scale,5*scale);
  ctx.fillRect(x+2*scale,y+7*scale,12*scale,2*scale);
  const step = Math.floor(time*3)%2;
  ctx.fillRect(x+(4+step)*scale,y+9*scale,2*scale,2*scale);ctx.fillRect(x+(10-step)*scale,y+9*scale,2*scale,2*scale);
  ctx.fillStyle = '#152014';ctx.fillRect(x+4*scale,y+3*scale,2*scale,3*scale);ctx.fillRect(x+10*scale,y+3*scale,2*scale,3*scale);
}

function drawCity(ctx, width, height, time, build, version = 0) {
  ctx.clearRect(0,0,width,height);
  const scale = width/720;ctx.save();ctx.scale(scale,scale);
  const ox=340,oy=196,w=22;
  for(let z=0;z<9;z++)for(let x=0;x<12;x++){
    const delay=(x+z)*.025,growth=Math.min(1,Math.max(0,(build-delay)*1.7));
    const px=ox+(x-z)*w,py=oy+(x+z)*w*.5;
    cube(ctx,px,py-(1-growth)*45,w-1,4,growth>.5?'#283224':'#1a2318','#0f180d','#1c2818');
  }
  const palettes=[['#7de2a3','#2d6140','#4c9a64'],['#eaa385','#824a39','#b57558'],['#b8a0d5','#514360','#81659b']];
  const buildings = [[3,3,110],[7,3,175],[8,6,92]];
  buildings.forEach(([x,z,h],i)=>{
    const growth=Math.min(1,Math.max(0,(build-i*.12)*1.6)),lift=1-Math.pow(1-growth,3);
    h=(h+version*9)*lift;const px=ox+(x-z)*w,py=oy+(x+z)*w*.5;
    cube(ctx,px,py,30,h,...palettes[(i+version)%3]);
    for(let k=0;k<6;k++){
      if(40+k*19>h+10)continue;
      ctx.globalAlpha=.45+.35*Math.sin(time*.9+i+k);ctx.fillStyle='#e3e9c2';
      ctx.fillRect(px+8,py-h+39+k*19,6,4);ctx.fillRect(px-20,py-h+31+k*19,6,4);ctx.globalAlpha=1;
    }
  });
  for(let i=0;i<4;i++){
    const travel=(time*.11+i/4)%1,px=145+travel*420,py=420-Math.sin(travel*Math.PI)*35;
    ctx.globalAlpha=.45;ctx.fillStyle=palettes[i%3][0];ctx.fillRect(px,py,5,5);ctx.globalAlpha=1;
  }
  if(build>.8){pixelSprite(ctx,246+Math.sin(time*.42)*22,330,'#e18c71',2,time);pixelSprite(ctx,447+Math.sin(time*.32+2)*18,344,'#8acbd4',2,time+1);}
  ctx.restore();
}
function drawHeroScene(time, progress) {
  const rebuild = motionEnabled ? Math.min(progress, Math.max(0,(motionTime-heroBuildStart)/1.5)) : 1;
  const ctx=$('#hero-canvas').getContext('2d');drawCity(ctx,720,480,time,rebuild,cityVersion);
  const character=$('#hero-character');
  if(!character.matches(':hover,:focus-visible') && motionEnabled) character.style.setProperty('--walk', `${Math.sin(time*.32)*Math.min(105,$('.hero').clientWidth*.12)}px`);
  const jump=(motionTime-jumpStart)/.75;
  character.style.setProperty('--jump', `${jump>=0 && jump<1 ? -Math.sin(jump*Math.PI)*55 : 0}px`);
}

function burst(element, amount = 14) {
  if(!motionEnabled)return;
  const rect=element.getBoundingClientRect();
  for(let i=0;i<amount;i++){
    const particle=document.createElement('i');particle.className='pixel-particle';particle.setAttribute('aria-hidden','true');
    const angle=i/amount*Math.PI*2,distance=35+(i%4)*17;
    particle.style.left=`${rect.left+rect.width/2}px`;particle.style.top=`${rect.top+rect.height/2}px`;
    particle.style.background=['#70da96','#e18c71','#c2add9'][i%3];
    particle.style.setProperty('--burst-x',`${Math.cos(angle)*distance}px`);particle.style.setProperty('--burst-y',`${Math.sin(angle)*distance-25}px`);
    document.body.append(particle);particle.addEventListener('animationend',()=>particle.remove(),{once:true});setTimeout(()=>particle.remove(),1100);
  }
}
$('#hero-world').addEventListener('click',()=>{
  cityVersion=(cityVersion+1)%3;heroBuildStart=motionTime;
  $('#hero-world-label').textContent=['Software','Dados','Pesquisa'][cityVersion];
  burst($('#hero-world'),12);
  if(!motionEnabled)drawCity($('#hero-canvas').getContext('2d'),720,480,0,1,cityVersion);
  startLoop();
});
function jumpCharacter(){jumpStart=motionTime;const sprite=$('#hero-character');sprite.classList.remove('is-jumping');void sprite.offsetWidth;sprite.classList.add('is-jumping');burst(sprite);startLoop();}
$('#hero-character').addEventListener('click',jumpCharacter);
$('#hero-character').addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();const previous=parseFloat(event.currentTarget.style.getPropertyValue('--walk'))||0;event.currentTarget.style.setProperty('--walk',`${Math.max(-100,Math.min(100,previous+(event.key==='ArrowRight'?20:-20)))}px`);}});
$('#world-map').addEventListener('click',()=>{
  worldZoomTarget=worldZoomTarget===1?2.4:1;
  $('#world-map').setAttribute('aria-pressed',String(worldZoomTarget>1));
  $('#map-hint').textContent=worldZoomTarget>1?'↙ Voltar ao mundo':'Ampliar o Brasil ↗';
  if(!motionEnabled){worldZoom=worldZoomTarget;drawWorld(0,1);}
  burst($('#world-map'),12);startLoop();
});

// Parallax stays inside each illustration and never changes reading geometry.
document.querySelectorAll('.project-art,.hero-world').forEach(scene=>{
  scene.addEventListener('pointermove',event=>{
    if(!motionEnabled || event.pointerType!=='mouse')return;
    const rect=scene.getBoundingClientRect();scene.style.setProperty('--scene-x',`${((event.clientX-rect.left)/rect.width-.5)*16}px`);scene.style.setProperty('--scene-y',`${((event.clientY-rect.top)/rect.height-.5)*12}px`);
  });
  scene.addEventListener('pointerleave',()=>{scene.style.setProperty('--scene-x','0px');scene.style.setProperty('--scene-y','0px');});
});

const visibilityObserver = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    const job=jobs.get(entry.target);if(!job)return;
    job.visible=entry.isIntersecting;
    if(job.visible && job.started===null)job.started=motionTime;
  });startLoop();
},{threshold:.04});
function registerScene(selector,draw,continuous=true){
  const element=$(selector);jobs.set(element,{draw,continuous,visible:false,started:null,lastBuild:-1});visibilityObserver.observe(element);draw(0,1);
}
function startLoop(){if(frameId||!motionEnabled||document.hidden)return;previousFrame=0;frameId=requestAnimationFrame(animateScenes);}
function animateScenes(now){
  frameId=0;if(!motionEnabled||document.hidden||document.body.classList.contains('modal-open')){previousFrame=0;return;}
  if(previousFrame)motionTime+=Math.min((now-previousFrame)/1000,.1);previousFrame=now;
  if(now-previousPaint>=32){
    previousPaint=now;
    jobs.forEach(job=>{
      if(!job.visible)return;
      let progress=Math.min(1,(motionTime-(job.started??motionTime))/1.6);
      if(job===jobs.get(chart) && chartBuildStart!==null)progress=Math.min(1,(motionTime-chartBuildStart)/1.6);
      if(job.continuous||progress<1||job.lastBuild<1){job.draw(motionTime,progress);job.lastBuild=progress;}
    });
    if(!$('.intro').classList.contains('is-hidden'))drawCity($('#intro-canvas').getContext('2d'),900,480,motionTime,Math.min(1,motionTime/1.5),0);
  }
  const hasVisible=[...jobs.values()].some(job=>job.visible&&(job.continuous||job.lastBuild<1));
  if(hasVisible||!$('.intro').classList.contains('is-hidden'))frameId=requestAnimationFrame(animateScenes);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;previousFrame=0;}else startLoop();});
dialog.addEventListener('close',startLoop);
$('#rebuild-chart').addEventListener('click',()=>{
  chartBuildStart=motionTime;const job=jobs.get(chart);if(job)job.lastBuild=0;
  if(graphView==='2d'){$('[data-chart-view="3d"]').click();}
  if(motionEnabled)startLoop();else drawContributions();
});
let scrollTick = false;
function updateScrollProgress(){const total=document.documentElement.scrollHeight-innerHeight;$('.scroll-progress i').style.transform=`scaleX(${total>0?Math.min(1,scrollY/total):0})`;scrollTick=false;}
window.addEventListener('scroll',()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(updateScrollProgress);}},{passive:true});
window.addEventListener('resize',updateScrollProgress,{passive:true});updateScrollProgress();
document.fonts.ready.then(()=>{
  registerScene('#hero-canvas',drawHeroScene);
  registerScene('#banvic-art',(time,build)=>drawBanvic(time,build));
  registerScene('#fuzzy-art',(time,build)=>drawFuzzy(time,build));
  registerScene('#contribution-canvas',(_time,build)=>drawContributions(build),false);
  registerScene('#world-canvas',(time,build)=>{worldZoom=motionEnabled?worldZoom+(worldZoomTarget-worldZoom)*.16:worldZoomTarget;drawWorld(time,build);});
  updateMotionState();
});
updateMotionState();
