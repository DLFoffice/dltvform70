/* เกณฑ์การจัดสรร DLTV 2570 — ใช้ร่วมกันระหว่างหน้าแบบสำรวจและหน้าผู้ดูแล
   สูตรชุดเดียวกันอยู่ใน backend/Code.gs ถ้าแก้ต้องแก้ทั้งสองที่ */
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
const num=v=>{const n=Number(v);return v===''||v==null||isNaN(n)?0:n};
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

