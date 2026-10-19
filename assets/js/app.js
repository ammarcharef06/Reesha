import {units,lessons,curriculumStats} from './lessons.js';
import {entries,objectLabels,explainText,lookup,lookupPhrase,suggest,answerQuestion,normalize,tokenize} from './lexicon.js';
import {getProfile,getLearners,getActiveLearnerId,hasPersistentStorage,setLearnerMode,selectLearner,createLearner,removeActiveLearner,recordAttempt,markLessonCompleted,markLessonOpened,lessonMastery,lessonCompleted,recommendLesson,getLearningSummary,exportProfile,importProfile,clearProfile,isAnswerCorrect} from './mastery.js';
import {LiveSpeech} from './live-speech.js';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const number=value=>new Intl.NumberFormat('ar').format(value);
const state={page:'home',unit:'for-you',lesson:null,scanMode:'both',direction:'en-ar',stream:null,sessionActive:false,facing:'environment',model:null,modelPromise:null,detectTimer:null,detecting:false,visionBusy:false,visionTurn:'objects',lastNarrated:'',worker:null,workerPromise:null,ocrBusy:false,speech:null,speechReady:false,listening:false,armed:false,speaking:false,speechToken:0,manualText:false,objectEntries:[],ocrEntries:[],ocrText:'',contextEntries:[],toastTimer:null};
const byId=id=>document.getElementById(id);
const modeSelect=byId('learnerMode');
const profileSelect=byId('learnerProfile');

function escapeHTML(value='') { return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function notify(message) {
  const toast=byId('toast');if(!toast)return;
  toast.textContent=message;toast.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>toast.classList.remove('show'),3000);
}
function syncLearnerControls() {
  const learners=getLearners(),active=getActiveLearnerId(),profile=getProfile();
  profileSelect.innerHTML=learners.map(item=>`<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join('');
  profileSelect.value=active;
  modeSelect.value=profile.mode||'child';
  document.documentElement.dataset.learner=modeSelect.value;
}
function switchPage(page) {
  if(!document.querySelector(`[data-view="${page}"]`))page='home';
  if(state.page==='camera'&&page!=='camera')stopCamera();
  if(page!=='camera')stopListening();
  state.page=page;
  $$('.page').forEach(section=>{section.hidden=section.dataset.view!==page;});
  $$('.nav-item').forEach(button=>{const active=button.dataset.page===page;button.classList.toggle('is-active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  if(location.hash!==`#${page}`)history.replaceState(null,'',`#${page}`);
  if(page==='learn')renderLessons();
  if(page==='camera'&&byId('cameraStatus'))byId('cameraStatus').textContent='اختر وضعاً، ثم افتح الكاميرا. يمكنك أيضاً اختيار صورة من جهازك.';
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}

function getConceptLabel(concept) {
  const [kind,id]=String(concept||'').split(':');
  if(kind==='word')return `كلمة ${entries.get(id)?.ar||id}`;
  if(kind==='letter')return `الحرف ${id?.toUpperCase()}`;
  if(kind==='sound')return `نمط الصوت ${id}`;
  if(kind==='grammar')return `قاعدة ${id?.replaceAll('-',' ')}`;
  const lesson=lessons.find(item=>item.id===id);
  return lesson?lesson.title:(id||concept);
}
function lessonForConcept(concept) { return lessons.find(item=>(item.concepts||[]).includes(concept))||null; }
function ensureWordLesson(word) {
  const key=normalize(word),entry=entries.get(key);
  if(!entry)return lessonForConcept(`word:${key}`);
  const concept=`word:${key}`,existing=lessonForConcept(concept);if(existing)return existing;
  const distractor=[...entries.values()].find(item=>item.en!==key&&normalize(item.ar)!==normalize(entry.ar));
  const lesson={id:`camera-word-${key.replace(/[^a-z0-9-]/g,'-')}`,unit:'word-garden',icon:'🔎',title:`كلمة اكتشفتها: ${key}`,stage:'مفرداتك من العدسة',goal:`أفهم معنى ${key} وأسترجع كتابتها.`,teach:`${key} تعني «${entry.ar}». ${entry.ex||''} اربطها بشيء أو موقف تعرفه.`,example:`${key} · ${entry.ex||key}`,meaning:`${entry.ar} · ${entry.exAr||''}`,speak:`${key}. ${entry.ar}. ${entry.ex||''}`,question:`ما معنى ${key}؟`,choices:[entry.ar,distractor?.ar||'لا أعرف بعد'],answer:0,write:`غطِّ المثال واكتب الكلمة الإنجليزية التي تعني «${entry.ar}».`,recallPrompt:`اكتب الكلمة الإنجليزية التي تعني «${entry.ar}».`,expected:key,paper:`اكتب ${key} وارسم معناها.`,concepts:[concept],questionSkill:'meaning',writeSkill:'spelling',hideModelForRecall:true};
  lessons.push(lesson);return lesson;
}
function restorePracticedWordLessons() {
  const words=new Set(Object.values(getProfile().skills).map(row=>row.concept).filter(value=>value?.startsWith('word:')).map(value=>value.slice(5)));
  words.forEach(ensureWordLesson);
}
function renderProfile() {
  const summary=getLearningSummary(lessons),total=summary.totalLessons,completed=summary.lessonsCompleted;
  const percent=total?Math.round(completed/total*100):0;
  byId('progressLabel').textContent=`${number(percent)}٪`;
  byId('progressFill').style.width=`${percent}%`;
  byId('progressBar').setAttribute('aria-valuenow',String(percent));
  byId('progressNote').textContent=completed?`أنجزت ${number(completed)} من ${number(total)} درساً. الإتقان يُحسب من محاولاتك المتكررة، ويمكنك اختيار أي درس.`:`ابدأ من أي درس. يقترح المنهج مراجعةً جديدة بعد أن يرى محاولاتك.`;
  byId('attemptCount').textContent=number(summary.attempts);
  byId('mistakeCount').textContent=number(summary.wrong);
  byId('masteredCount').textContent=number(summary.mastered);
  byId('courseCount').textContent=`${number(total)} درساً تأسيسياً تفاعلياً ←`;
  const next=summary.next;
  if(next) {
    byId('nextLessonTitle').textContent=`${next.icon} ${next.title}`;
    const related=(next.concepts||[]).flatMap(concept=>Object.values(getProfile().skills).filter(row=>row.concept===concept));
    const miss=related.find(row=>row.lastWrongAnswer);
    byId('nextLessonReason').textContent=miss?`اخترنا هذا التدريب لأننا سنراجع «${getConceptLabel(miss.concept)}» ونتمرن على تذكّرها.`:lessonCompleted(next.id)?'نعود إلى مهارة تحتاج إلى تثبيت بعد مراجعة الدروس التي تعلمتها.':'نبدأ بهذه الخطوة وفق ترتيب تأسيس القراءة، ويمكنك فتح أي درس آخر.';
  }
  const weak=summary.weak.filter(row=>row.lastWrongAnswer);
  byId('focusList').innerHTML=weak.length?weak.map(row=>{
    const lesson=lessonForConcept(row.concept);
    return `<li><b>${escapeHTML(getConceptLabel(row.concept))}</b>: كانت إجابتك «${escapeHTML(row.lastWrongAnswer)}»، والإجابة المتوقعة «${escapeHTML(row.expected)}». ${lesson?`<button type="button" class="inline-link" data-open-lesson="${escapeHTML(lesson.id)}">تدرّب عليها</button>`:''}</li>`;
  }).join(''):summary.attempts?'<li>لا توجد أخطاء متكررة نعرضها الآن. واصل التدريب كي تتأكد ريشة من إتقان كل مهارة.</li>':'<li>بعد أول تمرين ستظهر هنا المهارات التي تحتاج إلى مراجعة.</li>';
  const strong=Object.values(getProfile().skills).filter(row=>row.mastered).sort((a,b)=>b.mastery-a.mastery||b.correct-a.correct).slice(0,4);
  byId('strengthList').innerHTML=strong.length?strong.map(row=>`<li><b>${escapeHTML(getConceptLabel(row.concept))}</b> · ${number(row.mastery)}٪ بعد ${number(row.attempts)} محاولات صحيحة وخاطئة.</li>`).join(''):'<li>تظهر المهارة هنا بعد ثلاث محاولات على الأقل مع أداء ثابت. لا يثبتها مجرد فتح الدرس أو مشاهدة كلمة.</li>';
  const current=getProfile().name;
  byId('profilePrivacyNote').textContent=`ملف «${current}» محفوظ في متصفح هذا الجهاز فقط؛ لا تُحفظ فيه الصور أو التسجيلات أو نص المحادثة.`;
  renderLessons();
}

function renderUnits() {
  const summary=getLearningSummary(lessons);
  const tabs=[{id:'for-you',title:'🌱 منهجي الآن',note:'توصية ريشة'} ,...units.map(unit=>({id:unit.id,title:`${unit.icon} ${unit.title}`,note:unit.note}))];
  byId('units').innerHTML=tabs.map(tab=>`<button type="button" class="unit-tab ${state.unit===tab.id?'is-selected':''}" data-unit="${escapeHTML(tab.id)}" aria-pressed="${state.unit===tab.id}">${escapeHTML(tab.title)}${tab.id==='for-you'?` <small>${number(Math.min(8,summary.weak.length+1))}</small>`:''}</button>`).join('');
}
function renderLessonCard(lesson,recommendedId) {
  const completed=lessonCompleted(lesson.id),mastery=lessonMastery(lesson);
  const conceptRows=(lesson.concepts||[]).flatMap(concept=>Object.values(getProfile().skills).filter(row=>row.concept===concept));
  const hasErrors=conceptRows.some(row=>row.wrong>row.correct);
  const badge=completed?`منجز · إتقان ${number(mastery)}٪`:conceptRows.length?`إتقان ${number(mastery)}٪`:'درس جديد';
  return `<button type="button" class="lesson-card ${completed?'is-done':''} ${lesson.id===recommendedId?'is-recommended':''}" data-open-lesson="${escapeHTML(lesson.id)}"><span class="lesson-meta"><span>${escapeHTML(lesson.stage||'تأسيس')}</span><span>${escapeHTML(badge)}</span></span><span class="lesson-icon" aria-hidden="true">${escapeHTML(lesson.icon||'🌱')}</span><h3>${escapeHTML(lesson.title)}</h3><p>${escapeHTML(lesson.goal||'خطوة قصيرة في تعلم الإنجليزية.')}</p><span class="lesson-foot">${lesson.id===recommendedId?'مقترح لك ←':hasErrors?'مراجعة لطيفة ←':completed?'أعد التدريب ←':'افتح الدرس ←'}</span></button>`;
}
function renderLessons() {
  if(!byId('lessonGrid'))return;
  renderUnits();
  const next=recommendLesson(lessons);
  const summary=getLearningSummary(lessons);
  const visible=state.unit==='for-you'?(()=>{
    const weakIds=summary.weak.map(row=>lessonForConcept(row.concept)?.id).filter(Boolean);
    const preferred=[next?.id,...weakIds].filter(Boolean);
    const rest=lessons.filter(item=>!preferred.includes(item.id)&&!lessonCompleted(item.id));
    return [...new Set(preferred)].map(id=>lessons.find(item=>item.id===id)).filter(Boolean).concat(rest).slice(0,15);
  })():lessons.filter(item=>item.unit===state.unit);
  const current=lessons.find(item=>item.id===next?.id);
  byId('learnRecommendation').innerHTML=current?`<span aria-hidden="true">🧭</span><div><b>توصية الآن: ${escapeHTML(current.title)}</b><p>${summary.attempts?`بناءً على ${number(summary.attempts)} محاولة، والتكرار الذي ما زال يحتاج تثبيتاً.`:'ابدأ بالتأسيس، وسنغيّر ترتيب المراجعة عندما نعرف ما أتقنته.'}</p></div><button type="button" class="button primary" data-open-lesson="${escapeHTML(current.id)}">ابدأ ←</button>`:'';
  byId('lessonGrid').innerHTML=visible.length?visible.map(item=>renderLessonCard(item,next?.id)).join():'<p class="soft-text">لا توجد دروس في هذا القسم بعد.</p>';
}

function openLesson(id) {
  const lesson=lessons.find(item=>item.id===id);if(!lesson)return;
  if(byId('lessonDialog').open)byId('lessonDialog').close();
  state.lesson={lesson,phase:'intro',quizSelected:false,quizTries:0,writeTries:0,options:lesson.choices.map((_,index)=>index).sort(()=>Math.random()-.5)};
  markLessonOpened(id);
  renderLessonDialog();
  byId('lessonDialog').showModal();
}
function renderLessonDialog() {
  const task=state.lesson;if(!task)return;
  const lesson=task.lesson,container=byId('lessonDialogContent');
  const concept=(lesson.concepts||[`lesson:${lesson.id}`])[0];
  if(task.phase==='intro') {
    container.innerHTML=`<div class="lesson-dialog"><div class="lesson-top"><span class="modal-icon">${escapeHTML(lesson.icon||'🌱')}</span><button type="button" class="lesson-close" data-dialog-close aria-label="إغلاق">×</button></div><p class="kicker">${escapeHTML(lesson.stage||'درس قصير')}</p><h2 id="lessonDialogTitle">${escapeHTML(lesson.title)}</h2><p><b>هدفنا:</b> ${escapeHTML(lesson.goal||'أتعلم شيئاً جديداً.')}</p><div class="lesson-box"><h3>نتعلم بهدوء</h3><p>${escapeHTML(lesson.teach||'اقرأ المثال واستمع إليه.')}</p><p class="lesson-example" dir="ltr">${escapeHTML(lesson.example||'')}</p><p>${escapeHTML(lesson.meaning||'')}</p><button type="button" class="button voice" data-speak="${escapeHTML(lesson.speak||lesson.example||'')}">🔊 استمع إلى المثال</button></div><p class="soft-text">الدرس فيه محاولة فهم واسترجاع. نسجل الخطأ لنختار مراجعة نافعة، ولا ينقص ذلك من إنجازك.</p><div class="button-row"><button type="button" class="button primary" data-begin-quiz>أنا مستعد للمحاولة</button><button type="button" class="button light" data-print-lesson>اطبع ورقة هذا الدرس</button></div></div>`;
    return;
  }
  if(task.phase==='quiz') {
    container.innerHTML=`<div class="lesson-dialog"><div class="lesson-top"><span class="modal-icon">🔎</span><button type="button" class="lesson-close" data-dialog-close aria-label="إغلاق">×</button></div><p class="kicker">المحاولة الأولى · أتحقق من فهمي</p><h2 id="lessonDialogTitle">${escapeHTML(lesson.title)}</h2><div class="lesson-box"><h3>${escapeHTML(lesson.question||'أي إجابة تناسب الدرس؟')}</h3><div class="choices">${task.options.map(index=>`<button type="button" data-choice="${index}" ${task.quizSelected?'disabled':''}>${escapeHTML(lesson.choices[index])}</button>`).join('')}</div><p class="feedback" id="quizFeedback" role="status" aria-live="polite">${task.quizSelected?escapeHTML(task.quizFeedback):'خذ وقتك واختر إجابة.'}</p></div><div class="button-row">${task.quizSelected&&!task.quizCorrect?'<button type="button" class="button light" data-retry-quiz>أعيد المحاولة</button>':''}<button type="button" class="button primary" data-next-write ${task.quizSelected?'':'disabled'}>أكمل إلى الاسترجاع</button></div></div>`;
    return;
  }
  if(task.phase==='write') {
    const prompt=lesson.recallPrompt||(lesson.hideModelForRecall?`اكتب الكلمة الإنجليزية التي تعني «${lesson.meaning}».`:(lesson.write||'اكتب ما تعلمته في الدرس.'));
    container.innerHTML=`<div class="lesson-dialog"><div class="lesson-top"><span class="modal-icon">✍️</span><button type="button" class="lesson-close" data-dialog-close aria-label="إغلاق">×</button></div><p class="kicker">المحاولة الثانية · أسترجع وأكتب</p><h2 id="lessonDialogTitle">${escapeHTML(lesson.title)}</h2><div class="lesson-box"><h3>${escapeHTML(prompt)}</h3><p>${lesson.hideModelForRecall?'أخفينا النموذج الآن حتى نعرف ما تتذكره. إذا لم تعرف، حاول ثم راجع الإجابة بهدوء.':'اكتب ما تستطيع تذكره. هذا تمرين، وتستطيع عرض التصحيح والمحاولة ثانية.'}</p><form id="writeAnswerForm" class="write-row"><input id="writeAnswer" type="text" maxlength="80" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="اكتب إجابتك" placeholder="اكتب إجابتك هنا"><button type="submit" class="button primary">تحقق</button></form><p class="feedback" id="writeFeedback" role="status" aria-live="polite">${task.writeFeedback?escapeHTML(task.writeFeedback):'لن نقيّم شكل خطك أو سرعتك.'}</p></div><div class="button-row"><button type="button" class="button primary" data-finish-lesson ${task.writeTries?'':'disabled'}>أنهِ هذا الدرس</button></div></div>`;
    if(task.lastAnswer)byId('writeAnswer').value=task.lastAnswer;
  }
  if(task.phase==='done') {
    markLessonCompleted(lesson.id);
    const mastery=lessonMastery(lesson),next=recommendLesson(lessons);
    const expected=lesson.expectedAny||lesson.expected;
    container.innerHTML=`<div class="lesson-dialog"><div class="lesson-top"><span class="modal-icon">🌱</span><button type="button" class="lesson-close" data-dialog-close aria-label="إغلاق">×</button></div><p class="kicker">تمرين مكتمل</p><h2 id="lessonDialogTitle">أحسنت المحاولة</h2><p>${escapeHTML(lesson.title)} · مستوى ثبات المهارة الآن ${number(mastery)}٪.</p><div class="lesson-box"><p>${task.writeCorrect?'استرجعت الكتابة بشكل صحيح.':'سجلنا ما يحتاج إلى تدريب، وستساعدنا الأخطاء على اختيار المراجعة القادمة.'} كل محاولة تساعدنا على فهم ما يناسبك.</p><p><b>الكتابة المتوقعة:</b> <span dir="ltr">${escapeHTML(Array.isArray(expected)?expected[0]:expected||'')}</span></p><p>عدد المحاولات المسجلة في هذا الدرس: ${number(task.quizTries+task.writeTries)}.</p></div><div class="button-row"><button type="button" class="button primary" data-next-lesson="${escapeHTML(next?.id||lesson.id)}">${next&&next.id!==lesson.id?'افتح الدرس المقترح ←':'تدرّب مرة أخرى'}</button><button type="button" class="button light" data-dialog-close>عد إلى الدروس</button><button type="button" class="button quiet" data-print-lesson>اطبع ورقة الدرس</button></div></div>`;
    renderProfile();
  }
}
function beginQuiz() {
  if(!state.lesson)return;
  state.lesson.phase='quiz';renderLessonDialog();
}
function logLessonAnswer(task,skill,correct,answer,expected) {
  const concept=(task.lesson.concepts||[`lesson:${task.lesson.id}`])[0];
  return recordAttempt({concept,skill,correct,answer,expected,lessonId:task.lesson.id,unitId:task.lesson.unit,source:'lesson'});
}
function chooseAnswer(index) {
  const task=state.lesson;if(!task||task.phase!=='quiz'||task.quizSelected)return;
  const lesson=task.lesson,correct=index===lesson.answer,expected=lesson.choices[lesson.answer];
  task.quizSelected=true;task.quizCorrect=correct;task.quizTries+=1;
  logLessonAnswer(task,lesson.questionSkill||'understanding',correct,lesson.choices[index],expected);
  task.quizFeedback=correct?'إجابة صحيحة! انتبهت إلى معنى المثال.':`الإجابة المتوقعة هي «${expected}». الخطأ يحدد ما نراجعه، ويمكنك الانتقال بهدوء.`;
  renderLessonDialog();
}
function retryQuiz() {if(!state.lesson)return;state.lesson.quizSelected=false;state.lesson.quizFeedback='حسناً، جرّب أن تتذكر الفكرة مرة أخرى.';renderLessonDialog();}
function beginWriting() {if(!state.lesson)return;state.lesson.phase='write';renderLessonDialog();setTimeout(()=>byId('writeAnswer')?.focus(),40);}
function submitWriting(event) {
  event.preventDefault();const task=state.lesson;if(!task)return;
  const lesson=task.lesson,answer=byId('writeAnswer').value.trim(),expected=lesson.expectedAny||lesson.expected;
  if(!answer){byId('writeFeedback').textContent='اكتب محاولة صغيرة أولاً.';return;}
  const acceptable=Array.isArray(expected)?expected:[expected];
  const matched=acceptable.find(item=>isAnswerCorrect(answer,item));
  const correct=Boolean(matched);
  task.writeTries+=1;task.lastAnswer=answer;task.writeCorrect=correct;
  logLessonAnswer(task,lesson.writeSkill||'recall',correct,answer,matched||acceptable[0]);
  task.writeFeedback=correct?'أصبت! الكلمة أو العبارة تطابق التدريب. يمكنك تجربة ثانية أو إنهاء الدرس.':`الصيغة المتوقعة: ${acceptable.join(' أو ')}. قارن ترتيب الحروف ثم جرّب مرة أخرى، أو أنهِ الدرس وسنراجعه لاحقاً.`;
  renderLessonDialog();
}
function printLesson(lesson) {
  if(!lesson)return;
  const print=byId('printArea');
  print.innerHTML=`<article class="print-sheet"><header><b>🪶 ريشة · ورقة تدريب</b><span>المتعلم: _______________</span></header><h1>${escapeHTML(lesson.title)}</h1><p>${escapeHTML(lesson.goal||'')}</p><div class="large-example" dir="ltr">${escapeHTML(lesson.example||'')}</div><p><b>المعنى:</b> ${escapeHTML(lesson.meaning||'')}</p><p>${escapeHTML(lesson.paper||lesson.write||'اكتب المثال ثم راجعه.')}</p><div class="print-lines"></div><p><b>ما الذي أتقنته؟</b> ☐ أعرف المعنى　 ☐ أستطيع كتابة الكلمة</p><footer>كل محاولة تساعدني على التعلّم.</footer></article>`;
  window.print();
}

function setReadingMode(mode) {
  setLearnerMode(mode);document.documentElement.dataset.learner=mode==='elder'?'elder':'child';
}
function updateLearnerProfile() {
  const name=window.prompt('اكتب اسماً قصيراً لهذا الملف على جهازك. لا تكتب اسمك الكامل أو معلومات خاصة.','');
  if(name===null)return;
  const result=createLearner(name);
  if(!result.ok){notify('وصلت إلى الحد الأقصى للملفات على هذا الجهاز.');return;}
  stopCamera();stopListening();syncLearnerControls();renderProfile();
  if(byId('profileToolsStatus'))byId('profileToolsStatus').textContent=`أنشأنا الملف المحلي «${result.learner.name}».`;
}
function downloadCurrentProfile() {
  const blob=new Blob([JSON.stringify(exportProfile(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`reesha-learning-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);
  byId('profileToolsStatus').textContent='نُزّلت نسخة من ملف المتعلم الحالي إلى جهازك.';
}
async function importLearnerFile(file) {
  const status=byId('profileToolsStatus');
  try {
    const payload=JSON.parse(await file.text());
    if(!importProfile(payload)){status.textContent='لم نستطع قراءة الملف أو وصلت إلى الحد الأقصى للملفات.';return;}
    syncLearnerControls();renderProfile();status.textContent=`استعدنا ملف «${getProfile().name}» على هذا الجهاز.`;
  } catch {status.textContent='الملف غير صالح. اختر نسخة ريشة بصيغة JSON.';}
}
function eraseCurrentProgress() {
  if(!window.confirm(`هل تمسح سجل «${getProfile().name}» فقط؟ لا يمكن استعادة السجل بعد المسح.`))return;
  clearProfile();renderProfile();byId('profileToolsStatus').textContent='مُسح سجل التعلّم للملف الحالي.';
}
function deleteCurrentProfile() {
  const learners=getLearners();
  if(learners.length<=1){notify('أنشئ ملفاً آخر قبل حذف الملف الوحيد.');return;}
  if(!window.confirm(`هل تحذف ملف «${getProfile().name}» وسجله من هذا الجهاز؟`))return;
  removeActiveLearner();stopCamera();stopListening();syncLearnerControls();renderProfile();byId('profileToolsStatus').textContent='حُذف الملف المحدد من هذا الجهاز.';
}

// Browser-native speech only; no audio assets are bundled with the site.
function speak(text,{resumeListening=true}={}) {
  if(!('speechSynthesis'in window)||!text)return;
  const speechToken=++state.speechToken;
  window.speechSynthesis.cancel();
  const shouldResume=state.sessionActive&&resumeListening;
  if(shouldResume&&state.speech) {state.speaking=true;state.speech.pause();}
  const segments=String(text).match(/[\u0600-\u06FF][\u0600-\u06FF\sًٌٍَُِّْـ.,!?،؛؟-]*|[A-Za-z][A-Za-z'’\s.,!?-]*/g)||[String(text)];
  const parts=segments.map(part=>part.trim()).filter(Boolean);
  if(!parts.length)return;
  const rate=Number(byId('speechRate').value)||.82;
  parts.forEach((part,index)=>{
    const arabic=/[\u0600-\u06FF]/.test(part);
    const utterance=new SpeechSynthesisUtterance(part);
    utterance.lang=arabic?'ar-SA':'en-US';utterance.rate=rate;
    const voices=window.speechSynthesis.getVoices();
    const voice=arabic?voices.find(item=>item.lang.toLowerCase().startsWith('ar')):voices.find(item=>item.lang.toLowerCase().startsWith('en-us'));
    if(voice)utterance.voice=voice;
    utterance.onend=()=>{if(index===parts.length-1&&speechToken===state.speechToken){state.speaking=false;if(shouldResume&&state.sessionActive&&!document.hidden)setTimeout(()=>{if(speechToken===state.speechToken)state.speech?.resume();},350);}};
    utterance.onerror=()=>{if(index===parts.length-1&&speechToken===state.speechToken){state.speaking=false;if(shouldResume&&state.sessionActive&&!document.hidden)setTimeout(()=>{if(speechToken===state.speechToken)state.speech?.resume();},500);}};
    window.speechSynthesis.speak(utterance);
  });
}
function addChat(text,kind='guide') {
  const bubble=document.createElement('p');bubble.className=`chat-bubble ${kind}`;bubble.textContent=text;
  byId('chatLog').append(bubble);byId('chatLog').scrollTop=byId('chatLog').scrollHeight;
}
function latestFocusEntries() {
  const typed=explainText(byId('recognizedText').value).filter(row=>row.known);
  const unique=new Map();
  [...state.contextEntries,...typed].forEach(row=>unique.set(normalize(row.en||row.token||''),row));
  return [...unique.values()];
}
function respondToQuestion(question) {
  if(!question?.trim())return;
  const response=answerQuestion(question,latestFocusEntries());
  addChat(response,'guide');speak(response);
}
function detectScript(text) {return /[\u0600-\u06FF]/.test(text)?'ar':'en';}
function updateListeningButton() {
  const button=byId('toggleListening');
  if(!button)return;
  button.classList.toggle('is-listening',state.listening);
  button.setAttribute('aria-pressed',String(state.listening));
  button.textContent=state.listening?'أرسل عبارتي':'اضغط هنا لتتحدث';
}
function toggleListening() {
  if(!state.sessionActive||!state.speechReady||!state.speech)return;
  if(state.listening) {state.speech.stopPushToTalk();state.listening=false;updateListeningButton();return;}
  if(state.speech.startPushToTalk()){state.listening=true;state.armed=false;updateListeningButton();}
}
function stopListening() {
  state.listening=false;state.armed=false;
  if(state.speech?.pushRecording)state.speech.stopPushToTalk();
  updateListeningButton();
}

function setSpeechStatus(event={}) {
  const title=byId('modelStatusTitle'),detail=byId('modelStatusText'),progress=byId('voiceModelProgress'),button=byId('toggleListening'),wake=byId('toggleWakeWord');
  const labels={loading:'تجهيز نموذج التعرّف',ready:'التعرّف المحلي جاهز',recording:'ريشة تستمع لعبارتك',transcribing:'ريشة تفهم العبارة',paused:'كلمة النداء متوقفة',stopped:'الجلسة متوقفة',error:'تعذر تجهيز الصوت'};
  if(title)title.textContent=labels[event.state]||'التعرّف المحلي';
  if(detail&&event.message)detail.textContent=event.message;
  if(progress){progress.hidden=event.state!=='loading'||!Number.isFinite(event.progress);if(Number.isFinite(event.progress))progress.value=Math.max(0,Math.min(100,event.progress));}
  if(event.state==='ready')state.speechReady=true;
  if(event.state==='error')state.speechReady=false;
  if(event.state!=='recording'&&state.listening){state.listening=false;updateListeningButton();}
  if(button)button.disabled=!state.sessionActive||!state.speechReady;
  if(wake)wake.disabled=!state.sessionActive||!state.speechReady;
  const status=byId('voiceStatus');
  if(status&&event.message)status.textContent=event.message;
}

function handleTranscript({text,source}) {
  const transcript=String(text||'').trim();if(!transcript)return;
  const language=detectScript(transcript);
  byId('detectedLanguage').textContent=language==='ar'?'العربية':'EN · English';
  if(source==='push') {state.armed=false;addChat(transcript,'user');respondToQuestion(transcript);return;}
  const wakePattern=/\b(?:hey\s+)?(?:reesha|risha|resha)\b|(?:يا\s*)?ريشة/ig;
  if(state.armed) {
    state.armed=false;addChat(transcript,'user');respondToQuestion(transcript);return;
  }
  if(!wakePattern.test(transcript))return;
  const question=transcript.replace(wakePattern,'').replace(/^[,،:؛\s]+/,'').trim();
  state.armed=!question;
  if(question){addChat(question,'user');respondToQuestion(question);}
  else {const greeting='نعم، أنا أسمعك. اسألني عن كلمة أو عبارة قصيرة بالعربية أو الإنجليزية.';addChat(greeting,'guide');speak(greeting);}
}

function createSpeechEngine() {
  if(state.speech)return state.speech;
  state.speech=new LiveSpeech({onTranscript:handleTranscript,onStatus:setSpeechStatus,onLevel:value=>{const fill=byId('audioMeterFill');if(fill)fill.style.width=`${Math.round(value*100)}%`;}});
  return state.speech;
}

function appendScript(src,id) {
  return new Promise((resolve,reject)=>{
    const previous=document.getElementById(id);
    if(previous?.dataset.loaded==='true'){resolve();return;}
    previous?.remove();
    const script=document.createElement('script');script.src=src;script.id=id;script.async=true;
    script.onload=()=>{script.dataset.loaded='true';resolve();};script.onerror=()=>{script.remove();reject(new Error('تعذر تحميل مكتبة التحليل. تحقق من الاتصال ثم حاول ثانية.'));};
    document.head.append(script);
  });
}
async function loadObjectModel() {
  if(state.model)return state.model;
  if(state.modelPromise)return state.modelPromise;
  state.modelPromise=(async()=>{
    setVisionLoading('تحميل نموذج الأشياء','يُحمّل النموذج إلى هذا الجهاز عند أول استعمال.');
    await appendScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js','tensorflow-runtime');
    await appendScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js','coco-ssd-model');
    state.model=await window.cocoSsd.load();return state.model;
  })();
  try{return await state.modelPromise;}finally{state.modelPromise=null;}
}
async function loadOcrWorker() {
  if(state.worker)return state.worker;
  if(state.workerPromise)return state.workerPromise;
  state.workerPromise=(async()=>{
    setVisionLoading('تحميل قارئ العربية والإنجليزية','تحميل ملفات القراءة يتم عند أول استعمال.');
    await appendScript('https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js','tesseract-runtime');
    state.worker=await window.Tesseract.createWorker('eng+ara',1,{logger:message=>{if(message.status==='recognizing text')setVisionLoading('قراءة النص المطبوع',`تقدم القراءة ${number(Math.round((message.progress||0)*100))}٪`);}});
    return state.worker;
  })();
  try{return await state.workerPromise;}finally{state.workerPromise=null;}
}
function setVisionLoading(title,detail) {
  const box=byId('visionLoading');if(!box)return;
  box.hidden=false;byId('visionLoadingLabel').textContent=title;byId('visionLoadingDetail').textContent=detail;
}
function hideVisionLoading(){if(byId('visionLoading'))byId('visionLoading').hidden=true;}

function requestLiveSession() {
  switchPage('camera');
  if(state.sessionActive)return;
  const dialog=byId('liveConsentDialog');
  let consentSaved=false;try{consentSaved=localStorage.getItem('reesha-live-consent-v1')==='yes';}catch{}
  if(consentSaved){startLiveSession();return;}
  byId('liveConsentCheck').checked=false;byId('confirmLiveStart').disabled=true;
  byId('liveConsentStatus').textContent='';
  if(!dialog.open)dialog.showModal();
}
let sessionStarting=false;
async function startLiveSession() {
  if(sessionStarting||state.sessionActive)return;
  if(!navigator.mediaDevices?.getUserMedia){const message='يحتاج تشغيل الكاميرا والميكروفون إلى HTTPS ومتصفح حديث.';byId('cameraStatus').textContent=message;byId('liveConsentStatus').textContent=message;return;}
  sessionStarting=true;
  const startButtons=$$('[data-start-session]');startButtons.forEach(button=>button.disabled=true);
  byId('confirmLiveStart').disabled=true;
  byId('cameraStatus').textContent='نطلب إذني الكاميرا والميكروفون معاً من المتصفح…';
  const consentDialogWasOpen=byId('liveConsentDialog').open;
  try {
    const stream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
      video:{facingMode:{ideal:state.facing},width:{ideal:1280},height:{ideal:720}}
    });
    if(state.page!=='camera'||document.hidden||(consentDialogWasOpen&&!byId('liveConsentDialog').open)){stream.getTracks().forEach(track=>track.stop());return;}
    state.stream=stream;state.sessionActive=true;
    try{localStorage.setItem('reesha-live-consent-v1','yes');}catch{}
    if(byId('liveConsentDialog').open)byId('liveConsentDialog').close();
    byId('cameraVideo').srcObject=stream;await byId('cameraVideo').play();
    byId('cameraEmpty').hidden=true;byId('startLiveSession').disabled=true;byId('stopCamera').disabled=false;byId('switchCamera').disabled=false;
    $('.camera-panel').classList.add('is-open');
    byId('visionState').textContent='تحليل حي';byId('liveBadge').innerHTML='<i></i> الجلسة نشطة';byId('liveBadge').classList.add('is-live');
    setCameraCapabilities();
    byId('cameraStatus').textContent='الجلسة نشطة. أوجّه العدسة إلى غرض أو نص، أو أنادي «ريشة»؛ ويمكنني استخدام زر التحدث.';
    byId('voiceStatus').textContent='يجري تهيئة الاستماع المحلي. كلمة النداء وزر التحدث يعملان بعد جاهزية النموذج.';
    setVisionLoading('تهيئة المختبر','تعمل الرؤية وقراءة النص والصوت داخل هذا الجهاز.');
    createSpeechEngine().start(stream).then(()=>{
      if(state.sessionActive){state.speechReady=true;byId('toggleWakeWord').disabled=false;byId('toggleListening').disabled=false;const wakeEnabled=byId('toggleWakeWord').getAttribute('aria-pressed')==='true';byId('wakeIndicator').classList.toggle('is-on',wakeEnabled);state.speech.setWakeEnabled(wakeEnabled);}
    }).catch(error=>{
      if(!state.sessionActive)return;
      stream.getAudioTracks().forEach(track=>track.stop());
      state.speech?.shutdown();state.speech=null;
      state.speechReady=false;setSpeechStatus({state:'error',message:error.message||'تعذر بدء الصوت المحلي. يمكنك استخدام الكتابة والعدسة.'});
    });
    startScanning();
  } catch(error) {
    const message=error.name==='NotAllowedError'?'لم يسمح المتصفح بإذن الكاميرا أو الميكروفون. راجع أذونات الموقع ثم أعد المحاولة.':error.name==='NotFoundError'?'لم نعثر على كاميرا أو ميكروفون متاحين في هذا الجهاز.':'تعذر بدء الجلسة. تحقق من توصيل الكاميرا والميكروفون وإعدادات المتصفح.';
    if(state.sessionActive)stopCamera();
    byId('cameraStatus').textContent=message;
    byId('liveConsentStatus').textContent=message;
  } finally {
    sessionStarting=false;startButtons.forEach(button=>button.disabled=false);
    if(byId('liveConsentDialog').open)byId('confirmLiveStart').disabled=!byId('liveConsentCheck').checked;
  }
}
function setScanMode(mode) {
  state.scanMode=mode;state.visionTurn='objects';
  $$('[data-scan-mode]').forEach(button=>{const active=button.dataset.scanMode===mode;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));});
  if(state.sessionActive)startScanning();
  else byId('cameraStatus').textContent=mode==='both'?'ستحلل الجلسة المشهد والنص بالتناوب.':'سيبدأ هذا النوع من التحليل عند تشغيل الجلسة.';
}
function setCameraCapabilities() {
  const track=state.stream?.getVideoTracks()[0],capabilities=track?.getCapabilities?.()||{};
  const zoom=byId('cameraZoom'),torch=byId('torchToggle');
  if(capabilities.zoom){zoom.min=String(capabilities.zoom.min);zoom.max=String(capabilities.zoom.max);zoom.step=String(capabilities.zoom.step||.1);zoom.value=String(capabilities.zoom.min);zoom.disabled=false;}else zoom.disabled=true;
  torch.hidden=!capabilities.torch;torch.disabled=!capabilities.torch;torch.setAttribute('aria-pressed','false');
}
async function applyCameraZoom(value) {
  const track=state.stream?.getVideoTracks()[0];if(!track)return;
  try{await track.applyConstraints({advanced:[{zoom:Number(value)}]});}catch{byId('cameraStatus').textContent='التقريب غير مدعوم في هذه العدسة.';}
}
async function toggleTorch() {
  const button=byId('torchToggle'),track=state.stream?.getVideoTracks()[0];if(!track)return;
  const enabled=button.getAttribute('aria-pressed')!=='true';
  try{await track.applyConstraints({advanced:[{torch:enabled}]});button.setAttribute('aria-pressed',String(enabled));}
  catch{byId('cameraStatus').textContent='لا يمكن تغيير الإضاءة من هذه الكاميرا.';}
}

function startScanning() {
  if(!state.stream||!state.sessionActive)return;
  if(state.detectTimer)clearTimeout(state.detectTimer);
  state.detecting=true;state.visionTurn='objects';byId('visionState').textContent='تحليل حي';
  byId('cameraStatus').textContent='أبحث محلياً عن أشياء مألوفة ونص مطبوع. أراجع ما أراه قبل الاعتماد عليه.';
  runVisionCycle();
}
async function runVisionCycle() {
  if(!state.detecting||!state.sessionActive||state.visionBusy)return;
  state.visionBusy=true;
  const turn=state.scanMode==='both'?state.visionTurn:state.scanMode;
  try {
    if(turn==='objects')await detectFrame(await loadObjectModel());
    else await recognizeVideoFrame(await loadOcrWorker());
  } catch(error) {
    hideVisionLoading();
    if(state.sessionActive)byId('cameraStatus').textContent=error.message||'تعذر تشغيل هذا التحليل. تحقق من الاتصال ثم حاول مجدداً.';
  } finally {
    state.visionBusy=false;hideVisionLoading();
    if(state.scanMode==='both')state.visionTurn=turn==='objects'?'text':'objects';
    if(state.detecting)state.detectTimer=setTimeout(runVisionCycle,state.scanMode==='both'?650:1300);
  }
}
function prepareOverlay() {
  const video=byId('cameraVideo'),canvas=byId('objectOverlay'),ratio=window.devicePixelRatio||1;
  const width=video.clientWidth,height=video.clientHeight;
  if(!width||!height||!video.videoWidth||!video.videoHeight)return null;
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  const context=canvas.getContext('2d');context.setTransform(ratio,0,0,ratio,0,0);return {context,width,height,videoWidth:video.videoWidth,videoHeight:video.videoHeight};
}
function updateLiveContext() {
  state.contextEntries=[...(state.objectEntries||[]),...(state.ocrEntries||[])];
  const labels=state.contextEntries.slice(0,5).map(row=>`${row.en}${row.ar?` · ${row.ar}`:''}`);
  byId('sceneSummary').textContent=labels.length?labels.join('، '):'لم تكتشف ريشة شيئاً بعد. وجّه العدسة إلى غرض أو كلمة واضحة.';
  if(!state.manualText&&document.activeElement!==byId('recognizedText')&&state.ocrText){
    byId('recognizedText').value=state.ocrText||'';
    renderDiscovery(explainText(state.ocrText));
  } else if(!state.manualText)renderDiscovery(state.objectEntries||[]);
}
async function detectFrame(model) {
  const video=byId('cameraVideo');if(!state.detecting||video.readyState<2)return;
  const predictions=await model.detect(video),layout=prepareOverlay();if(!layout)return;
  const {context,width,height,videoWidth,videoHeight}=layout;
  context.clearRect(0,0,width,height);context.lineWidth=2;context.font='700 14px Segoe UI, sans-serif';
  const scale=Math.max(width/videoWidth,height/videoHeight),offsetX=(width-videoWidth*scale)/2,offsetY=(height-videoHeight*scale)/2;
  const visible=predictions.filter(row=>row.class!=='person'&&row.score>=.58).slice(0,8);
  for(const row of visible) {
    const [x,y,w,h]=row.bbox,px=x*scale+offsetX,py=y*scale+offsetY,pw=w*scale,ph=h*scale,label=objectLabels.get(row.class)||lookup(row.class)?.ar;
    context.strokeStyle='#56d4bb';context.strokeRect(px,py,pw,ph);
    const text=`${row.class}${label?` · ${label}`:''}`;context.fillStyle='#123d42';const textWidth=context.measureText(text).width+12;
    context.fillRect(px,Math.max(0,py-24),textWidth,23);context.fillStyle='#fff';context.fillText(text,px+6,Math.max(16,py-7));
  }
  state.objectEntries=visible.map(row=>({en:row.class,ar:objectLabels.get(row.class)||lookup(row.class)?.ar||'',known:true,score:row.score}));
  updateLiveContext();
  if(visible[0]) {
    const top=visible[0],meaning=objectLabels.get(top.class)||lookup(top.class)?.ar||'غرض مألوف';
    byId('cameraStatus').textContent=`تعرّفت إلى ${top.class} باحتمال ${number(Math.round(top.score*100))}٪. النتيجة تقريبية ويمكنك سؤال ريشة عنها.`;
    if(byId('narrateFindings').checked&&state.lastNarrated!==top.class){speak(`${top.class}. ${meaning}.`);state.lastNarrated=top.class;}
  }
}
async function recognizeVideoFrame(worker) {
  const video=byId('cameraVideo'),canvas=byId('ocrCanvas');if(!state.detecting||video.readyState<2)return;
  const scale=Math.min(1,1280/video.videoWidth);canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  canvas.getContext('2d',{willReadFrequently:true}).drawImage(video,0,0,canvas.width,canvas.height);
  const result=await worker.recognize(canvas),text=String(result.data.text||'').trim();
  if(text&&text!==state.ocrText) {
    state.ocrText=text;state.ocrEntries=explainText(text).filter(row=>row.known);
    if(!state.manualText&&document.activeElement!==byId('recognizedText'))byId('recognizedText').value=text;
    updateLiveContext();
    byId('cameraStatus').textContent='قرأت نصاً محتملاً. راجعه في بطاقة التدقيق قبل الاعتماد على الترجمة أو تسجيل تهجئة.';
    if(byId('narrateFindings').checked&&state.lastNarrated!==`ocr:${text}`){const summary=state.ocrEntries.slice(0,4).map(row=>`${row.en}. ${row.ar}`).join('. ');if(summary)speak(summary);state.lastNarrated=`ocr:${text}`;}
  }
}
function stopScanning() {
  state.detecting=false;if(state.detectTimer)clearTimeout(state.detectTimer);state.detectTimer=null;
  const canvas=byId('objectOverlay');if(canvas)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
}
function stopCamera() {
  stopScanning();stopListening();state.sessionActive=false;state.speechReady=false;
  state.speech?.shutdown();state.speech=null;state.speaking=false;
  state.speechToken+=1;
  if('speechSynthesis'in window)window.speechSynthesis.cancel();
  if(state.stream){state.stream.getTracks().forEach(track=>track.stop());state.stream=null;}
  state.objectEntries=[];state.ocrEntries=[];state.ocrText='';state.contextEntries=[];
  const video=byId('cameraVideo');if(video)video.srcObject=null;
  byId('startLiveSession').disabled=false;byId('stopCamera').disabled=true;byId('switchCamera').disabled=true;byId('cameraEmpty').hidden=false;
  byId('toggleListening').disabled=true;byId('toggleWakeWord').disabled=true;updateListeningButton();
  byId('visionState').textContent='متوقف';byId('liveBadge').innerHTML='<i></i> الجلسة متوقفة';byId('liveBadge').classList.remove('is-live');
  byId('cameraZoom').disabled=true;byId('torchToggle').hidden=true;$('.camera-panel')?.classList.remove('is-open');state.lastNarrated='';
  hideVisionLoading();byId('voiceStatus').textContent='الجلسة متوقفة. ابدأها لتستمع ريشة إلى كلمة النداء.';byId('sceneSummary').textContent='لم تكتشف ريشة شيئاً بعد.';
  if(byId('cameraStatus'))byId('cameraStatus').textContent='أوقفت ريشة الجلسة؛ الكاميرا والميكروفون مغلقان.';
  setSpeechStatus({state:'stopped',message:'توقفت الجلسة؛ الكاميرا والميكروفون مغلقان.'});
}
async function switchCamera() {
  if(!state.stream||!state.sessionActive)return;
  state.facing=state.facing==='environment'?'user':'environment';
  const oldVideo=state.stream.getVideoTracks()[0];
  try {
    const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:state.facing},width:{ideal:1280},height:{ideal:720}}});
    const nextVideo=next.getVideoTracks()[0],audioTracks=state.stream.getAudioTracks();
    state.stream=new MediaStream([...audioTracks,nextVideo]);oldVideo?.stop();
    byId('cameraVideo').srcObject=state.stream;await byId('cameraVideo').play();setCameraCapabilities();
    byId('cameraStatus').textContent='تم تبديل العدسة. يستمر الصوت والجلسة.';
  } catch {state.facing=state.facing==='environment'?'user':'environment';byId('cameraStatus').textContent='تعذر تبديل الكاميرا؛ تستمر الجلسة بالعدسة الحالية.';}
}
function renderDiscovery(items) {
  const cards=items.slice(0,24).map(item=>{
    if(item.known) {
      const example=item.ex||item.example||item.en;
      const exampleAr=item.exAr||item.exampleAr||item.ar;
      const translation=state.direction==='ar-en'?item.en:item.ar;
      const practice=entries.has(normalize(item.en))?`<button type="button" class="button quiet" data-practice-word="${escapeHTML(item.en)}">اختبر ذاكرتي بهذه الكلمة</button>`:'';
      return `<article class="word-card"><div class="word-card-top"><h3 dir="ltr">${escapeHTML(item.en)}</h3><button type="button" data-speak="${escapeHTML(item.en)}">🔊 اسمع</button></div><p><b>${state.direction==='ar-en'?'الترجمة إلى الإنجليزية:':'المعنى:'}</b> ${escapeHTML(translation)}</p><p class="say">تقريب كتابة النطق: ${escapeHTML(item.say||'')} — وقد لا يطابق الصوت الإنجليزي تماماً.</p><p>${escapeHTML(example)} · ${escapeHTML(exampleAr)}</p>${practice}</article>`;
    }
    const corrected=item.suggestions?.find(word=>/^[A-Za-z][A-Za-z'’-]*$/.test(word)&&entries.has(normalize(word)));
    return `<article class="word-card unknown"><h3 dir="auto">${escapeHTML(item.token)}</h3><p>لم أجدها في قاموس البداية. قد تكون الكاميرا أخطأت في الحرف.</p>${item.suggestions?.length?`<p>هل تقصد: ${item.suggestions.map(word=>`<button type="button" class="suggestion" data-replace-word="${escapeHTML(word)}">${escapeHTML(word)}</button>`).join(' ')}</p>`:''}${corrected?`<p class="small">إذا كانت هذه تهجئتك أنت، سجّلها كي تتدرب عليها:</p><button type="button" class="button quiet" data-record-spelling-error="${escapeHTML(item.token)}" data-expected-word="${escapeHTML(corrected)}">نعم، هذه كتابتي؛ سجّل الخطأ</button>`:''}</article>`;
  }).join('');
  byId('wordCards').innerHTML=cards||'<p class="soft-text">أدخل كلمة عربية أو إنجليزية لتظهر بطاقتها هنا.</p>';
}
function practiceWord(word) {
  const lesson=ensureWordLesson(word);if(!lesson){notify('هذه الكلمة ليست في قاموس ريشة بعد.');return;}
  renderProfile();openLesson(lesson.id);
}
function recordSpellingError(button) {
  const answer=button.dataset.recordSpellingError,expected=normalize(button.dataset.expectedWord),lesson=ensureWordLesson(expected);
  if(!entries.has(expected))return;
  recordAttempt({concept:`word:${expected}`,skill:'spelling',correct:false,answer,expected,lessonId:lesson?.id||'',unitId:lesson?.unit||'word-garden',source:'camera-review'});
  button.disabled=true;button.textContent='سجّلناها. سنراجع تهجئتها معاً.';
  renderProfile();addChat(`سجلنا محاولة كتابة «${answer}»، والصيغة التي سنتمرن عليها هي ${expected}.`,'guide');
}
function analyzeText() {
  const text=byId('recognizedText').value.trim();if(!text){notify('اكتب كلمة أو اختر صورة أولاً.');return;}
  const items=explainText(text);renderDiscovery(items);
  const known=items.filter(item=>item.known);
  const summary=known.length?known.slice(0,6).map(item=>state.direction==='ar-en'?`${item.ar} in English is ${item.en}`:`${item.en} تعني ${item.ar}`).join('. '):state.direction==='ar-en'?'I do not know this word yet. Try a word from the lessons.':'لا أعرف هذه الكلمة بعد. جرّب كلمة من الدروس.';
  addChat(summary,'guide');speak(summary);
}
function readUploadedImage(file) {
  if(!file)return;
  if(file.size>15*1024*1024){byId('cameraStatus').textContent='الصورة أكبر من ١٥ ميغابايت. اختر صورة أصغر.';return;}
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=async()=>{
    const canvas=byId('ocrCanvas'),context=canvas.getContext('2d');
    const scale=Math.min(1,1800/image.width);canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);context.drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);
    try {const worker=await loadOcrWorker(),result=await worker.recognize(canvas);hideVisionLoading();byId('recognizedText').value=result.data.text.trim();state.manualText=true;byId('cameraStatus').textContent='راجِع النص المستخرج، ثم اطلب شرحه. لا تُحفظ الصورة.';if(byId('recognizedText').value)analyzeText();}
    catch(error){hideVisionLoading();byId('cameraStatus').textContent=error.message||'لم أستطع قراءة هذه الصورة.';}
  };
  image.onerror=()=>{URL.revokeObjectURL(url);byId('cameraStatus').textContent='تعذر فتح الصورة.';};image.src=url;
}
function clearDiscovery() {
  byId('recognizedText').value='';byId('wordCards').innerHTML='';state.manualText=false;state.ocrText='';state.ocrEntries=[];state.objectEntries=[];state.contextEntries=[];
  byId('sceneSummary').textContent='لم تكتشف ريشة شيئاً بعد.';
  byId('objectOverlay').getContext('2d').clearRect(0,0,byId('objectOverlay').width,byId('objectOverlay').height);
}

function printBlank() {
  byId('printArea').innerHTML='<article class="print-sheet"><header><b>🪶 ريشة · ورقة تدريب</b><span>المتعلم: _______________</span></header><h1>كلمتي اليوم</h1><p>أسمع الكلمة وأقولها وألاحظ معناها.</p><div class="large-example" dir="ltr">My new word</div><p><b>أكتب الكلمة أو أرسم معناها:</b></p><div class="print-lines"></div><p><b>أستطيع:</b> ☐ سماعها　☐ فهمها　☐ كتابتها</p><footer>التعلّم خطوة صغيرة تتكرر.</footer></article>';window.print();
}

function setupEvents() {
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-start-session]')){requestLiveSession();return;}
    const page=event.target.closest('[data-page]');if(page){event.preventDefault();switchPage(page.dataset.page);return;}
    const open=event.target.closest('[data-open-lesson]');if(open){openLesson(open.dataset.openLesson);return;}
    const unit=event.target.closest('[data-unit]');if(unit){state.unit=unit.dataset.unit;renderLessons();return;}
    const choice=event.target.closest('[data-choice]');if(choice){chooseAnswer(Number(choice.dataset.choice));return;}
    const speakButton=event.target.closest('[data-speak]');if(speakButton){speak(speakButton.dataset.speak);return;}
    const replace=event.target.closest('[data-replace-word]');if(replace){byId('recognizedText').value=replace.dataset.replaceWord;analyzeText();return;}
    const practice=event.target.closest('[data-practice-word]');if(practice){practiceWord(practice.dataset.practiceWord);return;}
    const spellingError=event.target.closest('[data-record-spelling-error]');if(spellingError){recordSpellingError(spellingError);return;}
    const ask=event.target.closest('[data-ask]');if(ask){const question={meaning:'ما معنى الكلمة؟',spell:'كيف أكتب الكلمة؟',example:'أعطني مثالاً على الكلمة.',slow:'قل الكلمة ببطء.'}[ask.dataset.ask];respondToQuestion(question);return;}
    if(event.target.closest('[data-begin-quiz]')){beginQuiz();return;}
    if(event.target.closest('[data-retry-quiz]')){retryQuiz();return;}
    if(event.target.closest('[data-next-write]')){beginWriting();return;}
    if(event.target.closest('[data-finish-lesson]')){if(state.lesson?.writeTries){state.lesson.phase='done';renderLessonDialog();}return;}
    if(event.target.closest('[data-dialog-close]')){byId('lessonDialog').close();return;}
    const next=event.target.closest('[data-next-lesson]');if(next){openLesson(next.dataset.nextLesson);return;}
    if(event.target.closest('[data-print-lesson]')){printLesson(state.lesson?.lesson);return;}
  });
  document.addEventListener('submit',event=>{
    if(event.target.id==='writeAnswerForm'){submitWriting(event);return;}
    if(event.target.id==='chatInputForm'){
      event.preventDefault();const input=byId('chatQuestion'),question=input.value.trim();if(!question)return;
      input.value='';addChat(question,'user');respondToQuestion(question);
    }
  });
  modeSelect.addEventListener('change',()=>setReadingMode(modeSelect.value));
  profileSelect.addEventListener('change',()=>{selectLearner(profileSelect.value);stopCamera();stopListening();syncLearnerControls();renderProfile();});
  byId('startRecommended').addEventListener('click',()=>{const next=recommendLesson(lessons);if(next)openLesson(next.id);});
  byId('startLiveSession').addEventListener('click',requestLiveSession);
  byId('toggleListening').addEventListener('click',toggleListening);
  byId('toggleWakeWord').addEventListener('click',event=>{
    const button=event.currentTarget,enabled=button.getAttribute('aria-pressed')!=='true';
    button.setAttribute('aria-pressed',String(enabled));byId('wakeIndicator').classList.toggle('is-on',enabled);state.armed=false;
    state.speech?.setWakeEnabled(enabled);
  });
  byId('liveConsentCheck').addEventListener('change',event=>{byId('confirmLiveStart').disabled=!event.target.checked;byId('liveConsentStatus').textContent='';});
  byId('confirmLiveStart').addEventListener('click',startLiveSession);
  byId('liveConsentDialog').addEventListener('cancel',()=>{byId('liveConsentCheck').checked=false;byId('liveConsentStatus').textContent='';});
  byId('stopCamera').addEventListener('click',stopCamera);
  byId('switchCamera').addEventListener('click',switchCamera);
  byId('torchToggle').addEventListener('click',toggleTorch);
  byId('cameraZoom').addEventListener('input',event=>applyCameraZoom(event.target.value));
  $$('[data-scan-mode]').forEach(button=>button.addEventListener('click',()=>setScanMode(button.dataset.scanMode)));
  $$('[data-direction]').forEach(button=>button.addEventListener('click',()=>{state.direction=button.dataset.direction;$$('[data-direction]').forEach(item=>{const active=item===button;item.classList.toggle('is-selected',active);item.setAttribute('aria-pressed',String(active));});if(byId('recognizedText').value)renderDiscovery(explainText(byId('recognizedText').value));}));
  byId('chooseImage').addEventListener('click',()=>byId('paperImage').click());
  byId('paperImage').addEventListener('change',event=>readUploadedImage(event.target.files?.[0]));
  byId('analyzeText').addEventListener('click',analyzeText);
  byId('clearDiscovery').addEventListener('click',clearDiscovery);
  byId('recognizedText').addEventListener('input',()=>{state.manualText=true;state.ocrEntries=explainText(byId('recognizedText').value).filter(row=>row.known);state.contextEntries=[...(state.objectEntries||[]),...state.ocrEntries];});
  byId('narrateFindings').addEventListener('change',event=>{if(event.target.checked)state.lastNarrated='';});
  byId('speechRate').addEventListener('input',event=>{byId('speedLabel').textContent=Number(event.target.value)<.78?'بطيئة جداً':Number(event.target.value)>.98?'عادية':'هادئة';});
  byId('printBlank').addEventListener('click',printBlank);
  byId('exportProfile').addEventListener('click',downloadCurrentProfile);
  byId('importProfileButton').addEventListener('click',()=>byId('importProfileFile').click());
  byId('importProfileFile').addEventListener('change',event=>importLearnerFile(event.target.files?.[0]));
  byId('clearProfile').addEventListener('click',eraseCurrentProgress);
  byId('deleteLearnerProfile').addEventListener('click',deleteCurrentProfile);
  byId('addLearnerProfile').addEventListener('click',updateLearnerProfile);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();});
  window.addEventListener('beforeunload',stopCamera);
  window.addEventListener('hashchange',()=>switchPage(location.hash.slice(1)||'home'));
}

function initialize() {
  syncLearnerControls();
  restorePracticedWordLessons();
  if(!hasPersistentStorage())byId('profilePrivacyNote').textContent='تعذر التخزين الدائم في هذا المتصفح. قد يضيع ملف التعلم عند إغلاق الصفحة؛ نزّل نسخة احتياطية من صفحة الأمان.';
  setupEvents();renderProfile();
  const page=location.hash.slice(1);switchPage(page||'home');
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}

initialize();
