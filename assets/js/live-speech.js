const TARGET_RATE=16000;
const WAKE_THRESHOLD=0.012;
const MAX_WAKE_MS=9000;
const MAX_PUSH_MS=15000;

function resample(input,sourceRate,targetRate) {
  if(sourceRate===targetRate)return input;
  const length=Math.round(input.length*targetRate/sourceRate),output=new Float32Array(length),ratio=sourceRate/targetRate;
  for(let i=0;i<length;i++) {
    const position=i*ratio,left=Math.floor(position),fraction=position-left;
    output[i]=(input[left]||0)*(1-fraction)+(input[Math.min(left+1,input.length-1)]||0)*fraction;
  }
  return output;
}

function joinFrames(frames) {
  const length=frames.reduce((sum,frame)=>sum+frame.length,0),result=new Float32Array(length);let offset=0;
  for(const frame of frames){result.set(frame,offset);offset+=frame.length;}
  return result;
}

export class LiveSpeech {
  constructor({onTranscript=()=>{},onStatus=()=>{},onLevel=()=>{}}={}) {
    this.onTranscript=onTranscript;this.onStatus=onStatus;this.onLevel=onLevel;
    this.worker=null;this.workerReady=false;this.workerFailed=false;this.workerPromise=null;
    this.active=false;this.paused=false;this.wakeEnabled=true;this.pushRecording=false;this.transcribing=false;
    this.queue=[];this.requestId=0;this.pending=new Map();this.sourceRate=48000;
    this.audioContext=null;this.source=null;this.processor=null;this.mute=null;
    this.preRoll=[];this.wakeFrames=[];this.wakeActive=false;this.wakeElapsed=0;this.silenceElapsed=0;this.noiseFloor=0.003;
    this.pushFrames=[];this.pushElapsed=0;this.lastTranscript='';
  }

  start(stream) {
    if(this.active)return Promise.resolve();
    const audioTrack=stream?.getAudioTracks?.()[0];
    if(!audioTrack)throw new Error('لم يصل إذن الميكروفون. أوقف الجلسة وتحقق من إذن الصوت.');
    this.active=true;this.paused=false;this.workerFailed=false;
    this.ensureWorker();
    try {
      const AudioContextClass=window.AudioContext||window.webkitAudioContext;
      if(!AudioContextClass)throw new Error('متصفحك لا يدعم تحليل الصوت محلياً. استخدم الكتابة بدلاً من الصوت.');
      this.audioContext=new AudioContextClass();this.sourceRate=this.audioContext.sampleRate;
      this.source=this.audioContext.createMediaStreamSource(stream);
      this.processor=this.audioContext.createScriptProcessor(4096,1,1);
      this.mute=this.audioContext.createGain();this.mute.gain.value=0;
      this.processor.onaudioprocess=event=>this.handleAudio(event.inputBuffer.getChannelData(0));
      this.source.connect(this.processor);this.processor.connect(this.mute);this.mute.connect(this.audioContext.destination);
      const audioReady=this.audioContext.resume();
      this.onStatus({state:'loading',message:'يُحمّل Whisper الصغير متعدد اللغات على هذا الجهاز لأول مرة.'});
      return Promise.all([this.workerPromise,audioReady]).then(()=>{
        if(this.audioContext?.state!=='running')throw new Error('تعذر تشغيل الصوت في المتصفح. اضغط بدء الجلسة مجدداً أو استخدم الكتابة.');
      }).catch(error=>{this.active=false;this.cleanupAudio();throw error;});
    } catch(error) {
      this.active=false;this.cleanupAudio();throw error;
    }
  }

  ensureWorker() {
    if(this.workerPromise)return this.workerPromise;
    this.workerPromise=new Promise((resolve,reject)=>{
      try {
        this.worker=new Worker(new URL('./speech-worker.js',import.meta.url),{type:'module'});
        this.worker.onmessage=event=>this.handleWorkerMessage(event.data||{},resolve,reject);
        this.worker.onerror=event=>{this.workerFailed=true;this.onStatus({state:'error',message:'تعذر تشغيل نموذج الصوت في هذا المتصفح.'});reject(new Error(event.message||'تعذر تشغيل نموذج الصوت.'));};
        this.worker.postMessage({type:'init'});
      } catch(error) {this.workerFailed=true;reject(error);}
    });
    this.workerPromise.catch(()=>{});
    return this.workerPromise;
  }

  handleWorkerMessage(message,resolve,reject) {
    if(message.type==='progress') {
      const info=message.info||{};
      if(info.status==='progress'||info.status==='progress_total')this.onStatus({state:'loading',progress:info.progress,message:`تنزيل نموذج الصوت… ${Math.round(info.progress||0)}٪`});
      else if(info.status==='initiate')this.onStatus({state:'loading',message:'يجري تجهيز ملفات نموذج الصوت.'});
      else if(info.status==='ready')this.onStatus({state:'loading',message:'تجري تهيئة التعرف المحلي.'});
      return;
    }
    if(message.type==='fallback')this.onStatus({state:'loading',message:message.message});
    if(message.type==='ready') {
      this.workerReady=true;this.workerFailed=false;
      this.onStatus({state:'ready',device:message.device,message:message.device==='webgpu'?'التعرف الصوتي المحلي جاهز، مع تسريع الجهاز.':'التعرف الصوتي المحلي جاهز.'});
      resolve?.();this.processQueue();return;
    }
    if(message.type==='error') {
      this.workerFailed=true;this.onStatus({state:'error',message:message.message});reject?.(new Error(message.message));return;
    }
    if(message.type==='transcript'||message.type==='transcript-error') {
      const resolveRequest=this.pending.get(message.id);this.pending.delete(message.id);
      if(message.type==='transcript')resolveRequest?.(message.text);
      else {this.onStatus({state:'error',message:message.message});resolveRequest?.('');}
    }
  }

  handleAudio(buffer) {
    if(!this.active||this.paused||this.workerFailed)return;
    const frame=new Float32Array(buffer),rms=Math.sqrt(frame.reduce((sum,value)=>sum+value*value,0)/Math.max(1,frame.length));
    this.onLevel(Math.min(1,rms*18));
    if(!this.workerReady)return;
    if(this.pushRecording) {
      this.pushFrames.push(frame);this.pushElapsed+=frame.length/this.sourceRate*1000;
      if(this.pushElapsed>=MAX_PUSH_MS)this.stopPushToTalk();
      return;
    }
    if(this.transcribing)return;
    const frameMs=frame.length/this.sourceRate*1000;
    if(!this.wakeEnabled)return;
    const threshold=Math.max(WAKE_THRESHOLD,this.noiseFloor*3.1);
    const hasVoice=rms>threshold;
    if(!hasVoice&&!this.wakeActive)this.noiseFloor=Math.min(.02,this.noiseFloor*.96+rms*.04);
    if(!this.wakeActive) {
      this.preRoll.push(frame);if(this.preRoll.length>5)this.preRoll.shift();
      if(!hasVoice)return;
      this.wakeActive=true;this.wakeFrames=[...this.preRoll];this.wakeElapsed=this.wakeFrames.reduce((sum,item)=>sum+item.length/this.sourceRate*1000,0);this.silenceElapsed=0;
    } else {
      this.wakeFrames.push(frame);this.wakeElapsed+=frameMs;
      this.silenceElapsed=hasVoice?0:this.silenceElapsed+frameMs;
    }
    if(this.silenceElapsed>=760||this.wakeElapsed>=MAX_WAKE_MS)this.finishWakePhrase();
  }

  finishWakePhrase() {
    if(!this.wakeActive)return;
    const frames=this.wakeFrames;this.wakeActive=false;this.wakeFrames=[];this.wakeElapsed=0;this.silenceElapsed=0;this.preRoll=[];
    if(frames.length)this.enqueue(joinFrames(frames),'wake');
  }

  startPushToTalk() {
    if(!this.active||!this.workerReady||this.workerFailed)return false;
    this.preRoll=[];this.wakeFrames=[];this.wakeActive=false;this.pushFrames=[];this.pushElapsed=0;this.pushRecording=true;
    this.onStatus({state:'recording',message:'تحدّث الآن. اضغط زر الإرسال عندما تنتهي.'});return true;
  }

  stopPushToTalk() {
    if(!this.pushRecording)return;
    this.pushRecording=false;const frames=this.pushFrames;this.pushFrames=[];
    if(this.pushElapsed<280){this.pushElapsed=0;this.onStatus({state:this.wakeEnabled?'ready':'paused',message:'لم أسمع عبارة كافية. جرّب مرة أخرى أو استخدم كلمة النداء.'});return;}
    this.pushElapsed=0;this.enqueue(joinFrames(frames),'push');
  }

  setWakeEnabled(enabled) {
    this.wakeEnabled=Boolean(enabled);this.preRoll=[];this.wakeFrames=[];this.wakeActive=false;this.wakeElapsed=0;this.silenceElapsed=0;
    this.onStatus({state:this.wakeEnabled?'ready':'paused',message:this.wakeEnabled?'ريشة تستمع محلياً إلى كلمة «ريشة» أو “Reesha”.':'توقّف الاستماع لكلمة النداء.'});
  }

  enqueue(audio,source) {
    if(!this.workerReady||this.workerFailed)return;
    if(this.queue.length>=2)this.queue.shift();
    this.queue.push({audio:resample(audio,this.sourceRate,TARGET_RATE),source});this.processQueue();
  }

  processQueue() {
    if(this.transcribing||!this.workerReady||!this.worker||!this.queue.length)return;
    const item=this.queue.shift();this.transcribing=true;
    this.onStatus({state:'transcribing',source:item.source,message:'أفهم عبارتك محلياً…'});
    const id=++this.requestId;
    this.pending.set(id,text=>{
      this.transcribing=false;
      const transcript=String(text||'').trim();
      if(transcript&&transcript!==this.lastTranscript){this.lastTranscript=transcript;this.onTranscript({text:transcript,source:item.source});}
      this.onStatus({state:this.wakeEnabled?'ready':'paused',message:this.wakeEnabled?'ريشة تستمع محلياً إلى كلمة «ريشة» أو “Reesha”.':'استمع إلى ريشة أو استخدم زر التحدث.'});
      this.processQueue();
    });
    this.worker.postMessage({type:'transcribe',id,audio:item.audio.buffer},[item.audio.buffer]);
  }

  pause() {this.paused=true;this.pushRecording=false;this.pushFrames=[];this.wakeFrames=[];this.wakeActive=false;this.onLevel(0);}
  resume() {if(this.active){this.paused=false;this.onStatus({state:this.wakeEnabled?'ready':'paused',message:this.wakeEnabled?'ريشة تستمع محلياً إلى كلمة «ريشة» أو “Reesha”.':'استمع إلى ريشة أو استخدم زر التحدث.'});}}

  cleanupAudio() {
    if(this.processor){this.processor.onaudioprocess=null;try{this.processor.disconnect();}catch{}}
    try{this.source?.disconnect();}catch{}
    try{this.mute?.disconnect();}catch{}
    if(this.audioContext&&this.audioContext.state!=='closed')this.audioContext.close().catch(()=>{});
    this.audioContext=null;this.source=null;this.processor=null;this.mute=null;
  }

  stop() {
    this.active=false;this.paused=true;this.pushRecording=false;this.queue=[];this.pending.clear();this.transcribing=false;
    this.preRoll=[];this.wakeFrames=[];this.pushFrames=[];this.wakeActive=false;this.cleanupAudio();this.onLevel(0);
    this.onStatus({state:'stopped',message:'توقفت الجلسة؛ الكاميرا والميكروفون مغلقان.'});
  }

  shutdown() {this.stop();this.worker?.terminate();this.worker=null;this.workerReady=false;this.workerPromise=null;}
}
