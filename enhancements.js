/* CISSP Coach v2 — additional learning modes */
s.bookmarks ||= [];s.notes ||= {};s.exams ||= [];
let cardIndex=0,cardFlipped=false,cardPool=[];
const originalNav=nav,originalRender=render,originalStart=start,originalAnswer=answer,originalNext=nextQ;
nav=function(){originalNav();const t=$('tabs');for(const [id,label] of [['exam','Examen blanc'],['cards','Flashcards'],['notes','Notes']]){let b=document.createElement('button');b.className='tab '+(tab===id?'active':'');b.textContent=label;b.onclick=()=>go(id);t.appendChild(b)}};
render=function(){if(!session&&['exam','cards','notes'].includes(tab)){nav();$('today').textContent=new Intl.DateTimeFormat('fr-FR',{dateStyle:'long'}).format(new Date());if(tab==='exam')examMenu();if(tab==='cards')cardsMenu();if(tab==='notes')notesMenu();return}originalRender();if(session&&session.mode!=='oral'&&session.index<session.list.length){let q=session.list[session.index],target=document.querySelector('.qtext');if(target){let b=document.createElement('button');b.className='btn alt';b.textContent=s.bookmarks.includes(q.id)?'★ Retirer des favoris':'☆ À revoir';b.onclick=()=>toggleBookmark(q.id);target.after(b)}}};
function toggleBookmark(id){s.bookmarks=s.bookmarks.includes(id)?s.bookmarks.filter(x=>x!==id):[...s.bookmarks,id];save();render()}
function examMenu(){const last=s.exams.at(-1);$('content').innerHTML=`<div class="card"><h2>Examen blanc d'entraînement</h2><p class="muted">40 questions maximum issues de la banque existante. Il ne s'agit pas d'un examen officiel CISSP ni d'une simulation CAT.</p><div class="actions"><button class="btn" onclick="selectedDomain='all';start('exam')">Commencer l'examen</button></div>${last?`<p>Dernier résultat : ${last.score}/${last.total} (${Math.round(last.score/last.total*100)} %) — ${esc(last.day)}</p>`:''}</div><div class="section">Historique</div><div class="card">${s.exams.length?s.exams.slice(-10).reverse().map(x=>`<p>${esc(x.day)} : <strong>${x.score}/${x.total}</strong> · ${Math.round(x.seconds/60)} min</p>`).join(''):'Aucune tentative.'}</div>`}
start=function(mode){originalStart(mode);if(mode==='exam'&&session){session.list=[...items].sort(()=>Math.random()-.5).slice(0,Math.min(40,items.length));session.started=Date.now();session.saved=false;session.results=[];render()}};
answer=function(i){if(session&&session.answered===null){session.results ||= [];session.results.push({id:session.list[session.index].id,ok:i===session.list[session.index].answer})}originalAnswer(i)};
nextQ=function(){if(session&&session.mode==='exam'&&session.index===session.list.length-1&&!session.saved){s.exams.push({day:day(),score:session.correct,total:session.list.length,seconds:Math.round((Date.now()-session.started)/1000)});session.saved=true;save()}originalNext()};
function cardsMenu(){if(!cardPool.length)cardPool=items.filter(q=>s.bookmarks.includes(q.id)||(state(q).attempts&&due(q)));if(!cardPool.length)cardPool=[...items];cardIndex%=cardPool.length;let q=cardPool[cardIndex];$('content').innerHTML=`<div class="card"><div class="row"><h2>Flashcards</h2><span class="muted">${cardIndex+1} / ${cardPool.length}</span></div><p class="small muted">Réponds à voix haute avant de retourner la carte.</p><div class="question"><div class="eyebrow">D${q.domain} · ${esc(q.skill)}</div><div class="qtext">${esc(q.oral)}</div>${cardFlipped?`<div class="notice"><strong>Réponse de référence</strong><p>${esc(q.model)}</p></div>`:''}<div class="actions"><button class="btn" onclick="cardFlipped=!cardFlipped;render()">${cardFlipped?'Masquer':'Retourner'} la carte</button><button class="btn alt" onclick="toggleBookmark('${q.id}')">${s.bookmarks.includes(q.id)?'★ Favori':'☆ Favori'}</button><button class="btn alt" onclick="cardIndex++;cardFlipped=false;render()">Suivante →</button></div></div><div class="actions"><button class="btn alt" onclick="cardPool=[];cardIndex=0;cardFlipped=false;render()">Actualiser les cartes</button></div></div>`}
function notesMenu(){let qs=items.filter(q=>s.bookmarks.includes(q.id)||s.notes[q.id]);$('content').innerHTML=`<div class="card"><h2>Mes notes et favoris</h2><p class="muted">Sauvegardés localement et inclus dans l'export JSON.</p>${qs.length?qs.map(q=>`<div class="divider"></div><strong>D${q.domain} · ${esc(q.skill)}</strong><p class="small muted">${esc(q.question)}</p><textarea class="note" id="note-${q.id}" aria-label="Note pour ${esc(q.skill)}">${esc(s.notes[q.id]||'')}</textarea><div class="actions"><button class="btn alt" onclick="saveNote('${q.id}')">Enregistrer</button><button class="btn alt" onclick="toggleBookmark('${q.id}')">${s.bookmarks.includes(q.id)?'Retirer le favori':'Ajouter le favori'}</button></div>`).join(''):'Aucun favori. Marque une question pendant un QCM.'}</div>`}
function saveNote(id){let t=$('note-'+id).value.trim();if(t)s.notes[id]=t;else delete s.notes[id];save();alert('Note enregistrée')}
document.addEventListener('keydown',e=>{if(!session||e.target.matches('input,textarea,select'))return;if(session.answered===null&&session.mode!=='oral'&&['1','2','3','4'].includes(e.key)){let q=session.list[session.index];if(+e.key<=q.options.length)answer(+e.key-1)}else if(session.answered!==null&&session.mode!=='oral'&&e.key==='Enter')nextQ()});
render();


/* V3: deterministic, offline adaptive scheduling and conservative mastery */
const originalRecord=record;
record=function(q,ok,mode){
 let st=state(q), prior=st.seen||[],last=prior.at(-1),uniqueDays=new Set(prior.filter(x=>x.ok).map(x=>x.day));
 let repeatedToday=last&&last.day===day(),isSelf=mode==='auto-évaluation';
 let previousLevel=st.level||0,previousInterval=st.interval||0;
 originalRecord(q,ok,mode);
 st=state(q);
 // A single question is not proof of full mastery. Progress is capped by distinct days
 // and by type of evidence; self-assessment cannot establish independence.
 const evidenceDays=new Set(st.seen.filter(x=>x.ok&&x.mode!=='auto-évaluation').map(x=>x.day)).size;
 const successfulModes=new Set(st.seen.filter(x=>x.ok&&x.mode!=='auto-évaluation').map(x=>x.mode)).size;
 const cap=isSelf?Math.min(2,previousLevel):Math.min(4,Math.max(1,evidenceDays)+(successfulModes>=2?1:0));
 if(ok)st.level=Math.min(st.level,cap);
 if(!ok)st.level=Math.max(0,previousLevel-1);
 // SM-2-inspired intervals, using historical accuracy and recent misses.
 const attempts=st.attempts,accuracy=st.correct/Math.max(1,attempts);
 const ease=Math.max(1.3,Math.min(2.7,1.5+accuracy));
 if(!ok){st.interval=1;st.lapses=(st.lapses||0)+1}
 else if(repeatedToday){st.interval=Math.max(1,previousInterval||1)}
 else{st.interval=Math.min(90,previousInterval?Math.max(1,Math.round(previousInterval*ease)):1)}
 st.due=dateAdd(st.interval);
 st.lastMode=mode;
 save();
};
const originalStartV2=start;
start=function(mode){
 if(mode==='review'){
   const dueQs=items.filter(q=>state(q).attempts&&due(q));
   const newQs=items.filter(q=>!state(q).attempts);
   const score=q=>{
      const st=state(q),recent=(st.seen||[]).slice(-5);
      const misses=recent.filter(x=>!x.ok).length;
      const lateness=st.due?Math.max(0,Math.floor((new Date(day()+'T12:00:00')-new Date(st.due+'T12:00:00'))/86400000)):0;
      return 5*misses+Math.min(20,lateness)+2*(4-(st.level||0))+(s.bookmarks.includes(q.id)?3:0);
   };
   const ranked=dueQs.sort((a,b)=>score(b)-score(a));
   const fresh=newQs.sort(()=>Math.random()-.5).slice(0,Math.max(0,10-ranked.length));
   session={mode,list:[...ranked.slice(0,10),...fresh].slice(0,10),index:0,correct:0,answered:null,started:Date.now(),results:[]};
   if(!session.list.length){alert('Aucune révision échue. Choisis un domaine pour t’entraîner ou reviens demain.');session=null;return}
   render();return;
 }
 originalStartV2(mode);
};
const originalRenderSessionV3=renderSession;
renderSession=function(){
 if(!session)return '';
 if(session.mode==='exam'&&session.index<session.list.length){
   let q=session.list[session.index];
   let head=`<div class="row"><span class="eyebrow">Examen · Domaine ${q.domain}</span><span class="tag">${session.index+1} / ${session.list.length}</span></div>`;
   return `<div class="question">${head}<div class="qtext">${esc(q.question)}</div>${q.options.map((o,i)=>`<button class="option ${session.answered===i?'correct':''}" onclick="examAnswer(${i})"><strong>${'ABCD'[i]}.</strong> ${esc(o)}</button>`).join('')}<p class="small muted">Correction différée jusqu'à la fin de l'examen.</p></div>`;
 }
 if(session.mode==='exam'&&session.index>=session.list.length){
   if(!session.saved){s.exams.push({day:day(),score:session.correct,total:session.list.length,seconds:Math.round((Date.now()-session.started)/1000)});session.saved=true;save()}
   let wrong=(session.results||[]).filter(x=>!x.ok);
   return `<div class="card"><h2>Résultat de l'examen</h2><div class="qtext">${session.correct} / ${session.list.length} · ${Math.round(session.correct/session.list.length*100)} %</div><p class="muted">Simulation pédagogique, pas un score officiel ISC2.</p><h3>Corrections des erreurs (${wrong.length})</h3>${wrong.map(x=>{let q=items.find(y=>y.id===x.id);return `<div class="notice bad"><strong>D${q.domain} · ${esc(q.skill)}</strong><p>${esc(q.question)}</p><p><strong>Réponse : ${esc(q.options[q.answer])}</strong></p><p>${esc(q.why)}</p></div>`}).join('')||'<p>Aucune erreur.</p>'}<div class="actions"><button class="btn" onclick="go('dashboard')">Tableau de bord</button><button class="btn alt" onclick="go('progress')">Progression</button></div></div>`;
 }
 return originalRenderSessionV3();
};
function examAnswer(i){
 if(!session||session.mode!=='exam'||session.index>=session.list.length)return;
 const q=session.list[session.index],ok=i===q.answer;
 session.correct+=ok?1:0;
 session.results.push({id:q.id,ok,selected:i});
 record(q,ok,'exam');
 session.index++;
 session.answered=null;
 render();
}
const oldAnswerV3=answer;
answer=function(i){if(session?.mode==='exam')return examAnswer(i);return oldAnswerV3(i)};
const oldNextV3=nextQ;
nextQ=function(){if(session?.mode==='exam')return;return oldNextV3()};
const oldCardsMenuV3=cardsMenu;
cardsMenu=function(){
 oldCardsMenuV3();
 if(!cardFlipped)return;
 const node=document.querySelector('.question .actions');
 if(node){
   const bar=document.createElement('div');bar.className='actions';
   bar.innerHTML='<button class="btn alt" onclick="rateCard(false)">À revoir demain</button><button class="btn" onclick="rateCard(true)">Je savais</button>';
   node.after(bar);
 }
};
function rateCard(ok){if(!cardPool.length)return;record(cardPool[cardIndex],ok,'auto-évaluation');cardIndex=(cardIndex+1)%cardPool.length;cardFlipped=false;render()}
const oldImportV3=importProgress;
importProgress=function(input){
 let f=input.files?.[0];if(!f)return;
 if(f.size>2e6){alert('Fichier trop volumineux');return}
 let reader=new FileReader();
 reader.onload=()=>{try{
  let x=JSON.parse(reader.result),v=x.progress;
  if(x.version!==1||!v||!Array.isArray(v.history)||!v.skills||typeof v.skills!=='object'||Array.isArray(v.skills)||v.history.length>100000)throw Error('Format invalide');
  if(!confirm('Remplacer toutes les données locales par cet export ?'))return;
  s={skills:v.skills,history:v.history,streak:v.streak||{last:'',count:0},diagnosticDone:!!v.diagnosticDone,bookmarks:Array.isArray(v.bookmarks)?v.bookmarks:[],notes:v.notes&&typeof v.notes==='object'?v.notes:{},exams:Array.isArray(v.exams)?v.exams:[]};
  save();render();alert('Import terminé');
 }catch(e){alert('Import impossible : '+e.message)}};
 reader.readAsText(f);
};
const oldResetV3=resetProgress;
resetProgress=function(){if(confirm('Effacer toutes les données locales (y compris notes, examens et favoris) ?')){localStorage.removeItem(KEY);s={skills:{},history:[],streak:{last:'',count:0},diagnosticDone:false,bookmarks:[],notes:{},exams:[]};cardPool=[];go('dashboard')}};
