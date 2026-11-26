/* แบบสำรวจ DLTV 2570 — หน้าโรงเรียน (ต้องโหลด config.js, common.js, engine.js ก่อน) */
{
const TVS=[['ok','ใช้ได้ปกติ'],['repair','ชำรุดซ่อมได้'],['broken','ชำรุดใช้ไม่ได้'],['none','ไม่มี']];
const STS=[['floor_ok','ตั้งพื้น ใช้ได้'],['wall_ok','ติดผนัง ใช้ได้'],['broken','ชำรุด'],['none','ไม่มี']];
const IRDS=[['ok','ใช้ได้'],['broken','ชำรุด'],['none','ไม่มี']];
const CAB=[['ok','มี'],['broken','ชำรุด'],['none','ไม่มี']];
const DISH=[['ok','ใช้ได้ปกติ'],['weak','สัญญาณไม่ดี'],['broken','ชำรุดใช้ไม่ได้'],['none','ไม่มี']];
const PCC=[['ok','ใช้ได้'],['slow','ช้ามาก'],['broken','ชำรุด']];
const STEPS=[
 ['s1','ข้อมูลพื้นฐาน','ข้อมูลโรงเรียนและผู้ประสานงาน'],
 ['s2','การใช้ DLTV','สถานะ รูปแบบตารางสอน และช่องทางรับชม'],
 ['s3','บริบทโรงเรียน','การเดินทาง ไฟฟ้า อินเทอร์เน็ต และบุคลากร'],
 ['s4','การใช้รายชั้น','จำนวนคาบที่ใช้ DLTV ต่อสัปดาห์'],
 ['s5','ห้องเรียนและอุปกรณ์','ทีวี ขาตั้ง และกล่องรับสัญญาณรายห้อง'],
 ['s6','จานดาวเทียม','จานรับสัญญาณรายอาคาร'],
 ['s7','คอมพิวเตอร์','โน้ตบุ๊กและคอมพิวเตอร์สำหรับการสอน'],
 ['s8','ประวัติและความต้องการ','อุปกรณ์ที่เคยได้รับและที่ต้องการ'],
 ['s9','ตรวจทานและรับรอง','ตรวจความครบถ้วนและรับรองข้อมูล']];
let cfg=JSON.parse(JSON.stringify(DEF)),S=blank(),cur='s1',dirty=false,saving=false,tried={},verifyTel='';
function blank(){return{v:1,status:'draft',coord:[{},{}],grades:G.map(()=>({open:false})),subj:{},rooms:[{}],buildings:[{}],pcs:[],history:[],circuits:[],channels:[],elecSrc:[],pcUse:[],req:{},cert:{}}}
function getP(o,k){return k.split('.').reduce((a,s)=>a==null?a:a[s],o)}
function setP(o,k,v){const p=k.split('.');let a=o;p.slice(0,-1).forEach((s,i)=>{if(a[s]==null)a[s]=/^\d+$/.test(p[i+1])?[]:{};a=a[s]});a[p[p.length-1]]=v}
const opt=(arr,b='— เลือก —')=>`<option value="">${b}</option>`+arr.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
const inp=(k,l,o={})=>`<label class="f ${o.w||''}"><span>${l}${o.req?' <b class="req">*</b>':''}</span><input data-k="${k}" type="${o.t||'text'}" ${o.t==='number'?'min="0" step="any" inputmode="decimal"':''} ${o.ph?`placeholder="${o.ph}"`:''} ${o.im?`inputmode="${o.im}"`:''}></label>`;
const rad=(k,l,arr,req)=>`<fieldset class="f wide" data-f="${k}"><legend>${l}${req?' <b class="req">*</b>':''}</legend><div class="opts">${arr.map(([v,t])=>`<label class="opt"><input type="radio" name="${k}" data-k="${k}" value="${v}">${t}</label>`).join('')}</div></fieldset>`;
const chk=(k,l,arr)=>`<fieldset class="f wide"><legend>${l}</legend><div class="opts">${arr.map(([v,t])=>`<label class="opt"><input type="checkbox" data-k="${k}" data-multi value="${v}">${t}</label>`).join('')}</div></fieldset>`;
const sel=(k,arr)=>`<select data-k="${k}">${opt(arr,'—')}</select>`;
const DYN={
 circuits:[['type','ประเภท (Fiber, ADSL, ดาวเทียม, 4G/5G)'],['isp','ผู้ให้บริการ'],['down','Download (Mbps)','n'],['up','Upload (Mbps)','n']],
 rooms:[['bld','อาคารที่','n'],['grades','ชั้นที่เรียนในห้อง'],['students','นักเรียน','n'],['tv','ทีวี: สภาพ',TVS],['size','ขนาด (นิ้ว)','n'],['year','ปีที่ได้รับ (พ.ศ.)','n'],['stand','ขาตั้ง/ขาแขวน',STS],['ird','กล่อง IRD',IRDS],['cable','สายสัญญาณจากจาน',CAB]],
 buildings:[['rooms','ห้องที่ใช้ DLTV','n'],['dishes','จาน (ชุด)','n'],['band','ชนิด',[['C','C-Band'],['KU','KU-Band']]],['size','ขนาดจาน'],['dish','สภาพจาน',DISH],['lnb','LNB/มัลติสวิตช์',IRDS],['year','ปีที่ติดตั้ง (พ.ศ.)','n']],
 pcs:[['type','ประเภท',[['nb','โน้ตบุ๊ก'],['pc','เดสก์ท็อป'],['tab','แท็บเล็ต']]],['owner','เจ้าของ',[['school','โรงเรียน'],['teacher','ครู']]],['year','ปีที่ได้มา (พ.ศ.)','n'],['cond','สภาพ',PCC],['use','ใช้ทำอะไรกับ DLTV']],
 history:[['year','ปี (พ.ศ.)','n'],['org','หน่วยงานที่ให้'],['item','อุปกรณ์'],['qty','จำนวน','n']]};
const DYNL={circuits:'วงจรที่',rooms:'ห้องที่',buildings:'อาคารที่',pcs:'เครื่องที่',history:'รายการที่'};
const DYNE={circuits:'ยังไม่มีวงจร',pcs:'ยังไม่มีเครื่อง ถ้าไม่มีให้เว้นไว้',history:'ยังไม่มีรายการ'};
function field(name,i,c){const k=`${name}.${i}.${c[0]}`;return c[2]==='n'?`<input type="number" min="0" inputmode="decimal" data-k="${k}">`:Array.isArray(c[2])?`<select data-k="${k}">${opt(c[2])}</select>`:`<input type="text" data-k="${k}">`}
function dynTable(name){const cols=DYN[name],rows=S[name],L=DYNL[name];
 return`<div class="rows">${rows.length?rows.map((r,i)=>`<div class="rowcard rise"><div class="rc-h"><span class="rc-n">${L} ${i+1}</span><button type="button" class="btn sm ghost" data-del="${name}" data-i="${i}" aria-label="ลบ${L} ${i+1}">ลบ</button></div><div class="grid">${cols.map(c=>`<label class="f"><span>${c[1]}</span>${field(name,i,c)}</label>`).join('')}</div></div>`).join(''):`<div class="empty-row">${DYNE[name]||''}</div>`}</div><button type="button" class="btn" data-add="${name}">+ เพิ่ม${L.replace('ที่','')}</button>`}
function renderDyn(name){const el=document.getElementById('d-'+name);if(!el)return;if(!Array.isArray(S[name]))S[name]=[];el.innerHTML=dynTable(name);fill(el)}
const head=(id)=>{const i=STEPS.findIndex(s=>s[0]===id),s=STEPS[i];return`<header class="sh"><span class="num">${i+1}</span><div><h2>${s[1]}</h2><p class="muted">${s[2]}</p></div></header>`};

function sectionsHTML(){
 const gradeRows=G.map((g,i)=>`<tr><td><b>${g}</b></td><td><input type="checkbox" data-k="grades.${i}.open" aria-label="เปิดสอน ${g}"></td><td><input type="number" min="0" data-k="grades.${i}.students" aria-label="นักเรียน ${g}"></td><td class="n">${cfg.A[i]}</td><td><input type="number" min="0" data-k="grades.${i}.B" aria-label="คาบที่ใช้ ${g}"></td><td class="n" id="pc${i}">–</td></tr>`).join('');
 const mtx=(lbl,from,to,list)=>`<h3 style="margin-top:18px">${lbl}</h3><div class="scroll"><table class="tbl mtx"><thead><tr><th>ชั้น</th>${list.map(s=>`<th>${s}</th>`).join('')}</tr></thead><tbody>${G.slice(from,to).map((g,j)=>`<tr><td>${g}</td>${list.map((s,si)=>`<td>${sel(`subj.${from+j}.${si}`,[['✓','✓'],['◐','◐'],['✗','✗']])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 return`
 <section class="step card" data-step="s1">${head('s1')}
  <div class="grid">${inp('code','รหัสโรงเรียน (10 หลัก)',{req:1,ph:'เช่น 1010720001',im:'numeric'})}${inp('name','ชื่อโรงเรียน',{req:1})}${inp('tambon','ตำบล')}${inp('amphoe','อำเภอ')}${inp('province','จังหวัด',{req:1})}${inp('zip','รหัสไปรษณีย์',{im:'numeric'})}${inp('phone','โทรศัพท์โรงเรียน',{t:'tel'})}${inp('lat','ละติจูด',{im:'decimal'})}${inp('lng','ลองจิจูด',{im:'decimal'})}${inp('students','นักเรียนทั้งหมด (คน)',{t:'number'})}</div>
  ${rad('affil','สังกัด',[['obec','สพฐ.'],['bpp','ตชด.'],['lao','อปท.'],['private','เอกชน'],['other','อื่น ๆ']],1)}
  ${chk('levels','ระดับที่เปิดสอน',[['k','อนุบาล'],['p','ประถมศึกษา'],['m','มัธยมศึกษาตอนต้น']])}
  <h3 class="sub">ผู้ประสานงาน</h3>
  <p class="muted small">เบอร์มือถือของผู้ประสานงานคนที่ 1 ใช้ยืนยันตัวตนเมื่อกลับมาแก้ไขข้อมูล</p>
  ${[0,1].map(i=>`<div class="grid">${inp(`coord.${i}.name`,`คนที่ ${i+1} ชื่อ–นามสกุล`,{req:!i})}${inp(`coord.${i}.pos`,'ตำแหน่ง')}${inp(`coord.${i}.tel`,'มือถือ',{t:'tel',req:!i})}${inp(`coord.${i}.email`,'อีเมล',{t:'email'})}${inp(`coord.${i}.line`,'LINE ID')}</div>`).join('')}
 </section>
 <section class="step card" data-step="s2">${head('s2')}
  ${rad('use','2.1 สถานะการใช้ DLTV ในปัจจุบัน',[['a','ก. ใช้ DLTV ในการเรียนการสอน'],['b','ข. เคยใช้ แต่หยุดใช้ทั้งหมดหรือบางชั้นเพราะอุปกรณ์ชำรุด'],['c','ค. ไม่ใช้ DLTV']],1)}
  <div class="panel warn hide" id="useB">กรอกส่วนที่ 4 ตามตารางสอนที่ใช้ก่อนอุปกรณ์ชำรุด และแนบลิงก์รูปอุปกรณ์ที่ชำรุดในขั้นที่ 8 มูลนิธิฯ จะตรวจสอบก่อนจัดสรร</div>
  <div class="panel hide" id="useC"><b>ไม่ต้องกรอกข้อมูลส่วนอื่น</b> รับรองข้อมูลด้านล่าง แล้วกด "ส่งแบบสำรวจ" ได้เลย</div>
  <div id="s2more"><div class="grid">${inp('years','2.2 ใช้ DLTV มาแล้ว (ปี)',{t:'number'})}</div>
  ${rad('sched','2.3 รูปแบบการจัดตารางสอน',[['origin','ตามตารางออกอากาศของโรงเรียนต้นทาง'],['own','ปรับตามบริบทของโรงเรียน']],1)}
  ${chk('channels','2.4 ช่องทางรับชม (เลือกได้หลายข้อ)',[['sat','จานดาวเทียม'],['live','อินเทอร์เน็ต รับชมสด'],['vod','อินเทอร์เน็ต รับชมย้อนหลัง'],['other','อื่น ๆ']])}</div>
  <div id="certSlot2"></div>
 </section>
 <section class="step card" data-step="s3">${head('s3')}
  <h3 class="sub">3.1 การเดินทาง</h3><div class="grid">${inp('dist','ระยะทางจากอำเภอ (กม.)',{t:'number'})}${inp('hours','เวลาเดินทาง (ชั่วโมง)',{t:'number'})}${inp('closedMonths','เดือนที่เข้าถึงยาก (ถ้ามี)')}</div>
  ${rad('road','พื้นผิวถนนช่วงที่แย่ที่สุด',[['paved','คอนกรีต/ลาดยาง'],['laterite','ลูกรัง'],['dirt','ดิน'],['other','อื่น ๆ']],1)}
  ${rad('vehicle','พาหนะที่เข้าถึงได้',[['all','รถทุกประเภท'],['4wd','เฉพาะรถขับเคลื่อน 4 ล้อ'],['moto','จักรยานยนต์/เดินเท้าเท่านั้น'],['boat','ทางเรือ']],1)}
  <h3 class="sub">3.2 ระบบไฟฟ้า</h3>
  ${rad('elec','สถานะไฟฟ้า',[['yes','มีไฟฟ้าใช้'],['no','ไม่มีไฟฟ้าใช้']],1)}
  ${chk('elecSrc','แหล่งไฟฟ้า',[['pea','การไฟฟ้าส่วนภูมิภาค'],['solar','โซลาร์เซลล์'],['gen','เครื่องปั่นไฟ'],['other','อื่น ๆ']])}
  <div class="grid">${inp('solarKw','โซลาร์เซลล์ (กิโลวัตต์)',{t:'number'})}${inp('genKw','เครื่องปั่นไฟ (กิโลวัตต์)',{t:'number'})}</div>
  ${rad('elecStable','ความเสถียร',[['stable','เสถียร'],['unstable','ไม่เสถียร (ไฟตก/ดับเกินร้อยละ 20 ของเวลาเรียน)']])}
  ${chk('protect','ระบบป้องกัน',[['ground','สายดิน'],['lightning','ระบบป้องกันฟ้าผ่า']])}
  <h3 class="sub">3.3 อินเทอร์เน็ต</h3>
  ${rad('net','อินเทอร์เน็ต',[['none','ไม่มี'],['yes','มี']],1)}
  <div id="netBox"><div id="d-circuits"></div>
  ${rad('netQual','รับชม DLTV ผ่านอินเทอร์เน็ตได้',[['smooth','ลื่นไหล'],['some','สะดุดบางครั้ง'],['no','ใช้ไม่ได้']])}</div>
  <h3 class="sub">3.4 บุคลากร</h3>
  ${rad('director','ผู้บริหารสถานศึกษา',[['yes','มี'],['acting','ไม่มี (มีผู้รักษาการ)']],1)}
  ${rad('itTeacher','ครูผู้ดูแลระบบ IT/DLTV',[['yes','มี'],['no','ไม่มี']])}
  <div class="grid">${inp('teachers','ครูผู้สอนทั้งหมด (คน)',{t:'number',req:1})}${inp('dltvTeachers','ครูที่ใช้ DLTV (คน)',{t:'number'})}</div>
 </section>
 <section class="step card" data-step="s4">${head('s4')}
  <div class="panel small">ติ๊กชั้นที่เปิดสอน แล้วกรอกจำนวนคาบที่ใช้ DLTV จริงต่อสัปดาห์ (B) ไม่เกินคาบที่ออกอากาศ (A) นับทั้งการรับชมสดและย้อนหลัง</div>
  <div class="scroll"><table class="tbl stack" id="gtbl"><thead><tr><th>ชั้น</th><th>เปิดสอน</th><th>นักเรียน (คน)</th><th class="n">คาบออกอากาศ (A)</th><th>คาบที่ใช้จริง (B)</th><th class="n">% การใช้</th></tr></thead><tbody>${gradeRows}</tbody><tfoot><tr><th>รวม</th><th></th><th id="sumSt"></th><th class="n" id="sumA"></th><th id="sumB"></th><th class="n" id="sumP"></th></tr></tfoot></table></div>
  <details class="more"><summary>4.2 รายละเอียดรายวิชา (✓ ใช้ทุกคาบ · ◐ ใช้บางคาบ · ✗ ไม่ใช้)</summary>
  ${mtx('ก. อนุบาล',0,3,SUB.k)}${mtx('ข. ประถมศึกษา',3,9,SUB.p)}${mtx('ค. มัธยมศึกษาตอนต้น',9,12,SUB.m)}</details>
  <div class="grid">${inp('timetableLink','4.3 ลิงก์ตารางสอน (Google Drive หรืออื่น ๆ)',{t:'url',w:'wide',req:1,ph:'https://'})}</div>
 </section>
 <section class="step card" data-step="s5">${head('s5')}
  <div class="panel small">1 แถวต่อ 1 ห้องเรียนที่ใช้ DLTV ไม่รวมห้องปฏิบัติการ ห้องคละชั้นให้ระบุทุกชั้น เช่น "ป.1–ป.2" ชั้นที่มีหลายห้องให้กรอกแยกแถว เช่น "ป.1/1"</div>
  <div id="d-rooms"></div>
 </section>
 <section class="step card" data-step="s6">${head('s6')}
  <div class="panel small">ลำดับแถวคือเลขอาคาร ใช้เลขเดียวกับคอลัมน์ "อาคารที่" ในขั้นที่ 5</div>
  <div id="d-buildings"></div>
  ${rad('rainLoss','สัญญาณหายเมื่อฝนตก',[['no','ไม่หาย'],['some','หายบางครั้ง'],['always','หายทุกครั้งที่ฝนตก']])}
 </section>
 <section class="step card" data-step="s7">${head('s7')}
  <div class="panel small">ระบุทุกเครื่องที่ใช้กับการสอน DLTV ถ้าไม่มีให้เว้นตารางว่าง</div>
  <div id="d-pcs"></div>
  ${chk('pcUse','การใช้งานกับ DLTV',[['vod','ต่อทีวีรับชมย้อนหลัง'],['media','ดาวน์โหลดใบงาน/สื่อ'],['prep','เตรียมการสอน'],['report','บันทึกผล/ส่งข้อมูล']])}
 </section>
 <section class="step card" data-step="s8">${head('s8')}
  <h3 class="sub">8.1 อุปกรณ์ที่ได้รับในรอบ 5 ปี</h3>
  <label class="opt"><input type="checkbox" data-k="neverReceived">ไม่เคยได้รับในรอบ 5 ปี</label>
  <div id="histBox" style="margin-top:10px"><div id="d-history"></div></div>
  <h3 class="sub">8.2 ความต้องการ</h3>
  <p class="muted small">ระบบคำนวณจำนวนที่ขาดจากขั้นที่ 5–7 ให้ หากต้องการน้อยกว่านั้นให้กรอกจำนวนที่ขอ (เว้นว่าง = ขอเท่าที่ขาด)</p>
  <div class="eqgrid">${EQ.map(([k,l,u])=>`<div class="eq"><span>${l}</span><b id="gap-${k}">0</b><small>${u}ที่ขาด</small><label class="small">จำนวนที่ขอ<input type="number" min="0" data-k="req.${k}" aria-label="จำนวนที่ขอ ${l}"></label></div>`).join('')}</div>
  <div class="grid">${inp('reqReason','เหตุผลประกอบ',{w:'wide'})}${inp('evidence','ลิงก์รูปถ่ายอุปกรณ์ที่ชำรุดหรือไม่มี',{t:'url',w:'wide',ph:'https://'})}</div>
  ${rad('care','มีผู้รับผิดชอบดูแลและจุดเก็บที่ปลอดภัย',[['yes','มี'],['no','ไม่มี']])}
 </section>
 <section class="step card" data-step="s9">${head('s9')}
  <div id="review"></div>
  <div id="certSlot9"><div id="certBox"><h3 class="sub">การรับรองข้อมูล</h3>
  <label class="opt block"><input type="checkbox" data-k="cert.agree"><span>ขอรับรองว่าข้อมูลทั้งหมดตรงกับความเป็นจริง และยินยอมให้มูลนิธิฯ ตรวจสอบข้อมูลและสถานที่ได้ <b class="req">*</b></span></label>
  <div class="grid">${inp('cert.filler','ผู้กรอกข้อมูล')}${inp('cert.fillerPos','ตำแหน่ง')}${inp('cert.director','ผู้อำนวยการสถานศึกษา (ชื่อ–นามสกุล)',{req:1})}${inp('cert.date','วันที่รับรอง',{t:'date'})}</div></div></div>
 </section>`}

/* ---------- render & bind ---------- */
function renderForm(){
 $('#sv').innerHTML=sectionsHTML();Object.keys(DYN).forEach(renderDyn);fill($('#sv'));
 $$('.step').forEach(s=>s.classList.toggle('on',s.dataset.step===cur));refresh();renderRail()}
function fill(root){root.querySelectorAll('[data-k]').forEach(el=>{const v=getP(S,el.dataset.k);if(el.type==='radio')el.checked=v===el.value;else if(el.type==='checkbox')el.checked=el.hasAttribute('data-multi')?(v||[]).includes(el.value):!!v;else el.value=v??''})}
function onEdit(e){const el=e.target,k=el.dataset&&el.dataset.k;if(!k)return;if(e.type==='input'&&(el.type==='radio'||el.type==='checkbox'||el.tagName==='SELECT'))return;
 if(el.type==='radio')setP(S,k,el.value);else if(el.type==='checkbox'){if(el.hasAttribute('data-multi')){const a=new Set(getP(S,k)||[]);el.checked?a.add(el.value):a.delete(el.value);setP(S,k,[...a])}else setP(S,k,el.checked)}
 else if(el.type==='number')setP(S,k,el.value===''?'':Number(el.value));else setP(S,k,el.value);
 el.classList.remove('invalid');el.closest('.invalid')?.classList.remove('invalid');
 if(!dirty){dirty=true;status('มีการแก้ไขที่ยังไม่บันทึก','warn')}refresh();if(k==='use'){if(!visible().includes(cur))cur='s2';renderRail()}}
$('#sv').addEventListener('input',onEdit);$('#sv').addEventListener('change',onEdit);
$('#sv').addEventListener('click',e=>{const b=e.target.closest('[data-add],[data-del]');if(!b)return;const a=b.dataset.add,d=b.dataset.del;
 if(a){S[a].push({});renderDyn(a)}else{S[d].splice(+b.dataset.i,1);renderDyn(d)}dirty=true;status('มีการแก้ไขที่ยังไม่บันทึก','warn');refresh()});

/* ---------- live figures ---------- */
function totals(){let sA=0,sB=0,sSt=0;G.forEach((g,i)=>{const r=S.grades[i]||{};if(r.open){const A=num(cfg.A[i]);sA+=A;sB+=Math.min(num(r.B),A);sSt+=num(r.students)}});return{sA,sB,sSt,p:sA?sB/sA*100:0}}
function refresh(){
 const t=totals();
 G.forEach((g,i)=>{const r=S.grades[i]||{},c=document.getElementById('pc'+i);if(!c)return;const A=num(cfg.A[i]);c.textContent=r.open&&A?fmt(Math.min(num(r.B),A)/A*100,2):'–';c.closest('tr').classList.toggle('off',!r.open)});
 if($('#sumA')){$('#sumA').textContent=fmt(t.sA);$('#sumB').textContent=fmt(t.sB);$('#sumSt').textContent=fmt(t.sSt);$('#sumP').textContent=t.sA?fmt(t.p,2):'–'}
 const r=evalSchool(S,cfg);EQ.forEach(([k])=>{const el=$('#gap-'+k);if(el)el.textContent=fmt(r.gap[k])});
 $('#useB')?.classList.toggle('hide',S.use!=='b');$('#useC')?.classList.toggle('hide',S.use!=='c');$('#s2more')?.classList.toggle('hide',S.use==='c');
 const cb=$('#certBox'),slot=$(S.use==='c'?'#certSlot2':'#certSlot9');if(cb&&slot&&cb.parentNode!==slot)slot.append(cb);
 $('#netBox')?.classList.toggle('hide',S.net==='none');$('#histBox')?.classList.toggle('hide',!!S.neverReceived);
 // ring
 const pct=t.sA?t.p:0,C=2*Math.PI*52;$('#ringFg').style.strokeDashoffset=String(C*(1-pct/100));
 $('#ringV').textContent=t.sA?fmt(pct,pct===100?0:1):'–';
 $('#ringG').textContent=S.use==='c'?'ไม่ใช้ DLTV':!t.sA?'ยังไม่ได้กรอกขั้นที่ 4':r.group?`กลุ่ม ${r.group}`:`ต่ำกว่า ${cfg.bands[4]}%`;
 $('#ringG').className='chip '+(r.group===1?'gold':r.group?'':'warn');
 $('#gapList').innerHTML=EQ.map(([k,l,u])=>`<li><span>${l}</span><b>${fmt(r.gap[k])}</b></li>`).join('');
 $('#mPct').textContent=t.sA?fmt(pct,1)+'%':'–';
 $('#stState').textContent=S.status==='submitted'?'ส่งแล้ว':'ฉบับร่าง';$('#stState').className='chip '+(S.status==='submitted'?'ok':'');
 if(cur==='s9')renderReview();
 renderRailMarks()}

/* ---------- validation ---------- */
function issues(){const m=[];const q=(c,sec,t,k)=>{if(!c)m.push({sec,t,k})};
 q(/^\d{10}$/.test(String(S.code||'')),'s1','รหัสโรงเรียน 10 หลัก','code');q(S.name,'s1','ชื่อโรงเรียน','name');q(S.province,'s1','จังหวัด','province');q(S.affil,'s1','สังกัด','affil');
 q(S.coord?.[0]?.name,'s1','ชื่อผู้ประสานงานคนที่ 1','coord.0.name');q(String(S.coord?.[0]?.tel||'').replace(/\D/g,'').length>=9,'s1','มือถือผู้ประสานงานคนที่ 1','coord.0.tel');
 q(S.use,'s2','สถานะการใช้ DLTV (2.1)','use');
 if(S.use&&S.use!=='c'){q(S.sched,'s2','รูปแบบตารางสอน (2.3)','sched');
  q(S.road,'s3','พื้นผิวถนน','road');q(S.vehicle,'s3','พาหนะที่เข้าถึงได้','vehicle');q(S.elec,'s3','สถานะไฟฟ้า','elec');q(S.net,'s3','อินเทอร์เน็ต','net');q(S.director,'s3','ผู้บริหารสถานศึกษา','director');q(S.teachers!==''&&S.teachers!=null,'s3','จำนวนครูผู้สอน','teachers');
  const og=S.grades.map((g,i)=>[g,i]).filter(([g])=>g.open);q(og.length,'s4','ติ๊กชั้นที่เปิดสอนอย่างน้อย 1 ชั้น','grades.0.open');
  og.forEach(([g,i])=>{q(g.B!==''&&g.B!=null,'s4',`คาบที่ใช้จริง (B) ชั้น ${G[i]}`,`grades.${i}.B`);q(g.students,'s4',`จำนวนนักเรียนชั้น ${G[i]}`,`grades.${i}.students`)});
  q(S.timetableLink,'s4','ลิงก์ตารางสอน (4.3)','timetableLink');
  q(S.rooms.some(r=>r.tv),'s5','ข้อมูลห้องเรียนอย่างน้อย 1 ห้อง พร้อมสภาพทีวี','rooms.0.tv');
  q(S.buildings.some(b=>b.dish),'s6','สภาพจานดาวเทียมอย่างน้อย 1 อาคาร','buildings.0.dish');
  if(S.use==='b')q(S.evidence,'s8','ลิงก์รูปอุปกรณ์ที่ชำรุด (กรณีข้อ 2.1 ข.)','evidence')}
 const cs=S.use==='c'?'s2':'s9';q(S.cert?.agree,cs,'ติ๊กรับรองข้อมูล','cert.agree');q(S.cert?.director,cs,'ชื่อผู้อำนวยการผู้รับรอง','cert.director');return m}
function markInvalid(list){$$('.invalid').forEach(e=>e.classList.remove('invalid'));list.filter(x=>tried[x.sec]).forEach(x=>{const el=document.querySelector(`[data-k="${x.k}"]`);if(!el)return;if(el.type==='radio'){el.closest('fieldset')?.classList.add('invalid')}else el.classList.add('invalid')})}
function renderReview(){const m=issues(),box=$('#review'),vs=visible();const by={};m.forEach(x=>(by[x.sec]=by[x.sec]||[]).push(x));
 const t=totals(),r=evalSchool(S,cfg);
 box.innerHTML=`<div class="sum"><div><span class="muted small">โรงเรียน</span><b>${esc(S.name||'–')}</b><span class="muted small">${esc(S.code||'')}</span></div><div><span class="muted small">% การใช้ DLTV</span><b>${S.use==='c'?'–':t.sA?fmt(t.p,2)+'%':'–'}</b><span class="muted small">${r.group?'กลุ่ม '+r.group:''}</span></div><div><span class="muted small">ห้องเรียน</span><b>${fmt(r.rooms)}</b><span class="muted small">ห้อง</span></div></div>
 ${m.length?`<div class="panel warn"><b>ยังขาดข้อมูล ${m.length} รายการ</b>${vs.filter(s=>by[s]).map(s=>{const st=STEPS.find(x=>x[0]===s);return`<div class="rv"><button type="button" class="btn sm" data-go="${s}">ขั้นที่ ${STEPS.indexOf(st)+1} ${st[1]}</button><ul>${by[s].map(x=>`<li>${esc(x.t)}</li>`).join('')}</ul></div>`}).join('')}</div>`:`<div class="panel ok"><b>ข้อมูลครบถ้วน</b> ตรวจทานแล้วกด "ส่งแบบสำรวจ" ได้เลย</div>`}`}
$('#sv').addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});

/* ---------- steps ---------- */
const visible=()=>S.use==='c'?['s1','s2']:STEPS.map(s=>s[0]);
function renderRail(){const vs=visible();
 $('#rail').innerHTML=STEPS.map(([id,t],i)=>`<li class="${vs.includes(id)?'':'skip'}"><button type="button" data-step="${id}" ${vs.includes(id)?'':'disabled'}><span class="dot">${i+1}</span><span class="lbl">${t}</span></button></li>`).join('');renderRailMarks()}
function renderRailMarks(){const m=issues(),cnt={};m.forEach(x=>cnt[x.sec]=(cnt[x.sec]||0)+1);
 $$('#rail button').forEach(b=>{const id=b.dataset.step;b.classList.toggle('on',id===cur);b.classList.toggle('done',!!tried[id]&&!cnt[id]);b.classList.toggle('bad',!!tried[id]&&!!cnt[id]);b.title=cnt[id]?`ขาด ${cnt[id]} รายการ`:''});
 const vs=visible(),i=vs.indexOf(cur);$('#prog i').style.width=((i+1)/vs.length*100)+'%';$('#stepNo').textContent=`ขั้นที่ ${i+1} จาก ${vs.length}`;
 $('#prev').disabled=i<=0;$('#next').classList.toggle('hide',i===vs.length-1);$('#submit').classList.toggle('hide',i!==vs.length-1);markInvalid(m)}
$('#rail').addEventListener('click',e=>{const b=e.target.closest('button[data-step]');if(b&&!b.disabled)go(b.dataset.step)});
function go(id){const vs=visible();if(!vs.includes(id))id=vs[vs.length-1];if(id===cur)return;const dir=vs.indexOf(id)>vs.indexOf(cur)?'inR':'inL';tried[cur]=true;
 const was=cur;cur=id;$$('.step').forEach(s=>{const on=s.dataset.step===id;s.classList.toggle('on',on);if(on){s.style.animation='none';void s.offsetWidth;s.style.animation=`${dir} .38s var(--ease) both`}});
 refresh();const top=$('#stage').getBoundingClientRect().top+scrollY-80;if(scrollY>top)scrollTo({top,behavior:'smooth'});
 if(dirty&&/^\d{10}$/.test(String(S.code||''))&&was!==id)save('',true)}
$('#prev').onclick=()=>{const vs=visible();go(vs[Math.max(0,vs.indexOf(cur)-1)])};
$('#next').onclick=()=>{const vs=visible();go(vs[Math.min(vs.length-1,vs.indexOf(cur)+1)])};
document.addEventListener('keydown',e=>{if(e.altKey&&e.key==='ArrowRight')$('#next').click();if(e.altKey&&e.key==='ArrowLeft')$('#prev').click()});

/* ---------- popup แจ้งสถานะ ---------- */
const ICON={loading:'<div class="mspin"></div>',ok:'<svg class="check anim" viewBox="0 0 84 84"><circle cx="42" cy="42" r="39"/><path d="M26 43 l11 11 l21 -23"/></svg>',
 err:'<svg class="mic err" viewBox="0 0 84 84"><circle cx="42" cy="42" r="39"/><path d="M30 30 L54 54 M54 30 L30 54"/></svg>',warn:'<svg class="mic warn" viewBox="0 0 84 84"><circle cx="42" cy="42" r="39"/><path d="M42 24 V48 M42 58 V60"/></svg>'};
let mTimer=null;
function modal({type='ok',title='',body='',actions,auto}={}){clearTimeout(mTimer);const m=$('#modal');
 $('#mIcon').innerHTML=ICON[type]||'';$('#mTitle').textContent=title;$('#mBody').innerHTML=body;m.dataset.type=type;
 const acts=actions||(type==='loading'?[]:[{label:'ตกลง',cls:'pri'}]);
 $('#mAct').innerHTML=acts.map((a,i)=>`<button type="button" class="btn ${a.cls||''}" data-i="${i}">${esc(a.label)}</button>`).join('');
 $$('#mAct button').forEach(b=>b.onclick=()=>{const a=acts[+b.dataset.i];closeModal();a.fn&&a.fn()});
 m.classList.remove('hide');const card=m.querySelector('.card');card.style.animation='none';void card.offsetWidth;card.style.animation='';
 setTimeout(()=>$('#mAct button')?.focus(),50);if(auto)mTimer=setTimeout(closeModal,auto)}
function closeModal(){clearTimeout(mTimer);$('#modal').classList.add('hide')}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&$('#modal').dataset.type!=='loading')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').classList.contains('hide')&&$('#modal').dataset.type!=='loading')closeModal()});

/* ---------- save / submit / load ---------- */
function status(t,kind=''){const el=$('#saveSt');el.textContent=t;el.className='st '+kind}
async function save(st,silent){if(saving)return false;
 if(!/^\d{10}$/.test(String(S.code||''))){if(!silent){tried.s1=true;go('s1');refresh();modal({type:'warn',title:'ยังบันทึกไม่ได้',body:'<p>กรุณากรอก <b>รหัสโรงเรียน 10 หลัก</b> ในขั้นที่ 1 ก่อน ระบบใช้รหัสนี้เป็นตัวระบุแบบสำรวจของโรงเรียน</p>'})}return false}
 saving=true;status('กำลังบันทึก…');if(!silent)modal({type:'loading',title:st==='submitted'?'กำลังส่งแบบสำรวจ…':'กำลังบันทึกร่าง…',body:'<p class="muted">กรุณารอสักครู่ อย่าปิดหน้านี้</p>'});
 try{const payload=JSON.parse(JSON.stringify(S));payload._verify=verifyTel;const r=await api('saveSurvey',payload,st||'');
  S.status=r.status;S.updatedAt=r.updatedAt;verifyTel=S.coord?.[0]?.tel||verifyTel;dirty=false;
  const tm=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});status('บันทึกแล้ว '+tm,'ok');refresh();
  if(!silent&&st!=='submitted')modal({type:'ok',title:'บันทึกร่างเรียบร้อย',body:`<p>บันทึกเมื่อ ${tm} น. กลับมากรอกต่อได้ด้วยรหัสโรงเรียนและเบอร์มือถือผู้ประสานงาน</p>`,auto:2200});
  else if(silent&&st!=='submitted')toast('บันทึกร่างอัตโนมัติแล้ว','ok');
  return true}
 catch(e){status('บันทึกไม่สำเร็จ','bad');modal({type:'err',title:silent&&st!=='submitted'?'บันทึกอัตโนมัติไม่สำเร็จ':'บันทึกไม่สำเร็จ',body:`<p>${esc(e.message||e)}</p><p class="muted small">ข้อมูลที่กรอกยังอยู่ในหน้านี้ ลองกด "บันทึกร่าง" อีกครั้ง</p>`,actions:[{label:'ลองใหม่',cls:'pri',fn:()=>save(st)},{label:'ปิด'}]});return false}
 finally{saving=false}}
$('#saveBtn').onclick=()=>save();
$('#submit').onclick=async()=>{visible().forEach(s=>tried[s]=true);const m=issues();
 if(m.length){refresh();const by={};m.forEach(x=>(by[x.sec]=by[x.sec]||[]).push(x));const vs=visible().filter(s=>by[s]);
  modal({type:'warn',title:`ยังขาดข้อมูล ${m.length} รายการ`,body:`<div class="mlist">${vs.map(s=>{const st=STEPS.find(x=>x[0]===s);return`<div><b>ขั้นที่ ${STEPS.indexOf(st)+1} ${st[1]}</b><ul>${by[s].map(x=>`<li>${esc(x.t)}</li>`).join('')}</ul></div>`}).join('')}</div>`,
   actions:[{label:`ไปแก้ขั้นที่ ${STEPS.findIndex(x=>x[0]===vs[0])+1}`,cls:'pri',fn:()=>go(vs[0])},{label:'ปิด'}]});return}
 if(await save('submitted'))showDone()};
function showDone(){const t=totals(),r=evalSchool(S,cfg);
 modal({type:'ok',title:'ส่งแบบสำรวจเรียบร้อย',body:`<p>ระบบได้รับแบบสำรวจของ <b>${esc(S.name||'')}</b> แล้ว</p>
 <div class="sum"><div><span class="muted small">% การใช้ DLTV</span><b>${S.use==='c'?'–':fmt(t.p,2)+'%'}</b></div><div><span class="muted small">กลุ่ม</span><b>${S.use==='c'?'–':r.group||'–'}</b></div><div><span class="muted small">ส่งเมื่อ</span><b>${new Date().toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'})}</b></div></div>
 <div class="panel small" style="text-align:left">แก้ไขได้จนถึงวันปิดรับ โดยใช้ <b>รหัสโรงเรียน ${esc(S.code)}</b> และ <b>เบอร์มือถือผู้ประสานงานคนที่ 1</b> ที่ "แก้ไขข้อมูลที่เคยกรอกไว้" ด้านบนของหน้า</div>`,actions:[{label:'เสร็จสิ้น',cls:'pri'}]})}
$('#lBtn').onclick=async()=>{const c=$('#lCode').value.trim(),t=$('#lTel').value.trim();
 if(!/^\d{10}$/.test(c)||t.replace(/\D/g,'').length<9){modal({type:'warn',title:'ข้อมูลไม่ครบ',body:'<p>กรอกรหัสโรงเรียน 10 หลัก และเบอร์มือถือผู้ประสานงานคนที่ 1</p>'});return}
 modal({type:'loading',title:'กำลังค้นหาข้อมูลเดิม…'});
 try{const d=await api('getSurvey',c,t);if(!d){modal({type:'err',title:'ไม่พบข้อมูล',body:'<p>ไม่พบแบบสำรวจของรหัสนี้ หรือเบอร์มือถือไม่ตรงกับที่บันทึกไว้</p>'});return}
  S=Object.assign(blank(),d);verifyTel=t;dirty=false;tried={};cur='s1';renderForm();status('โหลดข้อมูลเดิมแล้ว','ok');$('#edit').open=false;
  modal({type:'ok',title:'โหลดข้อมูลเดิมแล้ว',body:`<p><b>${esc(S.name||'')}</b><br>สถานะ: ${S.status==='submitted'?'ส่งแล้ว':'ฉบับร่าง'} · แก้ไขแล้วกดบันทึกหรือส่งใหม่ได้</p>`,auto:2600});$('#stage').scrollIntoView({behavior:'smooth'})}
 catch(e){modal({type:'err',title:'ค้นหาไม่สำเร็จ',body:`<p>${esc(e.message||e)}</p>`})}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});

/* ---------- boot ---------- */
mountLogos();$('#heroArt').innerHTML=WAVES;renderForm();
api('getConfig').then(c=>{cfg=Object.assign(JSON.parse(JSON.stringify(DEF)),c);renderForm();
 if(c.deadline){const d=new Date(c.deadline+'T00:00:00');$('#deadline').textContent='ปิดรับ '+d.toLocaleDateString('th-TH',{dateStyle:'long'});$('#deadline').classList.remove('hide');if(Date.now()>d.getTime()+86400000){$('#closed').classList.remove('hide')}}})
 .catch(e=>{const m=$('#cfgErr');m.classList.remove('hide');m.textContent='เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: '+(e.message||e)+' (กรอกได้ แต่ยังบันทึกไม่ได้จนกว่าจะเชื่อมต่อได้)'});
}
