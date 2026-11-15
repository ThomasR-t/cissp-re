/* Standalone programme mapping. Explicit coverage and readiness must not be conflated. */
(function(){
const objectives=window.CISSP_SYLLABUS;
const prevNav=nav,prevRender=render,prevExamMenu=examMenu,prevStart=start;
let domainFilter=1,term='';
const related=id=>items.filter(q=>q.objective===id);
const status=o=>{
 const qs=related(o.id),scenarios=qs.filter(q=>q.type==='scenario');
 const tried=qs.filter(q=>state(q).attempts>0),independent=tried.filter(q=>{
  let st=state(q),days=new Set((st.seen||[]).filter(x=>x.ok&&x.mode!=='auto-évaluation').map(x=>x.day));return days.size>=2 && st.level>=2;
 });
 return {qs,scenarios,tried,independent,covered:qs.length>=2&&scenarios.length>=1,mastered:qs.length>=2&&scenarios.length>=1&&independent.length>=2&&independent.some(q=>q.type==='scenario')};
};
const summary=()=>{let covered=objectives.filter(o=>status(o).covered).length,mastered=objectives.filter(o=>status(o).mastered).length;return {covered,mastered,total:objectives.length}};
nav=function(){prevNav();let el=$('tabs');if(!el.querySelector('[data-programme]'))el.insertAdjacentHTML('beforeend',`<button class="tab ${tab==='programme'?'active':''}" data-programme onclick="go('programme')">Référentiel & lacunes</button>`)};
render=function(){prevRender();if(!session&&tab==='programme')showProgramme()};
function showProgramme(){
 let ss=summary(),objs=objectives.filter(o=>o.domain===domainFilter && (!term||`${o.id} ${o.title}`.toLowerCase().includes(term.toLowerCase())));
 $('content').innerHTML=`<div class="card"><h2>Référentiel CISSP 2024 — couverture vérifiable</h2><p class="muted">Les ${objectives.length} lignes représentent des objectifs principaux du programme 2024. Les libellés sont reformulés. Une notion n'est considérée « couverte » ici que si elle dispose d'au moins 2 questions distinctes dont un scénario. C'est un seuil interne, <strong>pas une validation officielle</strong>. Certaines correspondances sont indicatives et demandent une revue éditoriale.</p><div class="grid"><div class="metric"><strong>${ss.covered}/${ss.total}</strong><small>Objectifs suffisamment exercés selon le seuil interne</small></div><div class="metric"><strong>${ss.mastered}/${ss.total}</strong><small>Objectifs maîtrisés sur plusieurs jours</small></div><div class="metric"><strong>${items.filter(q=>q.type==='scenario').length}</strong><small>Scénarios professionnels</small></div><div class="metric"><strong>${items.length}</strong><small>Questions totales</small></div></div><p class="muted small">Pour 2027 et après : une nouvelle version du programme CISSP entre en vigueur le 15 avril 2027. Vérifier le référentiel applicable avant l'inscription.</p><div class="actions"><select onchange="programmeDomain(this.value)">${domains.map(d=>`<option value="${d}" ${d===domainFilter?'selected':''}>D${d} · ${esc(domNames[d])}</option>`).join('')}</select><input value="${esc(term)}" oninput="programmeSearch(this.value)" placeholder="Chercher un objectif" style="background:var(--panel2);color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:10px;max-width:100%"></div></div><div class="section">Objectifs du domaine ${domainFilter}</div>${objs.map(o=>{
 let st=status(o),tag=st.mastered?'Maîtrisé':st.covered?'Exercices disponibles':st.qs.length?'Couverture partielle':'À développer';
 let relatedTopics=[...new Set(st.qs.map(q=>q.skill))].slice(0,8);
 return `<details class="card" style="margin-bottom:10px"><summary style="cursor:pointer"><strong>${o.id} · ${esc(o.title)}</strong> <span class="muted small">— ${tag} (${st.qs.length} questions, ${st.scenarios.length} cas)</span></summary><p class="muted small">Notions reliées : ${relatedTopics.map(esc).join(' · ')||'aucune question associée'}</p>${st.qs.length?`<div class="actions"><button class="btn" onclick="programmePractice('${o.id}')">Travailler cet objectif</button></div>`:'<p class="warning">Objectif insuffisamment traité : ne pas le considérer acquis.</p>'}</details>`}).join('')}</div>`;
}
window.programmeDomain=x=>{domainFilter=+x;term='';showProgramme()};
window.programmeSearch=x=>{term=x;showProgramme()};
window.programmePractice=id=>{
 let qs=related(id),seen=qs.filter(q=>state(q).attempts),fresh=qs.filter(q=>!state(q).attempts);
 let order=[...fresh,...seen.sort((a,b)=>(state(a).level||0)-(state(b).level||0))];
 if(!order.length)return;
 session={mode:'quiz',list:order.slice(0,15),index:0,correct:0,answered:null,results:[]};render();
};
examMenu=function(){prevExamMenu();let el=$('content');let card=el.querySelector('.card');if(card){card.querySelector('p.muted').textContent='Simulation d’entraînement de 100 questions, avec correction différée. Ce n’est pas un examen CAT officiel ISC2. Durée cible : 3 heures.';let button=card.querySelector('button.btn');if(button)button.textContent='Démarrer 100 questions';}}
start=function(mode){prevStart(mode);if(mode==='exam'&&session){
 // Distribute questions approximately by published 2024 domain weights, with no duplicates.
 const weights={1:16,2:10,3:13,4:13,5:13,6:12,7:13,8:10};let pool=[];
 for(let d=1;d<=8;d++){let qs=items.filter(q=>q.domain===d);for(let i=qs.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[qs[i],qs[j]]=[qs[j],qs[i]]}pool.push(...qs.slice(0,weights[d]));}
 for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
 session.list=pool;session.started=Date.now();session.saved=false;session.results=[];render();
 }};
// Warn before leaving an unfinished exam. No network calls.
const prevGo=go;
go=function(next){if(session?.mode==='exam'&&session.index<session.list.length&&!confirm('Quitter cet examen en cours ? Les réponses non terminées seront perdues.'))return;prevGo(next)};
render();
})();
