const STORAGE_KEY = 'reesha.local-learners.v1';
const MAX_EVENTS = 1800;
const MAX_MISTAKES_PER_SKILL = 8;
const MAX_LEARNERS = 12;

function freshProfile(name='متعلم جديد',mode='child') {
  return {version:1,id:`learner-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),mode,attempts:[],skills:{},lessons:{}};
}

function cleanProfile(value) {
  if(!value || typeof value!=='object' || value.version!==1 || !value.skills || !value.lessons) return null;
  const clean=freshProfile(typeof value.name==='string'?value.name.slice(0,40):'متعلم جديد',value.mode==='elder'?'elder':'child');
  clean.id=typeof value.id==='string'?value.id:clean.id;
  clean.createdAt=typeof value.createdAt==='string'?value.createdAt:clean.createdAt;
  clean.updatedAt=typeof value.updatedAt==='string'?value.updatedAt:clean.updatedAt;
  clean.attempts=Array.isArray(value.attempts)?value.attempts.filter(row=>row&&typeof row==='object').slice(-MAX_EVENTS):[];
  clean.skills=Object.fromEntries(Object.entries(value.skills).filter(([,row])=>row&&typeof row==='object').slice(0,1500));
  clean.lessons=Object.fromEntries(Object.entries(value.lessons).filter(([,row])=>row&&typeof row==='object').slice(0,1000));
  return clean;
}

let learners={};
let activeLearnerId='';
let storageAvailable=true;
try {
  const saved=localStorage.getItem(STORAGE_KEY);
  const data=saved?JSON.parse(saved):null;
  if(data?.version===1&&data.learners&&typeof data.learners==='object') {
    for(const [id,value] of Object.entries(data.learners)) {
      const clean=cleanProfile(value);
      if(clean) learners[id]=clean;
    }
    activeLearnerId=typeof data.activeLearnerId==='string'?data.activeLearnerId:'';
  }
  if(!Object.keys(learners).length) {
    const first=freshProfile('المتعلم ١');
    learners[first.id]=first;
    activeLearnerId=first.id;
  }
  if(!learners[activeLearnerId]) activeLearnerId=Object.keys(learners)[0];
  localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,activeLearnerId,learners}));
} catch {
  const first=freshProfile('المتعلم ١');
  learners={[first.id]:first};
  activeLearnerId=first.id;
  storageAvailable=false;
}

let profile=learners[activeLearnerId];

function persist() {
  profile.updatedAt=new Date().toISOString();
  learners[activeLearnerId]=profile;
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,activeLearnerId,learners})); storageAvailable=true; }
  catch { storageAvailable=false; }
  return storageAvailable;
}

function normalAnswer(value='') {
  return String(value).toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[.,!?;:،؛؟()[\]{}"“”‘’]/g,' ').replace(/\s+/g,' ').trim();
}

function recompute(row) {
  const accuracy=row.attempts?row.correct/row.attempts:0;
  const confidence=Math.min(1,row.attempts/3);
  const consistency=Math.min(1,row.streak/3);
  row.mastery=Math.round(100*(accuracy*.7+consistency*.3)*confidence);
  row.mastered=row.attempts>=3 && row.mastery>=80;
}

export function getProfile() { return profile; }
export function getLearners() { return Object.values(learners).map(({id,name,mode,createdAt})=>({id,name,mode,createdAt})); }
export function getActiveLearnerId() { return activeLearnerId; }
export function hasPersistentStorage() { return storageAvailable; }
export function setLearnerMode(mode) { profile.mode=mode==='elder'?'elder':'child'; return persist(); }

export function selectLearner(id) {
  if(!learners[id]) return false;
  persist();
  activeLearnerId=id;
  profile=learners[id];
  return persist();
}

export function createLearner(name='') {
  const cleanName=String(name||'').trim().replace(/[<>"']/g,'').slice(0,40)||`المتعلم ${Object.keys(learners).length+1}`;
  if(Object.keys(learners).length>=MAX_LEARNERS) return {ok:false,reason:'maximum'};
  const next=freshProfile(cleanName);
  learners[next.id]=next;
  activeLearnerId=next.id;
  profile=next;
  persist();
  return {ok:true,learner:next};
}

export function removeActiveLearner() {
  if(Object.keys(learners).length<=1) return false;
  delete learners[activeLearnerId];
  activeLearnerId=Object.keys(learners)[0];
  profile=learners[activeLearnerId];
  persist();
  return true;
}

export function recordAttempt({concept,skill,correct,answer='',expected='',lessonId='',unitId='',source='lesson'}) {
  const key=`${concept}::${skill}`;
  const now=new Date();
  const row=profile.skills[key]||{concept,skill,attempts:0,correct:0,wrong:0,streak:0,bestStreak:0,mastery:0,mastered:false,firstSeen:now.toISOString(),lastSeen:null,dueAt:null,mistakes:[]};
  row.attempts+=1;
  row.lastSeen=now.toISOString();
  if(correct) {
    row.correct+=1;
    row.streak+=1;
    row.bestStreak=Math.max(row.bestStreak,row.streak);
    const dueHours=row.mastery>=80?72:row.mastery>=55?24:6;
    row.dueAt=new Date(now.getTime()+dueHours*3600000).toISOString();
  } else {
    row.wrong+=1;
    row.streak=0;
    row.lastWrong=now.toISOString();
    row.lastWrongAnswer=normalAnswer(answer).slice(0,80);
    row.expected=normalAnswer(expected).slice(0,80);
    row.dueAt=new Date(now.getTime()+15*60000).toISOString();
    row.mistakes.push({at:now.toISOString(),answer:row.lastWrongAnswer,expected:row.expected,lessonId});
    row.mistakes=row.mistakes.slice(-MAX_MISTAKES_PER_SKILL);
  }
  recompute(row);
  profile.skills[key]=row;
  profile.attempts.push({at:now.toISOString(),concept,skill,correct:Boolean(correct),lessonId,unitId,source});
  profile.attempts=profile.attempts.slice(-MAX_EVENTS);
  persist();
  return row;
}

export function markLessonCompleted(lessonId) {
  const current=profile.lessons[lessonId]||{visits:0,completed:false};
  current.visits+=1;
  current.completed=true;
  current.completedAt=new Date().toISOString();
  profile.lessons[lessonId]=current;
  return persist();
}

export function markLessonOpened(lessonId) {
  const current=profile.lessons[lessonId]||{visits:0,completed:false};
  current.visits+=1;
  current.lastOpenedAt=new Date().toISOString();
  profile.lessons[lessonId]=current;
  return persist();
}

export function isAnswerCorrect(answer,expected,{ignoreCase=true}={}) {
  const a=normalAnswer(answer),e=normalAnswer(expected);
  return Boolean(a&&e&&(ignoreCase?a===e:String(answer).trim()===String(expected).trim()));
}

export function lessonMastery(lesson) {
  const concepts=lesson.concepts||[`lesson:${lesson.id}`];
  const relevant=Object.values(profile.skills).filter(row=>concepts.includes(row.concept));
  if(!relevant.length) return 0;
  return Math.round(relevant.reduce((total,row)=>total+row.mastery,0)/relevant.length);
}

export function lessonCompleted(lessonId) { return Boolean(profile.lessons[lessonId]?.completed); }

function lessonPressure(lesson) {
  const concepts=lesson.concepts||[`lesson:${lesson.id}`];
  const rows=Object.values(profile.skills).filter(row=>concepts.includes(row.concept));
  if(!rows.length) return {value:lessonCompleted(lesson.id)?100:0,rows:[]};
  const avg=rows.reduce((sum,row)=>sum+row.mastery,0)/rows.length;
  const due=rows.filter(row=>row.dueAt&&Date.parse(row.dueAt)<=Date.now()).length;
  const mistakes=rows.reduce((sum,row)=>sum+row.wrong,0);
  return {value:avg-due*18-Math.min(24,mistakes*2)+(lessonCompleted(lesson.id)?6:0),rows};
}

export function recommendLesson(lessons) {
  if(!lessons.length) return null;
  const scored=lessons.map((lesson,index)=>({lesson,index,...lessonPressure(lesson)}));
  const active=scored.filter(item=>item.rows.length && item.rows.some(row=>row.dueAt&&Date.parse(row.dueAt)<=Date.now()&&row.mastery<100));
  if(active.length) return active.sort((a,b)=>a.value-b.value||a.index-b.index)[0].lesson;
  const learning=scored.filter(item=>item.value<82);
  if(learning.length) return learning.sort((a,b)=>a.value-b.value||a.index-b.index)[0].lesson;
  return scored.find(item=>!lessonCompleted(item.lesson.id))?.lesson||scored.sort((a,b)=>a.value-b.value||a.index-b.index)[0].lesson;
}

export function getLearningSummary(lessons) {
  const states=Object.values(profile.skills);
  const wrong=states.reduce((sum,row)=>sum+row.wrong,0);
  const mastered=states.filter(row=>row.mastered).length;
  const weak=states.filter(row=>row.attempts&&row.mastery<70).sort((a,b)=>a.mastery-b.mastery||b.wrong-a.wrong).slice(0,4);
  const overdue=states.filter(row=>row.dueAt&&Date.parse(row.dueAt)<=Date.now()&&row.mastery<100).sort((a,b)=>a.mastery-b.mastery).slice(0,8);
  const next=recommendLesson(lessons);
  return {attempts:states.reduce((sum,row)=>sum+row.attempts,0),wrong,mastered,weak,overdue,next,lessonsCompleted:Object.values(profile.lessons).filter(row=>row.completed).length,totalLessons:lessons.length};
}

export function exportProfile() {
  return {product:'Reesha',formatVersion:1,exportedAt:new Date().toISOString(),profile};
}

export function importProfile(payload) {
  const candidate=cleanProfile(payload?.profile);
  if(payload?.product!=='Reesha'||payload?.formatVersion!==1||!candidate) return false;
  const baseName=candidate.name;
  if(Object.keys(learners).length>=MAX_LEARNERS) return false;
  if(Object.values(learners).some(item=>item.name===candidate.name)) candidate.name=`${baseName} · نسخة`;
  candidate.id=`learner-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  candidate.name=candidate.name.slice(0,40);
  learners[candidate.id]=candidate;
  activeLearnerId=candidate.id;
  profile=candidate;
  return persist();
}

export function clearProfile() {
  const name=profile.name,mode=profile.mode,id=profile.id;
  profile=freshProfile(name,mode);
  profile.id=id;
  persist();
  return profile;
}
