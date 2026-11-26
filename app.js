/* แบบสำรวจ DLTV 2570 — ส่วนหน้า (frontend) เรียก Google Apps Script ผ่าน config.js */
{
const G=['อ.1','อ.2','อ.3','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','ม.1','ม.2','ม.3'];
const SUB={k:['เคลื่อนไหวและจังหวะ','เสริมประสบการณ์','ศิลปะสร้างสรรค์','เสรี/เล่นตามมุม','กลางแจ้ง','เกมการศึกษา'],
p:['ภาษาไทย','คณิตศาสตร์','วิทย์ฯ และเทคโนโลยี','สังคมศึกษาฯ','ประวัติศาสตร์','สุขศึกษาฯ','ศิลปะ','การงานอาชีพ','ภาษาอังกฤษ'],
m:['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์ฯ','วิทยาการคำนวณ','สังคมศึกษาฯ','ประวัติศาสตร์','สุขศึกษาฯ','ทัศนศิลป์','ดนตรี','นาฏศิลป์','การออกแบบฯ','การงานอาชีพ','ภาษาอังกฤษ']};
const subOf=gi=>gi<3?SUB.k:gi<9?SUB.p:SUB.m;
const DEF={A:[25,25,25,30,30,30,30,30,30,35,35,35],bands:[100,90,80,70,60],w:{room:40,age:15,access:15,net:10,hist:10,teach:10},nbPer:4,refYear:2569,stock:{tv:'',stand:'',dish:'',nb:''},deadline:''};
const EQ=[['tv','ทีวี','เครื่อง'],['stand','ขาตั้ง/ขาแขวน','ชุด'],['dish','จานดาวเทียม','ชุด'],['nb','โน้ตบุ๊ก','เครื่อง']];
const TVS=[['ok','ใช้ได้ปกติ'],['repair','ชำรุดซ่อมได้'],['broken','ชำรุดใช้ไม่ได้'],['none','ไม่มี']];
const STS=[['floor_ok','ตั้งพื้น ใช้ได้'],['wall_ok','ติดผนัง ใช้ได้'],['broken','ชำรุด'],['none','ไม่มี']];
const IRDS=[['ok','ใช้ได้'],['broken','ชำรุด'],['none','ไม่มี']];
const CAB=[['ok','มี'],['broken','ชำรุด'],['none','ไม่มี']];
const DISH=[['ok','ใช้ได้ปกติ'],['weak','สัญญาณไม่ดี'],['broken','ชำรุดใช้ไม่ได้'],['none','ไม่มี']];
const PCC=[['ok','ใช้ได้'],['slow','ช้ามาก'],['broken','ชำรุด']];
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=Number(v);return v===''||v==null||isNaN(n)?0:n};
const fmt=(n,d=0)=>Number(n).toLocaleString('th-TH',{minimumFractionDigits:d,maximumFractionDigits:d});
let db=null,user=null,uid=null,isAdmin=false,cfg=JSON.parse(JSON.stringify(DEF)),S=blank(),docPath=null,saveT=null,lastData=[],lastRes=null,dataSrc='';
function blank(){return{v:1,status:'draft',coord:[{},{}],grades:G.map(()=>({open:false})),subj:{},rooms:[{}],buildings:[{}],pcs:[],history:[],circuits:[],channels:[],elecSrc:[],pcUse:[],req:{},cert:{}}}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2600)}
function getP(o,k){return k.split('.').reduce((a,s)=>a==null?a:a[s],o)}
function setP(o,k,v){const p=k.split('.');let a=o;p.slice(0,-1).forEach((s,i)=>{if(a[s]==null)a[s]=/^\d+$/.test(p[i+1])?[]:{};a=a[s]});a[p[p.length-1]]=v}
const opt=(arr,blankLabel='— เลือก —')=>`<option value="">${blankLabel}</option>`+arr.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
function inp(k,l,o={}){return`<label class="f ${o.w||''}"><span>${l}${o.req?' <b class="req">*</b>':''}</span><input data-k="${k}" type="${o.t||'text'}" ${o.t==='number'?'min="0" step="any" inputmode="decimal"':''} ${o.ph?`placeholder="${o.ph}"`:''}></label>`}
function rad(k,l,arr,req,w='wide'){return`<fieldset class="f ${w}"><legend>${l}${req?' <b class="req">*</b>':''}</legend><div class="opts">${arr.map(([v,t])=>`<label class="opt"><input type="radio" name="${k}" data-k="${k}" value="${v}">${t}</label>`).join('')}</div></fieldset>`}
function chk(k,l,arr){return`<fieldset class="f wide"><legend>${l}</legend><div class="opts">${arr.map(([v,t])=>`<label class="opt"><input type="checkbox" data-k="${k}" data-multi value="${v}">${t}</label>`).join('')}</div></fieldset>`}
function sel(k,arr){return`<select data-k="${k}">${opt(arr,'—')}</select>`}

const SECS=[['s1','1 ข้อมูลพื้นฐาน'],['s2','2 การใช้ DLTV'],['s3','3 บริบทโรงเรียน'],['s4','4 การใช้รายชั้น'],['s5','5 ห้องเรียนและอุปกรณ์'],['s6','6 จานดาวเทียม'],['s7','7 โน้ตบุ๊ก'],['s8','8 ประวัติและความต้องการ'],['s9','9 รับรองข้อมูล']];
function dynTable(name,cols,rows){return`<div class="scroll"><table class="tbl stack"><thead><tr><th>#</th>${cols.map(c=>`<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td>${cols.map(c=>`<td>${c[2]==='n'?`<input type="number" min="0" data-k="${name}.${i}.${c[0]}">`:Array.isArray(c[2])?sel(`${name}.${i}.${c[0]}`,c[2]):`<input type="text" data-k="${name}.${i}.${c[0]}">`}</td>`).join('')}<td><button type="button" class="sm" data-del="${name}" data-i="${i}" aria-label="ลบแถว ${i+1}">ลบ</button></td></tr>`).join('')}</tbody></table></div><button type="button" class="sm" data-add="${name}" style="margin-top:8px">+ เพิ่มแถว</button>`}
const DYN={
 circuits:[['type','ประเภท (Fiber, ADSL, ดาวเทียม, 4G/5G)'],['isp','ผู้ให้บริการ'],['down','Download (Mbps)','n'],['up','Upload (Mbps)','n']],
 rooms:[['bld','อาคารที่','n'],['grades','ชั้นที่เรียนในห้อง'],['students','นักเรียน','n'],['tv','ทีวี: สภาพ',TVS],['size','ขนาด (นิ้ว)','n'],['year','ปีที่ได้รับ (พ.ศ.)','n'],['stand','ขาตั้ง/ขาแขวน',STS],['ird','กล่อง IRD',IRDS],['cable','สายสัญญาณจากจาน',CAB]],
 buildings:[['rooms','ห้องที่ใช้ DLTV','n'],['dishes','จาน (ชุด)','n'],['band','ชนิด',[['C','C-Band'],['KU','KU-Band']]],['size','ขนาดจาน'],['dish','สภาพจาน',DISH],['lnb','LNB/มัลติสวิตช์',IRDS],['year','ปีที่ติดตั้ง (พ.ศ.)','n']],
 pcs:[['type','ประเภท',[['nb','โน้ตบุ๊ก'],['pc','เดสก์ท็อป'],['tab','แท็บเล็ต']]],['owner','เจ้าของ',[['school','โรงเรียน'],['teacher','ครู']]],['year','ปีที่ได้มา (พ.ศ.)','n'],['cond','สภาพ',PCC],['use','ใช้ทำอะไรกับ DLTV']],
 history:[['year','ปี (พ.ศ.)','n'],['org','หน่วยงานที่ให้'],['item','อุปกรณ์'],['qty','จำนวน','n']]};
function renderDyn(name){const el=document.getElementById('d-'+name);if(!el)return;if(!Array.isArray(S[name]))S[name]=[];el.innerHTML=dynTable(name,DYN[name],S[name]);fill(el)}

function renderForm(){
 $('#toc').innerHTML=SECS.map(([id,t])=>`<a href="#${id}">${t}</a>`).join('')+`<div class="stat" id="fstat"></div>`;
 const gradeRows=G.map((g,i)=>`<tr><td>${g}</td><td><input type="checkbox" data-k="grades.${i}.open" aria-label="เปิดสอน ${g}"></td><td><input type="number" min="0" data-k="grades.${i}.students" aria-label="นักเรียน ${g}"></td><td class="n">${cfg.A[i]}</td><td><input type="number" min="0" data-k="grades.${i}.B" aria-label="คาบที่ใช้ ${g}"></td><td class="n" id="pc${i}">–</td></tr>`).join('');
 const mtx=(lbl,from,to,list)=>`<h3 style="margin-top:16px">${lbl}</h3><div class="scroll"><table class="tbl mtx"><thead><tr><th>ชั้น</th>${list.map(s=>`<th>${s}</th>`).join('')}</tr></thead><tbody>${G.slice(from,to).map((g,j)=>`<tr><td>${g}</td>${list.map((s,si)=>`<td>${sel(`subj.${from+j}.${si}`,[['✓','✓'],['◐','◐'],['✗','✗']])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 $('#sv').innerHTML=`
 <section class="sec" id="s1"><h2>ส่วนที่ 1 ข้อมูลพื้นฐานและผู้ประสานงาน</h2>
  <div class="grid">${inp('code','รหัสโรงเรียน (10 หลัก)',{req:1,ph:'เช่น 1010720001'})}${inp('name','ชื่อโรงเรียน',{req:1})}${inp('tambon','ตำบล')}${inp('amphoe','อำเภอ')}${inp('province','จังหวัด',{req:1})}${inp('zip','รหัสไปรษณีย์')}${inp('phone','โทรศัพท์',{t:'tel'})}${inp('lat','ละติจูด')}${inp('lng','ลองจิจูด')}${inp('students','นักเรียนทั้งหมด (คน)',{t:'number'})}</div>
  ${rad('affil','สังกัด',[['obec','สพฐ.'],['bpp','ตชด.'],['lao','อปท.'],['private','เอกชน'],['other','อื่น ๆ']],1)}
  ${chk('levels','ระดับที่เปิดสอน',[['k','อนุบาล'],['p','ประถมศึกษา'],['m','มัธยมศึกษาตอนต้น']])}
  <h3 style="margin-top:12px">ผู้ประสานงาน</h3>
  ${[0,1].map(i=>`<div class="grid">${inp(`coord.${i}.name`,`คนที่ ${i+1} ชื่อ–นามสกุล`,{req:!i})}${inp(`coord.${i}.pos`,'ตำแหน่ง')}${inp(`coord.${i}.tel`,'มือถือ',{t:'tel',req:!i})}${inp(`coord.${i}.email`,'อีเมล',{t:'email'})}${inp(`coord.${i}.line`,'LINE ID')}</div>`).join('')}
 </section>
 <section class="sec" id="s2"><h2>ส่วนที่ 2 การใช้ DLTV</h2>
  ${rad('use','2.1 สถานะการใช้ DLTV ในปัจจุบัน',[['a','ก. ใช้ DLTV ในการเรียนการสอน'],['b','ข. เคยใช้ แต่หยุดใช้ทั้งหมดหรือบางชั้นเพราะอุปกรณ์ชำรุด'],['c','ค. ไม่ใช้ DLTV (จบแบบสำรวจ ข้ามไปส่วนที่ 9)']],1)}
  <div class="panel hide" id="useB">กรอกส่วนที่ 4 ตามตารางสอนที่ใช้ก่อนอุปกรณ์ชำรุด และแนบรูปอุปกรณ์ที่ชำรุดในลิงก์หลักฐาน มูลนิธิฯ จะตรวจสอบก่อนจัดสรร</div>
  <div class="grid">${inp('years','2.2 ใช้ DLTV มาแล้ว (ปี)',{t:'number'})}</div>
  ${rad('sched','2.3 รูปแบบการจัดตารางสอน',[['origin','ตามตารางออกอากาศของโรงเรียนต้นทาง'],['own','ปรับตามบริบทของโรงเรียน']],1)}
  ${chk('channels','2.4 ช่องทางรับชม (เลือกได้หลายข้อ)',[['sat','จานดาวเทียม'],['live','อินเทอร์เน็ต รับชมสด'],['vod','อินเทอร์เน็ต รับชมย้อนหลัง'],['other','อื่น ๆ']])}
 </section>
 <div id="mainSecs">
 <section class="sec" id="s3"><h2>ส่วนที่ 3 บริบทของโรงเรียน</h2>
  <h3>3.1 การเดินทาง</h3><div class="grid">${inp('dist','ระยะทางจากอำเภอ (กม.)',{t:'number'})}${inp('hours','เวลาเดินทาง (ชั่วโมง)',{t:'number'})}${inp('closedMonths','เดือนที่เข้าถึงยาก (ถ้ามี)')}</div>
  ${rad('road','พื้นผิวถนนช่วงที่แย่ที่สุด',[['paved','คอนกรีต/ลาดยาง'],['laterite','ลูกรัง'],['dirt','ดิน'],['other','อื่น ๆ']],1)}
  ${rad('vehicle','พาหนะที่เข้าถึงได้',[['all','รถทุกประเภท'],['4wd','เฉพาะรถขับเคลื่อน 4 ล้อ'],['moto','จักรยานยนต์/เดินเท้าเท่านั้น'],['boat','ทางเรือ']],1)}
  <h3>3.2 ระบบไฟฟ้า</h3>
  ${rad('elec','สถานะไฟฟ้า',[['yes','มีไฟฟ้าใช้'],['no','ไม่มีไฟฟ้าใช้']],1)}
  ${chk('elecSrc','แหล่งไฟฟ้า',[['pea','การไฟฟ้าส่วนภูมิภาค'],['solar','โซลาร์เซลล์'],['gen','เครื่องปั่นไฟ'],['other','อื่น ๆ']])}
  <div class="grid">${inp('solarKw','โซลาร์เซลล์ (กิโลวัตต์)',{t:'number'})}${inp('genKw','เครื่องปั่นไฟ (กิโลวัตต์)',{t:'number'})}</div>
  ${rad('elecStable','ความเสถียร',[['stable','เสถียร'],['unstable','ไม่เสถียร (ไฟตก/ดับเกินร้อยละ 20 ของเวลาเรียน)']])}
  ${chk('protect','ระบบป้องกัน',[['ground','สายดิน'],['lightning','ระบบป้องกันฟ้าผ่า']])}
  <h3>3.3 อินเทอร์เน็ต</h3>
  ${rad('net','อินเทอร์เน็ต',[['none','ไม่มี'],['yes','มี']],1)}
  <div id="d-circuits"></div>
  ${rad('netQual','รับชม DLTV ผ่านอินเทอร์เน็ตได้',[['smooth','ลื่นไหล'],['some','สะดุดบางครั้ง'],['no','ใช้ไม่ได้']])}
  <h3>3.4 บุคลากร</h3>
  ${rad('director','ผู้บริหารสถานศึกษา',[['yes','มี'],['acting','ไม่มี (มีผู้รักษาการ)']],1)}
  ${rad('itTeacher','ครูผู้ดูแลระบบ IT/DLTV',[['yes','มี'],['no','ไม่มี']])}
  <div class="grid">${inp('teachers','ครูผู้สอนทั้งหมด (คน)',{t:'number',req:1})}${inp('dltvTeachers','ครูที่ใช้ DLTV (คน)',{t:'number'})}</div>
 </section>
 <section class="sec" id="s4"><h2>ส่วนที่ 4 การใช้ DLTV รายชั้น</h2>
  <p class="note">ติ๊กชั้นที่เปิดสอน แล้วกรอกจำนวนคาบที่ใช้ DLTV จริงต่อสัปดาห์ (B) ไม่เกินคาบที่ออกอากาศ (A) นับทั้งการรับชมสดและย้อนหลัง</p>
  <div class="scroll"><table class="tbl stack"><thead><tr><th>ชั้น</th><th>เปิดสอน</th><th>นักเรียน (คน)</th><th class="n">คาบออกอากาศ/สัปดาห์ (A)</th><th>คาบที่ใช้จริง (B)</th><th class="n">% การใช้</th></tr></thead><tbody>${gradeRows}<tr><th>รวม</th><th></th><th id="sumSt"></th><th class="n" id="sumA"></th><th id="sumB"></th><th class="n" id="sumP"></th></tr></tbody></table></div>
  <details style="margin-top:16px"><summary style="cursor:pointer;font-weight:600;min-height:44px;padding-top:8px">4.2 รายละเอียดรายวิชา (✓ ใช้ทุกคาบ · ◐ ใช้บางคาบ · ✗ ไม่ใช้)</summary>
  ${mtx('ก. อนุบาล',0,3,SUB.k)}${mtx('ข. ประถมศึกษา',3,9,SUB.p)}${mtx('ค. มัธยมศึกษาตอนต้น',9,12,SUB.m)}</details>
  <div class="grid">${inp('timetableLink','4.3 ลิงก์ตารางสอน (Google Drive หรืออื่น ๆ)',{t:'url',w:'wide',req:1})}</div>
 </section>
 <section class="sec" id="s5"><h2>ส่วนที่ 5 ห้องเรียนและอุปกรณ์รายห้อง</h2>
  <p class="note">1 แถวต่อ 1 ห้องเรียนที่ใช้ DLTV ไม่รวมห้องปฏิบัติการ ห้องคละชั้นให้ระบุทุกชั้น เช่น "ป.1–ป.2" ส่วนชั้นที่มีหลายห้องให้กรอกแยกแถว เช่น "ป.1/1"</p>
  <div id="d-rooms"></div>
 </section>
 <section class="sec" id="s6"><h2>ส่วนที่ 6 จานรับสัญญาณดาวเทียม (รายอาคาร)</h2>
  <p class="note">ลำดับแถวคือเลขอาคาร ใช้เลขเดียวกับคอลัมน์ "อาคารที่" ในส่วนที่ 5</p>
  <div id="d-buildings"></div>
  ${rad('rainLoss','สัญญาณหายเมื่อฝนตก',[['no','ไม่หาย'],['some','หายบางครั้ง'],['always','หายทุกครั้งที่ฝนตก']])}
 </section>
 <section class="sec" id="s7"><h2>ส่วนที่ 7 คอมพิวเตอร์/โน้ตบุ๊กสำหรับการสอน DLTV</h2>
  <p class="note">ระบุทุกเครื่องที่ใช้กับการสอน DLTV ถ้าไม่มีให้เว้นตารางว่าง</p>
  <div id="d-pcs"></div>
  ${chk('pcUse','การใช้งานกับ DLTV',[['vod','ต่อทีวีรับชมย้อนหลัง'],['media','ดาวน์โหลดใบงาน/สื่อ'],['prep','เตรียมการสอน'],['report','บันทึกผล/ส่งข้อมูล']])}
 </section>
 <section class="sec" id="s8"><h2>ส่วนที่ 8 ประวัติการได้รับอุปกรณ์และความต้องการ</h2>
  <h3>8.1 อุปกรณ์ที่ได้รับในรอบ 5 ปี</h3>
  <label class="opt"><input type="checkbox" data-k="neverReceived">ไม่เคยได้รับในรอบ 5 ปี</label>
  <div id="d-history"></div>
  <h3 style="margin-top:16px">8.2 ความต้องการ</h3>
  <p class="note">ระบบคำนวณจำนวนที่ขาดจากส่วนที่ 5–7 ให้ หากต้องการน้อยกว่านั้นให้กรอกจำนวนที่ขอ (เว้นว่าง = ขอเท่าที่ขาด)</p>
  <div class="scroll"><table class="tbl stack"><thead><tr><th>อุปกรณ์</th><th class="n">ขาด (ระบบ)</th><th>จำนวนที่ขอ</th></tr></thead><tbody>${EQ.map(([k,l,u])=>`<tr><td>${l}</td><td class="n" id="gap-${k}">–</td><td><input type="number" min="0" data-k="req.${k}" aria-label="จำนวนที่ขอ ${l}"></td></tr>`).join('')}</tbody></table></div>
  <div class="grid">${inp('reqReason','เหตุผลประกอบ',{w:'wide'})}${inp('evidence','ลิงก์รูปถ่ายอุปกรณ์ที่ชำรุดหรือไม่มี',{t:'url',w:'wide'})}</div>
  ${rad('care','มีผู้รับผิดชอบดูแลและจุดเก็บที่ปลอดภัย',[['yes','มี'],['no','ไม่มี']])}
 </section>
 </div>
 <section class="sec" id="s9"><h2>ส่วนที่ 9 การรับรองข้อมูล</h2>
  <label class="opt"><input type="checkbox" data-k="cert.agree"><span>ขอรับรองว่าข้อมูลทั้งหมดตรงกับความเป็นจริง และยินยอมให้มูลนิธิฯ ตรวจสอบข้อมูลและสถานที่ได้ <b class="req">*</b></span></label>
  <div class="grid">${inp('cert.filler','ผู้กรอกข้อมูล')}${inp('cert.fillerPos','ตำแหน่ง')}${inp('cert.director','ผู้อำนวยการสถานศึกษา (ชื่อ–นามสกุล)',{req:1})}${inp('cert.date','วันที่รับรอง',{t:'date'})}</div>
  <div id="vmsg" class="panel err hide"></div>
  <div class="bar"><button type="button" id="bSave">บันทึกร่าง</button><button type="button" class="red" id="bSubmit">ส่งแบบสำรวจ</button><span id="saveSt" class="muted"></span></div>
  <p class="muted" style="font-size:14px;margin-top:16px">สอบถาม: กลุ่มงานสารสนเทศ มูลนิธิการศึกษาทางไกลผ่านดาวเทียม ในพระบรมราชูปถัมภ์ โทร 02 282 6734 ต่อ 1800–1801, 095 784 6797</p>
 </section>`;
 Object.keys(DYN).forEach(renderDyn);fill($('#sv'));refresh();
}
function fill(root){root.querySelectorAll('[data-k]').forEach(el=>{const v=getP(S,el.dataset.k);if(el.type==='radio')el.checked=v===el.value;else if(el.type==='checkbox')el.checked=el.hasAttribute('data-multi')?(v||[]).includes(el.value):!!v;else el.value=v??''})}
$('#sv').addEventListener('input',onEdit);$('#sv').addEventListener('change',onEdit);
function onEdit(e){const el=e.target,k=el.dataset?.k;if(!k)return;if(e.type==='input'&&(el.type==='radio'||el.type==='checkbox'||el.tagName==='SELECT'))return;
 if(el.type==='radio')setP(S,k,el.value);else if(el.type==='checkbox'){if(el.hasAttribute('data-multi')){const a=new Set(getP(S,k)||[]);el.checked?a.add(el.value):a.delete(el.value);setP(S,k,[...a])}else setP(S,k,el.checked)}
 else if(el.type==='number')setP(S,k,el.value===''?'':Number(el.value));else setP(S,k,el.value);
 refresh();schedule()}
$('#sv').addEventListener('click',e=>{const a=e.target.dataset?.add,d=e.target.dataset?.del;if(a){S[a].push({});renderDyn(a);refresh();schedule()}if(d){S[d].splice(+e.target.dataset.i,1);renderDyn(d);refresh();schedule()}});
function refresh(){
 let sA=0,sB=0,sSt=0;G.forEach((g,i)=>{const r=S.grades[i]||{},c=document.getElementById('pc'+i);if(r.open){const A=num(cfg.A[i]),B=Math.min(num(r.B),A);sA+=A;sB+=B;sSt+=num(r.students);c.textContent=A?fmt(B/A*100,2):'–'}else c.textContent='–'});
 $('#sumA').textContent=fmt(sA);$('#sumB').textContent=fmt(sB);$('#sumSt').textContent=fmt(sSt);const p=sA?sB/sA*100:0;$('#sumP').textContent=sA?fmt(p,2):'–';
 const r=evalSchool(S,cfg);EQ.forEach(([k])=>$('#gap-'+k).textContent=fmt(r.gap[k]));
 $('#mainSecs').classList.toggle('hide',S.use==='c');$('#useB').classList.toggle('hide',S.use!=='b');
 $('#fstat').innerHTML=`<b>% การใช้ DLTV</b><br><span style="font-size:28px;font-family:'Noto Serif Thai',serif">${sA?fmt(p,2):'–'}</span><br>${r.group?`กลุ่ม ${r.group}`:sA?'ต่ำกว่าเกณฑ์':''}<br><span class="muted">สถานะ: ${S.status==='submitted'?'ส่งแล้ว':'ฉบับร่าง'}</span>`;
}
function schedule(){$('#saveSt').textContent='มีการแก้ไขที่ยังไม่บันทึก กด "บันทึกร่าง" ก่อนปิดหน้านี้'}
const API=(window.DLTV_CONFIG&&window.DLTV_CONFIG.API_URL)||'';
async function run(action,...args){
 if(!API||/XXXX/.test(API))throw new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js');
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),45000);
 try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,args}),signal:ctl.signal,redirect:'follow'});
  if(!r.ok)throw new Error('เซิร์ฟเวอร์ตอบกลับ '+r.status);const j=await r.json();if(!j.ok)throw new Error(j.error||'เกิดข้อผิดพลาด');return j.data}
 catch(e){if(e.name==='AbortError')throw new Error('เชื่อมต่อนานเกินไป กรุณาลองใหม่');if(e instanceof TypeError)throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ต');throw e}
 finally{clearTimeout(t)}}
let saving=false;
async function save(status){if(saving)return false;saving=true;$('#saveSt').textContent='กำลังบันทึก…';
 try{const r=await run('saveSurvey',JSON.parse(JSON.stringify(S)),status||'');S.status=r.status;S.updatedAt=r.updatedAt;if(S.coord&&S.coord[0]&&S.coord[0].tel)S._verify=S.coord[0].tel;
  $('#saveSt').textContent='บันทึกแล้ว '+new Date().toLocaleTimeString('th-TH');refresh();return true}
 catch(e){$('#saveSt').textContent='บันทึกไม่สำเร็จ: '+(e&&e.message||e);return false}finally{saving=false}}
function validate(){const m=[];const q=(c,t)=>{if(!c)m.push(t)};
 q(/^\d{10}$/.test(String(S.code||'')),'รหัสโรงเรียน 10 หลัก');q(S.name,'ชื่อโรงเรียน');q(S.province,'จังหวัด');q(S.affil,'สังกัด');q(S.coord?.[0]?.name,'ชื่อผู้ประสานงานคนที่ 1');q(S.coord?.[0]?.tel,'มือถือผู้ประสานงานคนที่ 1');q(S.use,'สถานะการใช้ DLTV (2.1)');
 if(S.use&&S.use!=='c'){q(S.sched,'รูปแบบตารางสอน (2.3)');q(S.road,'พื้นผิวถนน');q(S.vehicle,'พาหนะที่เข้าถึงได้');q(S.elec,'สถานะไฟฟ้า');q(S.net,'อินเทอร์เน็ต');q(S.director,'ผู้บริหารสถานศึกษา');q(S.teachers!==''&&S.teachers!=null,'จำนวนครูผู้สอน');
  const og=S.grades.map((g,i)=>[g,i]).filter(([g])=>g.open);q(og.length,'ชั้นที่เปิดสอนอย่างน้อย 1 ชั้น');og.forEach(([g,i])=>{q(g.B!==''&&g.B!=null,`คาบที่ใช้จริง (B) ชั้น ${G[i]}`);q(g.students,`จำนวนนักเรียนชั้น ${G[i]}`)});
  q(S.timetableLink,'ลิงก์ตารางสอน (4.3)');q(S.rooms.some(r=>r.tv),'ข้อมูลห้องเรียนอย่างน้อย 1 ห้อง พร้อมสภาพทีวี');q(S.buildings.some(b=>b.dish),'สภาพจานดาวเทียมอย่างน้อย 1 อาคาร');
  if(S.use==='b')q(S.evidence,'ลิงก์รูปอุปกรณ์ที่ชำรุด (กรณีข้อ 2.1 ข.)')}
 q(S.cert?.agree,'ติ๊กรับรองข้อมูล');q(S.cert?.director,'ชื่อผู้อำนวยการผู้รับรอง');return m}
$('#sv').addEventListener('click',e=>{if(e.target.id==='bSave')save();if(e.target.id==='bSubmit')submit()});
const submit=async()=>{const m=validate(),v=$('#vmsg');if(m.length){v.classList.remove('hide');v.innerHTML='<b>ยังขาดข้อมูล:</b><ul>'+m.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>';v.scrollIntoView({block:'center'});return}
 v.classList.add('hide');if(await save('submitted')){refresh();toast('ส่งแบบสำรวจแล้ว');$('#vmsg').classList.remove('hide');$('#vmsg').style.background='#e5f4e4';$('#vmsg').innerHTML='<b>ส่งแบบสำรวจเรียบร้อย</b><br>หากต้องการแก้ไขภายหลัง ใช้รหัสโรงเรียน <b>'+esc(S.code)+'</b> และเบอร์มือถือผู้ประสานงานคนที่ 1 โหลดข้อมูลเดิมที่ด้านบนของหน้า'}};


/* ---------- criteria engine ---------- */
function evalSchool(s,c){
 const A=c.A,w=c.w,ref=num(c.refYear)||2569,flags=[],why=[];
 let sA=0,sB=0,open=0;(s.grades||[]).forEach((g,i)=>{if(!g?.open)return;open++;const a=num(A[i]),b=num(g.B);if(b>a)flags.push(`${G[i]} กรอก B เกิน A`);sA+=a;sB+=Math.min(b,a);
  const sj=s.subj?.[i];if(a&&b>=a&&sj&&Object.values(sj).some(x=>x==='◐'||x==='✗'))flags.push(`${G[i]} B เต็มแต่รายวิชาไม่ครบ`)});
 const full=sA>0&&sB===sA,pct=sA?sB/sA*100:0,bd=c.bands;
 const group=full?1:pct>=bd[1]?2:pct>=bd[2]?3:pct>=bd[3]?4:pct>=bd[4]?5:0;
 const rooms=(s.rooms||[]).filter(r=>r&&(r.tv||r.grades||r.students)),blds=s.buildings||[];
 const dishBad=r=>{const b=blds[num(r.bld)-1];return b&&(b.dish==='broken'||b.dish==='none')};
 const miss=rooms.filter(r=>r.tv==='broken'||r.tv==='none'||dishBad(r));
 const fRoom=rooms.length?miss.length/rooms.length:0;
 const ages=rooms.filter(r=>r.tv&&r.tv!=='none'&&num(r.year)>2400).map(r=>ref-num(r.year));const age=ages.length?ages.reduce((a,b)=>a+b,0)/ages.length:null;
 const fAge=age==null?0:age>=10?1:age>=7?2/3:age>=4?1/3:0;
 const fAcc=Math.max(s.vehicle==='moto'||s.vehicle==='boat'?1:0,s.vehicle==='4wd'?2/3:0,s.road==='laterite'||s.road==='dirt'?1/3:0);
 const fNet=s.net==='none'?1:(s.netQual==='some'||s.netQual==='no')?.5:0;
 const hy=(s.history||[]).map(h=>num(h.year)).filter(y=>y>2400),last=hy.length?Math.max(...hy):null;
 const fHist=s.neverReceived||last==null?1:ref-last>3?.5:0;
 const fTeach=open&&s.teachers!==''&&s.teachers!=null&&num(s.teachers)<open?1:0;
 const parts={room:fRoom*w.room,age:fAge*w.age,access:fAcc*w.access,net:fNet*w.net,hist:fHist*w.hist,teach:fTeach*w.teach};
 const score=Object.values(parts).reduce((a,b)=>a+b,0);
 const tv=rooms.filter(r=>r.tv==='broken'||r.tv==='none').length;
 const stand=tv+rooms.filter(r=>(r.tv==='ok'||r.tv==='repair')&&(r.stand==='broken'||r.stand==='none')).length;
 const dish=blds.filter(b=>b&&(b.dish==='broken'||b.dish==='none')).length;
 const own=(s.pcs||[]).filter(p=>p.owner==='school'&&p.cond==='ok').length;
 const nb=Math.max(0,Math.ceil(rooms.length/(num(c.nbPer)||4))-own);
 const gap={tv,stand,dish,nb},need={};EQ.forEach(([k])=>{const r=s.req?.[k];need[k]=r!==''&&r!=null&&num(r)>=0&&num(r)<gap[k]?num(r):gap[k]});
 if(s.status!=='submitted')why.push('ยังไม่ส่งแบบสำรวจ');
 if(!(s.use==='a'||s.use==='b'))why.push('ไม่ได้ใช้ DLTV');
 if(s.elec!=='yes'&&s.use!=='c')why.push('ไม่มีไฟฟ้า (ส่งต่อจัดหาไฟฟ้า)');
 if(!(s.cert?.agree&&s.cert?.director))why.push('ผู้อำนวยการยังไม่รับรอง');
 if(s.use!=='c'&&!group)why.push(`ใช้ DLTV ต่ำกว่า ${bd[4]}%`);
 if(s.use!=='c'&&!Object.values(need).some(v=>v>0))why.push('ไม่ขาดอุปกรณ์');
 if(s.use==='b')flags.push('หยุดใช้เพราะอุปกรณ์ชำรุด ต้องตรวจสอบ');
 if(s.use!=='c'&&!s.timetableLink)flags.push('ไม่มีลิงก์ตารางสอน');
 if(miss.length&&!s.evidence)flags.push('ไม่มีรูปหลักฐานอุปกรณ์ชำรุด');
 const affected=miss.reduce((a,r)=>a+num(r.students),0);
 return{pct,full,group,score,parts,gap,need,eligible:!why.length,why,flags,affected,rooms:rooms.length,open,age}}
function analyze(list,c){
 const rows=list.map(s=>({s,...evalSchool(s,c)}));
 const el=rows.filter(r=>r.eligible).sort((a,b)=>a.group-b.group||b.score-a.score||b.pct-a.pct||b.affected-a.affected||num(b.s.years)-num(a.s.years)||num(a.s.updatedAt)-num(b.s.updatedAt));
 el.forEach((r,i)=>{r.rank=i+1;r.alloc={}});const rem={},stockSet={};
 EQ.forEach(([k])=>{const st=c.stock?.[k];stockSet[k]=st!==''&&st!=null;rem[k]=stockSet[k]?num(st):Infinity;el.forEach(r=>{const g=Math.min(r.need[k],rem[k]);r.alloc[k]=g;rem[k]-=g})});
 return{rows,el,rem,stockSet}}



$('#lBtn').onclick=async()=>{const c=$('#lCode').value.trim(),t=$('#lTel').value.trim(),m=$('#lMsg');if(!c||!t){m.textContent='กรอกรหัสโรงเรียนและเบอร์มือถือ';return}
 m.textContent='กำลังค้นหา…';try{const d=await run('getSurvey',c,t);if(!d){m.textContent='ไม่พบข้อมูล หรือเบอร์มือถือไม่ตรงกับที่บันทึกไว้';return}
 S=Object.assign(blank(),d);S._verify=t;renderForm();m.textContent='โหลดข้อมูลเดิมแล้ว ('+(S.status==='submitted'?'ส่งแล้ว':'ฉบับร่าง')+')'}catch(e){m.textContent='ผิดพลาด: '+(e&&e.message||e)}};
renderForm();
run('getConfig').then(c=>{cfg=Object.assign(JSON.parse(JSON.stringify(DEF)),c);renderForm();
 if(c.deadline){const m=$('#dbmsg');m.classList.remove('hide');m.textContent='ปิดรับแบบสำรวจวันที่ '+new Date(c.deadline+'T00:00:00').toLocaleDateString('th-TH',{dateStyle:'long'})}}).catch(e=>{const m=$('#dbmsg');m.classList.remove('hide');m.classList.add('err');m.textContent='โหลดเกณฑ์จากเซิร์ฟเวอร์ไม่ได้: '+(e&&e.message||e)+' (ยังกรอกได้ แต่ % ที่แสดงอาจไม่ตรง)'});
window.addEventListener('beforeunload',e=>{if(/ยังไม่บันทึก/.test($('#saveSt').textContent)){e.preventDefault();e.returnValue=''}});

}
