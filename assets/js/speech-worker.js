import {env,pipeline} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1';

env.allowLocalModels=false;
env.useBrowserCache=true;

let recognizer=null;
let activeDevice='wasm';

async function initialize() {
  if(recognizer)return;
  const progress_callback=info=>self.postMessage({type:'progress',info});
  const options={dtype:'q8',progress_callback};
  if(self.navigator?.gpu) {
    try {
      recognizer=await pipeline('automatic-speech-recognition','Xenova/whisper-small',{...options,device:'webgpu'});
      activeDevice='webgpu';
      self.postMessage({type:'ready',device:activeDevice});
      return;
    } catch(error) {
      self.postMessage({type:'fallback',message:'لم يتوفر تسريع الرسوميات؛ نتابع باستخدام معالج الجهاز.'});
      recognizer=null;
    }
  }
  recognizer=await pipeline('automatic-speech-recognition','Xenova/whisper-small',{...options,device:'wasm'});
  activeDevice='wasm';
  self.postMessage({type:'ready',device:activeDevice});
}

self.addEventListener('message',async event=>{
  const message=event.data||{};
  if(message.type==='init') {
    try {await initialize();}
    catch(error) {self.postMessage({type:'error',message:error?.message||'تعذر تحميل نموذج التعرف الصوتي.'});}
    return;
  }
  if(message.type==='transcribe') {
    try {
      if(!recognizer)await initialize();
      const audio=new Float32Array(message.audio);
      const result=await recognizer(audio,{task:'transcribe'});
      self.postMessage({type:'transcript',id:message.id,text:String(result?.text||'').trim(),device:activeDevice});
    } catch(error) {
      self.postMessage({type:'transcript-error',id:message.id,message:error?.message||'تعذر فهم هذا المقطع الصوتي.'});
    }
  }
});
