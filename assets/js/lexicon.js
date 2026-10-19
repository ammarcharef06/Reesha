const rows = [
  ['a','أداة تأتي غالباً قبل اسم مفرد في أمثلة المبتدئين.','I see a cat.','أرى قطة.','أَ'],
  ['am','تأتي مع I لتكوين I am: أنا…','I am happy.','أنا سعيد / سعيدة.','أَم'],
  ['apple','تفاحة؛ تبدأ بحرف A.','An apple is red.','التفاحة حمراء.','أَبُل'],
  ['ball','كرة؛ تبدأ بصوت B.','I see a ball.','أرى كرة.','بول'],
  ['banana','موزة.','A yellow banana.','موزة صفراء.','بَنانا'],
  ['bed','سرير.','The cat is on the bed.','القطة على السرير.','بِد'],
  ['bird','طائر.','A bird can fly.','يمكن للطائر أن يطير.','بِرد'],
  ['blue','أزرق.','The cup is blue.','الكوب أزرق.','بلو'],
  ['book','كتاب.','This is a book.','هذا كتاب.','بُك'],
  ['bread','خبز.','I want bread.','أريد خبزاً.','برِد'],
  ['bottle','قارورة.','A bottle of water.','قارورة ماء.','بوتل'],
  ['boy','ولد.','The boy has a book.','مع الولد كتاب.','بوي'],
  ['brother','أخ.','My brother is kind.','أخي لطيف.','برَذَر'],
  ['bus','حافلة.','The bus is big.','الحافلة كبيرة.','بَس'],
  ['cake','كعكة.','A small cake.','كعكة صغيرة.','كيك'],
  ['car','سيارة.','The car is red.','السيارة حمراء.','كار'],
  ['cat','قطة.','I see a cat.','أرى قطة.','كات'],
  ['chair','كرسي.','This is a chair.','هذا كرسي.','تشير'],
  ['cheese','جبن.','I like cheese.','أحب الجبن.','تشيز'],
  ['chicken','دجاج.','The chicken is here.','الدجاج هنا.','تشيكن'],
  ['child','طفل.','The child is happy.','الطفل سعيد.','تشايلد'],
  ['clock','ساعة حائط.','Look at the clock.','انظر إلى الساعة.','كلوك'],
  ['cold','بارد.','The water is cold.','الماء بارد.','كولد'],
  ['come','تعال / تعالي.','Come here.','تعال إلى هنا.','كَم'],
  ['cow','بقرة.','A cow says moo.','تقول البقرة موو.','كاو'],
  ['cup','كوب.','A cup of water.','كوب ماء.','كَپ'],
  ['dad','أبي / بابا.','This is my dad.','هذا أبي.','داد'],
  ['day','يوم.','Have a good day.','أتمنى لك يوماً طيباً.','داي'],
  ['desk','مكتب.','The book is on the desk.','الكتاب على المكتب.','دِسك'],
  ['dog','كلب.','The dog is happy.','الكلب سعيد.','دوغ'],
  ['door','باب.','Open the door.','افتح الباب.','دور'],
  ['duck','بطة.','A yellow duck.','بطة صفراء.','دَك'],
  ['eat','يأكل / تأكل.','I eat an apple.','آكل تفاحة.','إيت'],
  ['egg','بيضة.','One egg.','بيضة واحدة.','إيغ'],
  ['eye','عين.','I have two eyes.','لدي عينان.','آي'],
  ['family','عائلة.','I love my family.','أحب عائلتي.','فاميلي'],
  ['father','أب.','My father is here.','أبي هنا.','فاذَر'],
  ['fish','سمكة.','I see a fish.','أرى سمكة.','فِش'],
  ['five','خمسة.','Five books.','خمسة كتب.','فايف'],
  ['flower','زهرة.','A red flower.','زهرة حمراء.','فلاوَر'],
  ['food','طعام.','The food is good.','الطعام جيد.','فود'],
  ['four','أربعة.','Four cats.','أربع قطط.','فور'],
  ['friend','صديق / صديقة.','You are my friend.','أنت صديقي.','فرِند'],
  ['girl','بنت / فتاة.','The girl has a ball.','مع الفتاة كرة.','غيرل'],
  ['go','اذهب / اذهبي.','Let us go.','هيا نذهب.','غو'],
  ['good','جيد / طيب.','Good morning.','صباح الخير.','غود'],
  ['goodbye','إلى اللقاء؛ نقولها عند الوداع.','Goodbye, my friend.','إلى اللقاء يا صديقي.','غُدباي'],
  ['grandfather','جد.','My grandfather is kind.','جدي لطيف.','غراندفاذَر'],
  ['grandmother','جدة.','My grandmother is kind.','جدتي لطيفة.','غراند مَذَر'],
  ['green','أخضر.','The frog is green.','الضفدع أخضر.','غرين'],
  ['happy','سعيد / سعيدة.','I am happy.','أنا سعيد / سعيدة.','هابي'],
  ['hat','قبعة.','A blue hat.','قبعة زرقاء.','هات'],
  ['hello','مرحباً؛ تحية عند اللقاء.','Hello, friend!','مرحباً يا صديقي!','هَلو'],
  ['help','مساعدة.','Can you help me?','هل تستطيع مساعدتي؟','هِلپ'],
  ['here','هنا.','Come here.','تعال إلى هنا.','هير'],
  ['home','منزل / بيت.','I am at home.','أنا في البيت.','هوم'],
  ['horse','حصان.','A brown horse.','حصان بني.','هورس'],
  ['house','بيت.','This is my house.','هذا بيتي.','هاوس'],
  ['i','أنا. نكتب I كبيرة عندما تعني المتكلم.','I am happy.','أنا سعيد / سعيدة.','آي'],
  ['is','فعل مساعد في أمثلة مثل This is a book.','This is a cat.','هذه قطة.','إز'],
  ['jump','اقفز / يقفز.','The cat can jump.','تستطيع القطة القفز.','جَمپ'],
  ['key','مفتاح.','A small key.','مفتاح صغير.','كي'],
  ['kind','لطيف / طيب.','You are kind.','أنت لطيف.','كايند'],
  ['kite','طائرة ورقية.','The kite is up.','الطائرة الورقية عالية.','كايت'],
  ['leg','ساق.','A cat has four legs.','للقطة أربع قوائم.','ليغ'],
  ['like','يحب / أحب.','I like apples.','أحب التفاح.','لايك'],
  ['little','صغير.','A little bird.','طائر صغير.','لِتل'],
  ['look','انظر / أنظر.','Look at the flower.','انظر إلى الزهرة.','لوك'],
  ['milk','حليب.','I drink milk.','أشرب الحليب.','مِلك'],
  ['mom','أمي / ماما.','This is my mom.','هذه أمي.','مام'],
  ['monkey','قرد.','A funny monkey.','قرد مضحك.','مَنكي'],
  ['moon','قمر.','The moon is bright.','القمر ساطع.','مون'],
  ['mother','أم.','My mother is here.','أمي هنا.','مَذَر'],
  ['mouse','فأر.','A small mouse.','فأر صغير.','ماوس'],
  ['mouth','فم.','Open your mouth.','افتح فمك.','ماوث'],
  ['my','لي / خاصتي.','My book.','كتابي.','ماي'],
  ['name','اسم.','My name is…','اسمي هو…','نايم'],
  ['new','جديد.','A new word.','كلمة جديدة.','نيو'],
  ['no','لا.','No, thank you.','لا، شكراً.','نو'],
  ['one','واحد.','One apple.','تفاحة واحدة.','وَن'],
  ['orange','برتقالة؛ واللون البرتقالي.','An orange is orange.','البرتقالة برتقالية.','أورِنج'],
  ['please','من فضلك؛ كلمة للطلب بلطف.','Water, please.','ماء من فضلك.','بليز'],
  ['play','العب / يلعب.','Let us play.','هيا نلعب.','بلاي'],
  ['purple','بنفسجي.','A purple flower.','زهرة بنفسجية.','پِرپل'],
  ['rabbit','أرنب.','A little rabbit.','أرنب صغير.','رابِت'],
  ['red','أحمر.','The apple is red.','التفاحة حمراء.','رِد'],
  ['run','اركض / يركض.','I can run.','أستطيع الركض.','رَن'],
  ['sad','حزين / حزينة.','The boy is sad.','الولد حزين.','ساد'],
  ['school','مدرسة.','I go to school.','أذهب إلى المدرسة.','سكول'],
  ['seven','سبعة.','Seven days.','سبعة أيام.','سِڤن'],
  ['she','هي.','She is happy.','هي سعيدة.','شي'],
  ['sister','أخت.','My sister is kind.','أختي لطيفة.','سِستَر'],
  ['six','ستة.','Six pencils.','ستة أقلام رصاص.','سِكس'],
  ['small','صغير.','A small cup.','كوب صغير.','سمول'],
  ['star','نجمة.','A bright star.','نجمة لامعة.','ستار'],
  ['stop','قف / يتوقف.','Stop here.','قف هنا.','ستاپ'],
  ['sun','شمس.','The sun is up.','الشمس طالعة.','سَن'],
  ['table','طاولة.','The cup is on the table.','الكوب على الطاولة.','تيبُل'],
  ['thank','جزء من عبارة thank you للشكر.','Thank you!','شكراً لك!','ثانك'],
  ['the','أداة تعريف «الـ» في بعض الجمل.','The cat is here.','القطة هنا.','ذَ'],
  ['three','ثلاثة.','Three books.','ثلاثة كتب.','ثري'],
  ['to','إلى؛ وتأتي أيضاً قبل الفعل في بعض الأمثلة.','Go to school.','اذهب إلى المدرسة.','تو'],
  ['toy','لعبة.','My toy is red.','لعبتي حمراء.','توي'],
  ['two','اثنان.','Two birds.','طائران.','تو'],
  ['up','فوق / إلى الأعلى.','Look up.','انظر إلى الأعلى.','أپ'],
  ['water','ماء.','I want water.','أريد ماءً.','ووتر'],
  ['we','نحن.','We can learn.','نستطيع أن نتعلم.','وي'],
  ['where','أين؛ نستخدمها للسؤال عن المكان.','Where is my book?','أين كتابي؟','وِير'],
  ['white','أبيض.','A white cat.','قطة بيضاء.','وايت'],
  ['window','نافذة.','Open the window.','افتح النافذة.','وِندو'],
  ['yellow','أصفر.','A yellow banana.','موزة صفراء.','يِلو'],
  ['yes','نعم.','Yes, please.','نعم، من فضلك.','يِس'],
  ['you','أنت / أنتم.','You are kind.','أنت لطيف.','يو'],
  ['black','أسود.','A black cat.','قطة سوداء.','بلاك'],
  ['bag','حقيبة.','This is my bag.','هذه حقيبتي.','باغ'],
  ['box','صندوق.','The toy is in the box.','اللعبة داخل الصندوق.','بوكس'],
  ['drink','يشرب / اشرب.','I drink water.','أشرب ماءً.','درِنك'],
  ['ear','أذن.','I hear with my ears.','أسمع بأذني.','إير'],
  ['goat','ماعز.','A goat is an animal.','الماعز حيوان.','غوت'],
  ['head','رأس.','Touch your head.','المس رأسك.','هِد'],
  ['hand','يد.','Raise your hand.','ارفع يدك.','هاند'],
  ['insect','حشرة.','An insect is small.','الحشرة صغيرة.','إنسِكت'],
  ['nose','أنف.','A nose is on the face.','الأنف في الوجه.','نوز'],
  ['pencil','قلم رصاص.','I have a pencil.','لدي قلم رصاص.','پِنسل'],
  ['pen','قلم.','This is my pen.','هذا قلمي.','پِن'],
  ['queen','ملكة.','The queen has a crown.','لدى الملكة تاج.','كوين'],
  ['teacher','معلّم / معلّمة.','The teacher has a book.','لدى المعلّم كتاب.','تيتشر'],
  ['tired','متعب / متعبة.','I am tired.','أنا متعب / متعبة.','تايرد'],
  ['calm','هادئ / هادئة.','The bird is calm.','الطائر هادئ.','كام'],
  ['van','شاحنة صغيرة.','The van is white.','الشاحنة الصغيرة بيضاء.','ڤان'],
  ['zoo','حديقة حيوان.','We see animals at the zoo.','نرى حيوانات في حديقة الحيوان.','زو'],
  ['under','تحت.','The cat is under the table.','القطة تحت الطاولة.','أندر'],
  ['on','على.','The cup is on the table.','الكوب على الطاولة.','أون'],
  ['in','في / داخل.','The toy is in the box.','اللعبة داخل الصندوق.','إن'],
  ['what','ما / ماذا؛ للسؤال عن شيء.','What is this?','ما هذا؟','وَت'],
  ['not','ليس / لا؛ تأتي بعد be في هذا المثال.','I am not sad.','لست حزيناً.','نات'],
  ['are','تأتي مع you في You are.','You are kind.','أنت لطيف.','آر'],
  ['understand','يفهم / أفهم.','I understand.','أنا أفهم.','أندرستاند'],
  ['want','يريد / أريد.','I want water.','أريد ماءً.','وَنت'],
  ['flag','علم.','The flag is red.','العلم أحمر.','فلاغ'],
  ['frog','ضفدع.','A green frog.','ضفدع أخضر.','فراغ'],
  ['ship','سفينة.','The ship is big.','السفينة كبيرة.','شِپ'],
  ['chin','ذقن.','Touch your chin.','المس ذقنك.','تشِن'],
  ['thin','نحيف / رقيق.','The book is thin.','الكتاب رقيق.','ثِن'],
  ['this','هذا / هذه؛ للإشارة إلى شيء قريب.','This is a book.','هذا كتاب.','ذِس'],
  ['cape','عباءة / رداء.','The hero has a cape.','للبطل رداء.','كيب'],
  ['map','خريطة.','Look at the map.','انظر إلى الخريطة.','ماب'],
  ['sit','يجلس / اجلس.','Sit on the chair.','اجلس على الكرسي.','سِت'],
  ['pin','دبوس.','A small pin.','دبوس صغير.','پِن'],
  ['hot','حار.','The tea is hot.','الشاي حار.','هات'],
  ['sunset','غروب الشمس.','The sky is red at sunset.','السماء حمراء عند الغروب.','سَن سِت'],
];

const aliasPairs = [
  ['قطة','cat'],['قطه','cat'],['القط','cat'],['قطة صغيرة','cat'],['كرة','ball'],['تفاحة','apple'],['موزة','banana'],['موز','banana'],['سرير','bed'],['طائر','bird'],['عصفور','bird'],['أزرق','blue'],['ازرق','blue'],['كتاب','book'],['الكتاب','book'],['خبز','bread'],['قارورة','bottle'],['زجاجة','bottle'],['ولد','boy'],['أخ','brother'],['اخ','brother'],['حافلة','bus'],['كعكة','cake'],['سيارة','car'],['كرسي','chair'],['جبن','cheese'],['دجاج','chicken'],['طفل','child'],['ساعة','clock'],['بارد','cold'],['بقرة','cow'],['كوب','cup'],['اب','dad'],['أبي','dad'],['بابا','dad'],['يوم','day'],['مكتب','desk'],['كلب','dog'],['باب','door'],['بطة','duck'],['يأكل','eat'],['بيضة','egg'],['عين','eye'],['عائلة','family'],['أب','father'],['سمكة','fish'],['خمسة','five'],['زهرة','flower'],['طعام','food'],['أربعة','four'],['صديق','friend'],['صديقة','friend'],['بنت','girl'],['فتاة','girl'],['جيد','good'],['إلى اللقاء','goodbye'],['جد','grandfather'],['جدة','grandmother'],['أخضر','green'],['اخضر','green'],['سعيد','happy'],['سعيدة','happy'],['قبعة','hat'],['مرحبا','hello'],['مرحباً','hello'],['أهلا','hello'],['اهلا','hello'],['مساعدة','help'],['هنا','here'],['بيت','home'],['منزل','house'],['حصان','horse'],['انا','i'],['أنا','i'],['هي','she'],['أمي','mom'],['ماما','mom'],['أم','mother'],['امي','mom'],['أين','where'],['اين','where'],['لا','no'],['نعم','yes'],['واحد','one'],['اثنان','two'],['اثنين','two'],['ثلاثة','three'],['أحمر','red'],['احمر','red'],['أرجواني','purple'],['بنفسجي','purple'],['أرنب','rabbit'],['حزين','sad'],['مدرسة','school'],['أخت','sister'],['اخت','sister'],['ستة','six'],['صغير','small'],['شمس','sun'],['طاولة','table'],['شكرا','thank you'],['شكراً','thank you'],['شكرا لك','thank you'],['من فضلك','please'],['رجاء','please'],['ماء','water'],['أريد','want'],['اريد','want'],['أحب','like'],['احب','like'],['أريد ماء','i want'],['هذا','this is'],['هذه','this is'],['أنا سعيد','i am'],['انا سعيد','i am'],['صباح الخير','good morning'],['مع السلامة','goodbye'],['وداعا','goodbye'],['وداعاً','goodbye'],['النافذة','window'],['نافذة','window'],['أصفر','yellow'],['اصفر','yellow'],['أبيض','white'],['ابيض','white'],['لعبة','toy'],['نجمة','star'],['قمر','moon'],['عين','eye'],['يد','hand'],['يدٌ','hand'],['كتاب صغير','book'],['أذن','ear'],['اذن','ear'],['رأس','head'],['راس','head'],['قلم رصاص','pencil'],['حقيبة','bag'],['معلم','teacher'],['معلّم','teacher'],['معلمة','teacher'],['متعب','tired'],['متعبة','tired'],['هادئ','calm'],['هادئة','calm'],['أسود','black'],['اسود','black'],['يشرب','drink'],['أنف','nose'],['انف','nose'],['حشرة','insect'],['ماعز','goat'],['ملك','queen'],['شاحنة صغيرة','van'],['حديقة حيوان','zoo'],['تحت','under'],['على','on'],['في','in'],['ماذا','what'],['ليس','not'],['قلم','pen'],['صندوق','box'],['سفينة','ship'],['ضفدع','frog'],['ذقن','chin'],['نحيف','thin'],['إبريق','jug'],
];

const phraseRows = [
  ['good morning','صباح الخير','تحية نقولها في الصباح.','Good morning!','صباح الخير!'],
  ['thank you','شكراً لك','عبارة للشكر.','Thank you for helping me.','شكراً لأنك ساعدتني.'],
  ['i am','أنا','بداية جملة قصيرة للتعريف بالنفس أو وصف الحال.','I am happy.','أنا سعيدة / سعيد.'],
  ['this is','هذا / هذه','عبارة للإشارة إلى غرض أو تقديمه.','This is a book.','هذا كتاب.'],
  ['i want','أريد','بداية طلب بسيط.','I want water.','أريد ماءً.'],
  ['where is','أين','بداية سؤال عن مكان شيء.','Where is the cat?','أين القطة؟'],
  ['i see','أرى','أقولها عندما أرى شيئاً.','I see a bird.','أرى طائراً.'],
  ['you are','أنت','عبارة قصيرة لمخاطبة شخص.','You are kind.','أنت لطيف.'],
  ['come here','تعال إلى هنا','طلب بسيط للحضور إلى مكان قريب.','Come here, please.','تعال إلى هنا من فضلك.'],
  ['let us play','هيا نلعب','دعوة إلى اللعب.','Let us play!','هيا نلعب!'],
];

export const entries = new Map(rows.map(([en,ar,ex,exAr,say])=>[en,{en,ar,ex,exAr,say,known:true}]));
export const phrases = new Map(phraseRows.map(([en,ar,ex,example,exampleAr])=>[en,{en,ar,ex,example,exampleAr,known:true,kind:'phrase'}]));
export const arabicToEnglish = new Map(aliasPairs.map(([ar,en])=>[normalize(ar),en]));
export const objectLabels = new Map([
  ['bicycle','دراجة'],['car','سيارة'],['motorcycle','دراجة نارية'],['airplane','طائرة'],['bus','حافلة'],['train','قطار'],['truck','شاحنة'],['boat','قارب'],['traffic light','إشارة مرور'],['fire hydrant','صنبور إطفاء'],['stop sign','لوحة توقف'],['parking meter','عداد مواقف السيارات'],['bench','مقعد'],['bird','طائر'],['cat','قطة'],['dog','كلب'],['horse','حصان'],['sheep','خروف'],['cow','بقرة'],['elephant','فيل'],['bear','دب'],['zebra','حمار وحشي'],['giraffe','زرافة'],['backpack','حقيبة ظهر'],['umbrella','مظلة'],['handbag','حقيبة يد'],['tie','ربطة عنق'],['suitcase','حقيبة سفر'],['frisbee','قرص طائر'],['skis','زلاجات'],['snowboard','لوح تزلج ثلجي'],['sports ball','كرة'],['kite','طائرة ورقية'],['baseball bat','مضرب بيسبول'],['baseball glove','قفاز بيسبول'],['skateboard','لوح تزلج'],['surfboard','لوح ركوب الأمواج'],['tennis racket','مضرب تنس'],['bottle','قارورة'],['wine glass','كأس'],['cup','كوب'],['fork','شوكة'],['knife','سكين'],['spoon','ملعقة'],['bowl','وعاء'],['banana','موزة'],['apple','تفاحة'],['sandwich','شطيرة'],['orange','برتقالة'],['broccoli','بروكلي'],['carrot','جزرة'],['hot dog','شطيرة نقانق'],['pizza','بيتزا'],['donut','كعكة دائرية'],['cake','كعكة'],['chair','كرسي'],['couch','أريكة'],['potted plant','نبتة في أصيص'],['bed','سرير'],['dining table','طاولة طعام'],['toilet','مرحاض'],['tv','تلفاز'],['laptop','حاسوب محمول'],['mouse','فأرة حاسوب'],['remote','جهاز تحكم'],['keyboard','لوحة مفاتيح'],['cell phone','هاتف محمول'],['microwave','ميكروويف'],['oven','فرن'],['toaster','محمصة خبز'],['sink','مغسلة'],['refrigerator','ثلاجة'],['book','كتاب'],['clock','ساعة'],['vase','مزهرية'],['scissors','مقص'],['teddy bear','دب محشو'],['hair drier','مجفف شعر'],['toothbrush','فرشاة أسنان'],
]);

export function normalize(value='') {
  return String(value).toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ًٌٍَُِّْـ]/g,'').replace(/[.,!?;:،؛؟()[\]{}"“”‘’]/g,' ').replace(/\s+/g,' ').trim();
}
export function detectDirection(value='') {const a=(String(value).match(/[\u0600-\u06FF]/g)||[]).length;const e=(String(value).match(/[A-Za-z]/g)||[]).length;return a>e?'ar-en':'en-ar';}
export function tokenize(value='') {return String(value).match(/[A-Za-z]+(?:['’][A-Za-z]+)?|[\u0600-\u06FF]+/g)||[];}
export function lookup(token) {
  const key=normalize(token);const direct=entries.get(key);if(direct)return direct;
  const english=arabicToEnglish.get(key);if(english==='thank you')return phrases.get(english);if(english==='this is'||english==='i am'||english==='i want')return phrases.get(english);
  return english?entries.get(english)||null:null;
}
export function lookupPhrase(text) {
  const key=normalize(text);const direct=phrases.get(key);if(direct)return direct;
  for(const p of phrases.values())if(normalize(p.ar)===key)return p;
  return null;
}
function editDistance(a,b) {const prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let diagonal=prev[0];prev[0]=i;for(let j=1;j<=b.length;j++){const old=prev[j];prev[j]=Math.min(prev[j]+1,prev[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1));diagonal=old;}}return prev[b.length];}
export function suggest(token) {
  const key=normalize(token);if(key.length<3)return [];
  const candidates=new Set([...entries.keys(),...arabicToEnglish.keys()]);
  return [...candidates].map(word=>({word,score:editDistance(key,word)})).filter(item=>item.score>0&&item.score<=Math.min(2,Math.floor(key.length*.3))).sort((a,b)=>a.score-b.score).slice(0,3).map(item=>item.word);
}
export function explainText(text) {
  const phrase=lookupPhrase(text);if(phrase)return [ {...phrase,token:text} ];
  const results=[];for(const token of tokenize(text).slice(0,24)){const found=lookup(token);const id=normalize(token);if(results.some(item=>normalize(item.token)===id))continue;if(found)results.push({...found,token});else results.push({token,known:false,suggestions:suggest(token)});}
  return results;
}
export function answerQuestion(question,focusEntries=[]) {
  const q=normalize(question),english=(String(question).match(/[A-Za-z]/g)||[]).length>(String(question).match(/[\u0600-\u06FF]/g)||[]).length;
  const stop=new Set(['what','does','do','mean','means','meaning','the','word','how','spell','write','letter','letters','say','slowly','slow','please','give','me','an','a','example','sentence','it','is','in','english','my','can','you','ما','ماذا','معنى','معني','الكلمة','كلمه','كيف','اكتب','تكتب','حروف','حرف','مثال','جملة','ببطء','قل','قولي','لو','سمحت','ترجم','عن','هي','هو']);
  const focus=focusEntries.find(item=>item.known);
  const candidates=tokenize(question).filter(token=>!stop.has(normalize(token))).map(token=>lookup(token)).filter(Boolean);
  const found=candidates.at(-1)||focus||null;
  if(/spell|write|letter|تهج|اكتب|تكتب|حروف|كيف.*كتب/.test(q))return found?(english?`It is spelled ${[...found.en].join(' ')}. The word is ${found.en}.`:`تُكتب هكذا: ${found.en}. الحروف: ${[...found.en].join('، ')}.`):(english?'Type or show me a short word, and I can help spell it if it is in my beginner dictionary.':'اكتب كلمة قصيرة أو امسحها، وسأساعدك في تهجئتها إذا كانت في دروسي.');
  if(/example|sentence|مثال|جملة|جمل/.test(q))return found?(english?`A simple example is: ${found.ex||found.example||found.en}. It means ${found.exAr||found.exampleAr||found.ar}.`:`مثال صغير: ${found.ex||found.example||found.en}. — ${found.exAr||found.exampleAr||found.ar}`):(english?'Choose a word I know, and I can give you a simple example.':'اختر كلمة معروفة لريشة لأعطيك مثالاً بسيطاً.');
  if(/slow|slowly|ببطء|بطيء|بطيئ/.test(q))return found?(english?`Let us say it slowly: ${[...found.en].join(' … ')}. It means ${found.ar}.`:`لنقلها ببطء: ${[...found.en].join(' … ')}. معناها ${found.ar}.`):(english?'Give me a word first, and I can break it into letters.':'أرسل كلمة أولاً، وسأقسمها إلى حروف.');
  if(/meaning|mean|تعني|معنى|تعن|ما معنى|ترجم|what is/.test(q))return found?(english?`${found.en} means ${found.ar}. ${found.ex||''}`:`${found.en} تعني «${found.ar}». ${found.ex||''}`):(english?'I do not know that word yet. Try a beginner lesson word or check its spelling.':'لا أجد هذه الكلمة في قاموسي الصغير بعد. جرّب كلمة من الدروس أو صحح كتابتها.');
  if(found)return english?`${found.en} means ${found.ar}. You can ask me for its meaning, spelling, or an example.`:`${found.en} تعني «${found.ar}». اسألني عن معناها أو تهجئتها أو مثال عليها.`;
  if(/hello|hi|مرحبا|مرحب|اهلا|أهلا|سلام/.test(q))return english?'Hello! I am Reesha. Ask me about a short word in Arabic or English.':'Hello! أنا ريشة. اسألني عن كلمة قصيرة بالعربية أو الإنجليزية.';
  return english?'I learn beginner words with you in Arabic and English. I will tell you when I do not know an answer.':'أتعلم معك الكلمات الأساسية بالعربية والإنجليزية. سأخبرك عندما لا أعرف الإجابة.';
}
