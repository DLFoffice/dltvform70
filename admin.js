/* หน้าผู้ดูแล: Dashboard, ส่งออก Excel และ PDF */
{
const AF={obec:'สพฐ.',bpp:'ตชด.',lao:'อปท.',private:'เอกชน',other:'อื่น ๆ'};
const USE={a:'ใช้',b:'หยุดใช้ (อุปกรณ์ชำรุด)',c:'ไม่ใช้'};
const PARTS=[['room','ห้องที่ขาดอุปกรณ์'],['age','อายุทีวีเฉลี่ย'],['access','ความห่างไกล'],['net','อินเทอร์เน็ต'],['hist','ประวัติการได้รับ'],['teach','ครูไม่ครบชั้น']];
const LIB={xlsx:'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'};
let token=null,D=null,F={q:'',pv:'',af:'',g:'',st:''},sortK='rank',sortD=1,page=0;const PER=25;
try{token=sessionStorage.getItem('dltv_admin')}catch{}

/* ---------- login ---------- */
mountLogos();$('#loginArt').innerHTML=WAVES;
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('#loginBtn');btnBusy(b,true,'กำลังตรวจสอบ');$('#loginMsg').textContent='';
 try{const r=await api('adminLogin',$('#pw').value);token=r.token;try{sessionStorage.setItem('dltv_admin',token)}catch{}$('#pw').value='';enter()}
 catch(err){$('#loginMsg').textContent=err.message||String(err);$('#pw').select()}finally{btnBusy(b,false)}});
$('#logout').onclick=()=>{api('adminLogout',token).catch(()=>{});leave()};
function leave(msg){token=null;try{sessionStorage.removeItem('dltv_admin')}catch{}D=null;$('#appView').classList.add('hide');$('#loginView').classList.remove('hide');if(msg)$('#loginMsg').textContent=msg;$('#pw').focus()}
function enter(){$('#loginView').classList.add('hide');$('#appView').classList.remove('hide');load()}

/* ---------- data ---------- */
function busy(on,t){let b=$('.busy');if(on){if(!b){b=document.createElement('div');b.className='busy';b.innerHTML='<div class="box"><span class="spin"></span><span></span></div>';document.body.append(b)}b.querySelector('span:last-child').textContent=t||'กำลังโหลด…'}else b?.remove()}
async function load(){busy(true,'กำลังคำนวณข้อมูลล่าสุด…');
 try{D=await api('adminData',token);const pvs=[...new Set(D.rows.map(r=>r.province||'ไม่ระบุ'))].sort((a,b)=>a.localeCompare(b,'th'));
  $('#fPv').innerHTML='<option value="">ทุกจังหวัด</option>'+pvs.map(p=>`<option>${esc(p)}</option>`).join('');$('#fPv').value=F.pv;
  $('#asof').textContent=`ข้อมูล ณ ${new Date(D.generatedAt).toLocaleString('th-TH',{dateStyle:'long',timeStyle:'short'})} · แบบสำรวจทั้งหมด ${fmt(D.rows.length)} ฉบับ`;render()}
 catch(e){if(e.auth)leave('หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่');else{$('#headline').textContent='โหลดข้อมูลไม่สำเร็จ';toast(e.message||String(e),'bad')}}
 finally{busy(false)}}
$('#refresh').onclick=load;
const bind=(id,k)=>$(id).addEventListener('input',e=>{F[k]=e.target.value;page=0;render()});
bind('#fQ','q');bind('#fPv','pv');bind('#fAf','af');bind('#fG','g');bind('#fSt','st');
$('#fClear').onclick=()=>{F={q:'',pv:'',af:'',g:'',st:''};['#fQ','#fPv','#fAf','#fG','#fSt'].forEach(s=>$(s).value='');page=0;render()};
function rows(){const q=F.q.trim();return D.rows.filter(r=>(!F.pv||(r.province||'ไม่ระบุ')===F.pv)&&(!F.af||r.affil===F.af)&&(F.g===''||String(r.group||0)===F.g)
 &&(!F.st||(F.st==='el'?r.eligible:F.st==='no'?!r.eligible:F.st==='flag'?r.flags.length>0:r.status!=='submitted'))&&(!q||String(r.name).includes(q)||String(r.code).includes(q)))}
function scope(){const p=[];if(F.pv)p.push('จังหวัด'+F.pv);if(F.af)p.push('สังกัด '+AF[F.af]);if(F.g!=='')p.push(F.g==='0'?'ต่ำกว่าเกณฑ์':'กลุ่ม '+F.g);if(F.st)p.push({el:'ผ่านเกณฑ์',no:'ไม่ผ่านเกณฑ์',flag:'ต้องตรวจสอบ',draft:'ฉบับร่าง'}[F.st]);if(F.q)p.push(`ค้นหา "${F.q}"`);return p.length?p.join(' · '):'ทั้งหมด'}
function stats(L){const sub=L.filter(r=>r.status==='submitted'),el=L.filter(r=>r.eligible);const sum=k=>el.reduce((a,r)=>a+r.need[k],0),got=k=>el.reduce((a,r)=>a+(r.alloc?r.alloc[k]:0),0);
 const why={};L.filter(r=>!r.eligible).forEach(r=>r.why.forEach(w=>why[w]=(why[w]||0)+1));
 const pv={};L.forEach(r=>{const p=r.province||'ไม่ระบุ';const o=pv[p]=pv[p]||{n:0,sub:0,el:0,ps:0,tv:0,stand:0,dish:0,nb:0};o.n++;if(r.status==='submitted'){o.sub++;o.ps+=r.pct}if(r.eligible){o.el++;EQ.forEach(([k])=>o[k]+=r.alloc?r.alloc[k]:0)}});
 return{n:L.length,sub:sub.length,el:el.length,g:[1,2,3,4,5].map(g=>el.filter(r=>r.group===g).length),avg:sub.length?sub.reduce((a,r)=>a+r.pct,0)/sub.length:0,
  flag:el.filter(r=>r.flags.length).length,need:Object.fromEntries(EQ.map(([k])=>[k,sum(k)])),got:Object.fromEntries(EQ.map(([k])=>[k,got(k)])),why,pv,
  draft:L.length-sub.length,notUse:sub.filter(r=>r.use==='c').length,full:el.filter(r=>EQ.every(([k])=>(r.alloc?r.alloc[k]:0)>=r.need[k])).length}}

/* ---------- render ---------- */
function bars(items,max){return items.map(([l,v,c])=>`<div class="hb"><span>${esc(l)}</span><div class="t"><i class="${c||''}" data-w="${max?Math.max(v?2:0,v/max*100):0}"></i></div><span class="v">${fmt(v)}</span></div>`).join('')}
function grow(root){requestAnimationFrame(()=>requestAnimationFrame(()=>root.querySelectorAll('[data-w]').forEach(i=>i.style.width=i.dataset.w+'%')))}
function render(){if(!D)return;const L=rows(),s=stats(L),filtered=scope()!=='ทั้งหมด';
 $('#headline').textContent=s.el?`${fmt(s.el)} โรงเรียนผ่านเกณฑ์ ${s.full===s.el?'ได้รับครบทุกโรงเรียน':`ได้รับครบตามที่ขาด ${fmt(s.full)} โรงเรียน`}`:'ยังไม่มีโรงเรียนผ่านเกณฑ์';
 const K=[['แบบสำรวจ',s.n,`ส่งแล้ว ${fmt(s.sub)} · ร่าง ${fmt(s.draft)}`,''],['ผ่านคุณสมบัติ',s.el,s.sub?`${fmt(s.el/s.sub*100,1)}% ของที่ส่งแล้ว`:'','ok'],['ใช้ DLTV 100%',s.g[0],'กลุ่ม 1','gold'],['% การใช้เฉลี่ย',s.avg,'เฉพาะที่ส่งแล้ว','',1],['ต้องตรวจสอบ',s.flag,'ผ่านเกณฑ์แต่มีธง','warn']];
 $('#kpis').innerHTML=K.map(([l,v,sub,c,d],i)=>`<div class="kpi ${c}" style="animation-delay:${i*60}ms"><span>${l}</span><b data-v="${v}" data-d="${d||0}">0</b><small>${esc(sub)}</small></div>`).join('');
 $$('#kpis b').forEach(b=>countUp(b,+b.dataset.v,+b.dataset.d));
 $('#cGroups').innerHTML=bars(s.g.map((v,i)=>[i?`กลุ่ม ${i+1} (${D.cfg.bands[i]}%+)`:'กลุ่ม 1 (100%)',v,i?'':'gold']),Math.max(...s.g,1));grow($('#cGroups'));
 $('#eqCap').textContent=filtered?'ตามตัวกรอง (เส้นงบแสดงเฉพาะเมื่อดูทั้งหมด)':'ทุกโรงเรียนที่ผ่านเกณฑ์';
 $('#cEq').innerHTML=EQ.map(([k,l,u])=>{const T=s.need[k],A=s.got[k],st=D.cfg.stock[k]===''||D.cfg.stock[k]==null?null:+D.cfg.stock[k],showSt=st!=null&&!filtered,mx=Math.max(T,showSt?st:0,1);
  return`<div class="meter"><div class="lab"><b>${l}</b><span>จัดสรร <b>${fmt(A)}</b> / ต้องการ ${fmt(T)} ${u}${st==null?' · ยังไม่กำหนดงบ':showSt?` · งบ ${fmt(st)}${T>st?` · <span style="color:var(--bad)">ขาด ${fmt(T-st)}</span>`:''}`:''}</span></div><div class="t"><i data-w="${A/mx*100}"></i>${showSt?`<s style="left:calc(${Math.min(st/mx*100,99.5)}% - 1px)"></s>`:''}</div></div>`}).join('');grow($('#cEq'));
 const seg=[['ส่งแล้ว ใช้ DLTV',s.sub-s.notUse,'var(--brand)'],['ส่งแล้ว ไม่ใช้ DLTV',s.notUse,'var(--sky)'],['ฉบับร่าง',s.draft,'#c9d3e6']],C=2*Math.PI*54;let off=0;
 $('#cStatus').innerHTML=`<svg viewBox="0 0 150 150"><g transform="rotate(-90 75 75)"><circle cx="75" cy="75" r="54" stroke="var(--brand-50)"/>${seg.map(([,v,c])=>{const len=s.n?v/s.n*C:0,o=`<circle cx="75" cy="75" r="54" stroke="${c}" stroke-dasharray="${len} ${C}" stroke-dashoffset="${-off}"/>`;off+=len;return o}).join('')}</g><text x="75" y="72" text-anchor="middle" font-size="24" font-weight="700" fill="var(--ink)">${fmt(s.n)}</text><text x="75" y="92" text-anchor="middle" font-size="12" fill="var(--mute)">แบบสำรวจ</text></svg><ul>${seg.map(([l,v,c])=>`<li><i style="background:${c}"></i>${l}<b>${fmt(v)}</b></li>`).join('')}</ul>`;
 const wk=Object.entries(s.why).sort((a,b)=>b[1]-a[1]);$('#cWhy').innerHTML=wk.length?bars(wk.map(([k,v])=>[k,v,'warn']),wk[0][1]):'<div class="empty">ทุกโรงเรียนผ่านคุณสมบัติ</div>';grow($('#cWhy'));
 const pv=Object.entries(s.pv).sort((a,b)=>b[1].el-a[1].el||b[1].n-a[1].n);
 $('#cProv').innerHTML=pv.length?`<table class="stack"><thead><tr><th>จังหวัด</th><th class="n">แบบสำรวจ</th><th class="n">ส่งแล้ว</th><th class="n">% เฉลี่ย</th><th class="n">ผ่านเกณฑ์</th>${EQ.map(([,l])=>`<th class="n">${l}</th>`).join('')}</tr></thead><tbody>${pv.map(([p,o])=>`<tr><td>${esc(p)}</td><td class="n">${fmt(o.n)}</td><td class="n">${fmt(o.sub)}</td><td class="n">${o.sub?fmt(o.ps/o.sub,1):'–'}</td><td class="n"><b>${fmt(o.el)}</b></td>${EQ.map(([k])=>`<td class="n">${fmt(o[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<div class="empty">ไม่มีข้อมูลตามตัวกรอง</div>';
 renderLedger(L)}
const COLS=[['rank','ลำดับ','n'],['name','โรงเรียน'],['province','จังหวัด'],['pct','% ใช้','n'],['group','กลุ่ม'],['score','คะแนน','n'],...EQ.map(([k,l])=>['al_'+k,l,'n']),['why','หมายเหตุ']];
function val(r,k){if(k.startsWith('al_'))return r.alloc?r.alloc[k.slice(3)]:-1;if(k==='rank')return r.rank??1e9;if(k==='group')return r.group||9;if(k==='why')return r.why.length+r.flags.length;return r[k]}
function renderLedger(L){L=[...L].sort((a,b)=>{const x=val(a,sortK),y=val(b,sortK);return(typeof x==='string'?x.localeCompare(y,'th'):x-y)*sortD});
 const pages=Math.max(1,Math.ceil(L.length/PER));page=Math.min(page,pages-1);const show=L.slice(page*PER,page*PER+PER);
 $('#ledger').innerHTML=L.length?`<table class="stack"><thead><tr>${COLS.map(([k,l,n])=>`<th class="sort ${n||''}" data-k="${k}" ${k===sortK?`aria-sort="${sortD>0?'ascending':'descending'}"`:''} tabindex="0">${l}</th>`).join('')}</tr></thead><tbody>${show.map(r=>`<tr class="pick" data-c="${esc(r.code)}" tabindex="0"><td class="n">${r.rank??'–'}</td><td><b>${esc(r.name||'(ไม่มีชื่อ)')}</b><br><span class="muted small">${esc(r.code)}</span></td><td>${esc(r.province||'')}</td><td class="n">${fmt(r.pct,2)}</td><td>${r.group?`<span class="chip ${r.group===1?'gold':''}">กลุ่ม ${r.group}</span>`:'–'}</td><td class="n">${fmt(r.score,1)}</td>${EQ.map(([k])=>`<td class="n">${r.eligible&&r.alloc?`${fmt(r.alloc[k])}${r.alloc[k]<r.need[k]?`<span class="muted">/${fmt(r.need[k])}</span>`:''}`:'–'}</td>`).join('')}<td>${r.why.map(w=>`<span class="chip bad">${esc(w)}</span>`).join(' ')}${r.flags.map(f=>`<span class="chip warn">${esc(f)}</span>`).join(' ')}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">ไม่มีโรงเรียนตามตัวกรอง</div>';
 $('#pager').innerHTML=L.length>PER?`<span class="muted small">${fmt(page*PER+1)}–${fmt(Math.min(L.length,(page+1)*PER))} จาก ${fmt(L.length)}</span><button class="btn sm" data-p="-1" ${page?'':'disabled'}>← ก่อนหน้า</button><button class="btn sm" data-p="1" ${page<pages-1?'':'disabled'}>ถัดไป →</button>`:`<span class="muted small">${fmt(L.length)} รายการ</span>`}
$('#pager').addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b){page+=+b.dataset.p;renderLedger(rows());$('#ledger').scrollTop=0}});
$('#ledger').addEventListener('click',e=>{const th=e.target.closest('th.sort');if(th){const k=th.dataset.k;sortD=k===sortK?-sortD:(['pct','score'].includes(k)||k.startsWith('al_')?-1:1);sortK=k;renderLedger(rows());return}
 const tr=e.target.closest('tr.pick');if(tr)detail(tr.dataset.c)});
$('#ledger').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const t=e.target.closest('th.sort,tr.pick');if(t)t.click()});

function detail(code){const r=D.rows.find(x=>String(x.code)===code);if(!r)return;const w=D.cfg.w;
 const d=document.createElement('div');d.className='drawer';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 const link=(u,t)=>u&&/^https:\/\//.test(u)?`<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`:'';
 d.innerHTML=`<div class="pane"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><h2>${esc(r.name||'(ไม่มีชื่อ)')}</h2><p class="muted small">${esc(r.code)} · ${esc([r.amphoe,r.province].filter(Boolean).join(', '))} · ${esc(AF[r.affil]||'')}</p></div><button class="btn sm" type="button" data-x>ปิด</button></div>
 <div class="chips">${r.status==='submitted'?'<span class="chip ok">ส่งแล้ว</span>':'<span class="chip">ฉบับร่าง</span>'}<span class="chip">${esc(USE[r.use]||'–')}</span>${r.group?`<span class="chip ${r.group===1?'gold':''}">กลุ่ม ${r.group}</span>`:''}${r.rank?`<span class="chip">ลำดับ ${fmt(r.rank)}</span>`:''}</div>
 <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><span>% การใช้</span><b>${fmt(r.pct,2)}</b></div><div class="kpi gold"><span>คะแนนความจำเป็น</span><b>${fmt(r.score,1)}</b></div><div class="kpi ok"><span>ห้องเรียน</span><b>${fmt(r.rooms)}</b></div></div>
 <h3>คะแนนความจำเป็น</h3><div class="parts">${PARTS.map(([k,l])=>`<div class="hb"><span>${l}</span><div class="t"><i data-w="${w[k]?r.parts[k]/w[k]*100:0}"></i></div><span class="v">${fmt(r.parts[k],1)}/${w[k]}</span></div>`).join('')}</div>
 <h3 style="margin-top:16px">อุปกรณ์</h3><table><thead><tr><th>อุปกรณ์</th><th class="n">ขาด</th><th class="n">ขอ</th><th class="n">ได้รับ</th></tr></thead><tbody>${EQ.map(([k,l])=>`<tr><td>${l}</td><td class="n">${fmt(r.gap[k])}</td><td class="n">${fmt(r.need[k])}</td><td class="n"><b>${r.eligible&&r.alloc?fmt(r.alloc[k]):'–'}</b></td></tr>`).join('')}</tbody></table>
 ${r.why.length||r.flags.length?`<div class="panel warn">${r.why.map(x=>`<div>• ${esc(x)}</div>`).join('')}${r.flags.map(x=>`<div>⚑ ${esc(x)}</div>`).join('')}</div>`:''}
 <p class="small">ผู้ประสานงาน: ${esc(r.coord||'–')} ${r.tel?'· โทร '+esc(r.tel):''}<br>ครู ${esc(r.teachers??'–')} คน · เปิดสอน ${fmt(r.open)} ชั้น · ใช้ DLTV ${esc(r.years??'–')} ปี · นักเรียนในห้องที่ขาดอุปกรณ์ ${fmt(r.affected)} คน<br>${[link(r.timetableLink,'ตารางสอน'),link(r.evidence,'รูปหลักฐาน')].filter(Boolean).join(' · ')}</p></div>`;
 const close=()=>{d.remove();document.removeEventListener('keydown',esc_)},esc_=e=>{if(e.key==='Escape')close()};
 d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-x]'))close()});document.addEventListener('keydown',esc_);document.body.append(d);grow(d);d.querySelector('[data-x]').focus()}

/* ---------- exports ---------- */
function loadLib(src){return new Promise((res,rej)=>{if(window.XLSX)return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('โหลดไลบรารีสำหรับส่งออกไม่ได้ ตรวจสอบอินเทอร์เน็ต'));document.head.append(s)})}
const stamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`};
function ordered(L){return[...L].sort((a,b)=>(a.rank??1e9)-(b.rank??1e9)||String(a.province).localeCompare(String(b.province),'th'))}
$('#xlsx').onclick=async()=>{if(!D)return;const b=$('#xlsx');btnBusy(b,true,'กำลังสร้างไฟล์');
 try{if(!window.XLSX)await loadLib(LIB.xlsx);const L=ordered(rows()),s=stats(L),X=window.XLSX,wb=X.utils.book_new();
  const sum=[['สรุปผลการสำรวจและการจัดสรรอุปกรณ์ DLTV ปีการศึกษา 2570'],['ข้อมูล ณ',new Date(D.generatedAt).toLocaleString('th-TH')],['ขอบเขต',scope()],[],
   ['ภาพรวม','จำนวน'],['แบบสำรวจทั้งหมด',s.n],['ส่งแล้ว',s.sub],['ฉบับร่าง',s.draft],['ผ่านคุณสมบัติ',s.el],['ได้รับครบตามที่ขาด',s.full],['% การใช้เฉลี่ย (ที่ส่งแล้ว)',+s.avg.toFixed(2)],['ต้องตรวจสอบ',s.flag],[],
   ['กลุ่ม % การใช้','โรงเรียนที่ผ่านเกณฑ์'],...s.g.map((v,i)=>[i?`กลุ่ม ${i+1} (${D.cfg.bands[i]}%+)`:'กลุ่ม 1 (100%)',v]),[],
   ['อุปกรณ์','ต้องการ','จัดสรรได้','งบ (ทั้งหมด)'],...EQ.map(([k,l])=>[l,s.need[k],s.got[k],D.cfg.stock[k]===''?'ยังไม่กำหนด':D.cfg.stock[k]]),[],
   ['เหตุผลที่ไม่ผ่านคุณสมบัติ','โรงเรียน'],...Object.entries(s.why).sort((a,b)=>b[1]-a[1])];
  const ws1=X.utils.aoa_to_sheet(sum);ws1['!cols']=[{wch:38},{wch:22},{wch:14},{wch:16}];X.utils.book_append_sheet(wb,ws1,'สรุป');
  const h=['ลำดับ','รหัสโรงเรียน','โรงเรียน','อำเภอ','จังหวัด','สังกัด','สถานะ','การใช้ DLTV','% การใช้','กลุ่ม','คะแนนความจำเป็น',...PARTS.map(([,l])=>'คะแนน: '+l),...EQ.flatMap(([,l])=>[l+' ขาด',l+' ขอ',l+' ได้รับ']),'ผ่านเกณฑ์','เหตุผลที่ไม่ผ่าน','ต้องตรวจสอบ','ผู้ประสานงาน','โทร'];
  const ws2=X.utils.aoa_to_sheet([h,...L.map(r=>[r.rank??'',String(r.code),r.name,r.amphoe,r.province,AF[r.affil]||'',r.status==='submitted'?'ส่งแล้ว':'ฉบับร่าง',USE[r.use]||'',r.pct,r.group||'',r.score,...PARTS.map(([k])=>r.parts[k]),...EQ.flatMap(([k])=>[r.gap[k],r.need[k],r.eligible&&r.alloc?r.alloc[k]:0]),r.eligible?'ผ่าน':'ไม่ผ่าน',r.why.join('; '),r.flags.join('; '),r.coord,r.tel])]);
  ws2['!cols']=h.map((x,i)=>({wch:i===2?34:i===1?14:Math.max(8,Math.min(24,x.length+2))}));ws2['!autofilter']={ref:`A1:${X.utils.encode_col(h.length-1)}1`};X.utils.book_append_sheet(wb,ws2,'ผลการจัดสรร');
  const ph=['จังหวัด','แบบสำรวจ','ส่งแล้ว','% เฉลี่ย','ผ่านเกณฑ์',...EQ.map(([,l])=>l+' ที่ได้รับ')];
  const ws3=X.utils.aoa_to_sheet([ph,...Object.entries(s.pv).sort((a,b)=>b[1].el-a[1].el).map(([p,o])=>[p,o.n,o.sub,o.sub?+(o.ps/o.sub).toFixed(2):'',o.el,...EQ.map(([k])=>o[k])])]);ws3['!cols']=ph.map(()=>({wch:16}));X.utils.book_append_sheet(wb,ws3,'รายจังหวัด');
  X.writeFile(wb,`DLTV-allocation-${stamp()}.xlsx`);toast('สร้างไฟล์ Excel แล้ว','ok')}
 catch(e){toast(e.message||String(e),'bad')}finally{btnBusy(b,false)}};

/* ---------- รายงาน PDF: สร้างเอกสาร A4 แล้วสั่งพิมพ์/บันทึกเป็น PDF ผ่านเบราว์เซอร์ (ภาษาไทยคมชัด ไม่เพี้ยน) ---------- */
const REPORT_CSS=`@page{size:A4 portrait;margin:14mm 13mm 16mm}
*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font:11pt/1.55 "IBM Plex Sans Thai","Sarabun","Noto Sans Thai",sans-serif;color:#111}
.rh{display:flex;align-items:center;gap:14px;border-bottom:2.5pt solid #1f3c88;padding-bottom:10px;margin-bottom:14px}
.rh img{height:52px;width:auto}.rh .tt{flex:1}
h1{font-size:16pt;margin:0;line-height:1.3}.sub{color:#444;font-size:10pt}
h2{font-size:12.5pt;color:#1f3c88;margin:18px 0 8px;break-after:avoid;page-break-after:avoid}
p{margin:4px 0}
.lead{background:#eef3fc;border-left:4pt solid #f2b705;padding:10px 12px;border-radius:4px}
.kp{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.kp div{border:1px solid #dfe5f0;border-radius:6px;padding:8px 10px;font-size:9.5pt;color:#444}
.kp b{display:block;font-size:17pt;color:#111;line-height:1.2}
table{width:100%;border-collapse:collapse;font-size:9.5pt}
thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}
th{background:#1f3c88;color:#fff;font-weight:600;text-align:left;padding:5px 6px}
td{border-bottom:1px solid #dfe5f0;padding:4px 6px;vertical-align:top}
tbody tr:nth-child(even) td{background:#f7f9fd}
.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.bar{display:grid;grid-template-columns:130px 1fr 44px;gap:8px;align-items:center;margin:4px 0;font-size:10pt}
.bar .t{height:12px;background:#eef3fc;border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;background:#1f3c88}.bar i.g{background:#f2b705}
.blk{break-inside:avoid;page-break-inside:avoid}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.note{color:#555;font-size:9pt;margin-top:10px}
.sign{display:flex;justify-content:flex-end;margin-top:36px;break-inside:avoid}.sign div{text-align:center;width:280px;line-height:2}`;
function reportDoc(){const L=ordered(rows()),s=stats(L),el=L.filter(r=>r.eligible),top=el.slice(0,100),filtered=scope()!=='ทั้งหมด',mx=Math.max(...s.g,1);
 const imgs=$$('.topbar .logos img').filter(i=>i.complete&&i.naturalWidth).map(i=>`<img src="${esc(i.src)}" alt="">`).join('');
 const when=new Date(D.generatedAt).toLocaleString('th-TH',{dateStyle:'long',timeStyle:'short'});
 const body=`<div class="rh">${imgs}<div class="tt"><h1>รายงานสรุปผลการสำรวจและการจัดสรรอุปกรณ์ DLTV ปีการศึกษา 2570</h1><div class="sub">มูลนิธิการศึกษาทางไกลผ่านดาวเทียม ในพระบรมราชูปถัมภ์</div><div class="sub">ข้อมูล ณ ${esc(when)} · ขอบเขต: ${esc(scope())}</div></div></div>
 <div class="blk"><h2>สาระสำคัญ</h2><p class="lead">${s.el?`มีโรงเรียนผ่านเกณฑ์ <b>${fmt(s.el)}</b> แห่ง จากแบบสำรวจที่ส่งแล้ว ${fmt(s.sub)} ฉบับ ในจำนวนนี้ ${fmt(s.g[0])} แห่งใช้ DLTV ครบ 100% และ${s.full===s.el?'ทุกแห่งได้รับอุปกรณ์ครบตามที่ขาด':` ${fmt(s.full)} แห่งได้รับอุปกรณ์ครบตามที่ขาด`}`:`ยังไม่มีโรงเรียนผ่านเกณฑ์ จากแบบสำรวจที่ส่งแล้ว ${fmt(s.sub)} ฉบับ`} ร้อยละการใช้ DLTV เฉลี่ยของโรงเรียนที่ส่งแบบสำรวจคือ ${fmt(s.avg,2)}%</p>
 <div class="kp"><div>แบบสำรวจทั้งหมด<b>${fmt(s.n)}</b></div><div>ส่งแล้ว<b>${fmt(s.sub)}</b></div><div>ผ่านคุณสมบัติ<b>${fmt(s.el)}</b></div><div>ใช้ DLTV 100%<b>${fmt(s.g[0])}</b></div><div>% การใช้เฉลี่ย<b>${fmt(s.avg,2)}</b></div><div>ต้องตรวจสอบ<b>${fmt(s.flag)}</b></div></div></div>
 <div class="two"><div class="blk"><h2>โรงเรียนที่ผ่านเกณฑ์ตามกลุ่ม</h2>${s.g.map((v,i)=>`<div class="bar"><span>${i?`กลุ่ม ${i+1} (${D.cfg.bands[i]}%+)`:'กลุ่ม 1 (100%)'}</span><div class="t"><i class="${i?'':'g'}" style="width:${v/mx*100}%"></i></div><span class="n">${fmt(v)}</span></div>`).join('')}</div>
 <div class="blk"><h2>เหตุผลที่ไม่ผ่านคุณสมบัติ</h2>${Object.keys(s.why).length?`<table><tbody>${Object.entries(s.why).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${fmt(v)} แห่ง</td></tr>`).join('')}</tbody></table>`:'<p>ทุกโรงเรียนผ่านคุณสมบัติ</p>'}</div></div>
 <div class="blk"><h2>ความต้องการและการจัดสรรอุปกรณ์</h2><table><thead><tr><th>อุปกรณ์</th><th class="n">ความต้องการ</th><th class="n">จัดสรรได้</th><th class="n">งบที่ตั้งไว้</th><th class="n">ส่วนที่ยังขาด</th></tr></thead><tbody>${EQ.map(([k,l,u])=>{const st=D.cfg.stock[k],has=st!==''&&st!=null;return`<tr><td>${l} (${u})</td><td class="n">${fmt(s.need[k])}</td><td class="n"><b>${fmt(s.got[k])}</b></td><td class="n">${filtered?'–':has?fmt(st):'ยังไม่กำหนด'}</td><td class="n">${fmt(s.need[k]-s.got[k])}</td></tr>`}).join('')}</tbody></table></div>
 <h2>สรุปรายจังหวัด</h2><table><thead><tr><th>จังหวัด</th><th class="n">ส่งแล้ว</th><th class="n">% เฉลี่ย</th><th class="n">ผ่านเกณฑ์</th>${EQ.map(([,l])=>`<th class="n">${l}</th>`).join('')}</tr></thead><tbody>${Object.entries(s.pv).sort((a,b)=>b[1].el-a[1].el).map(([p,o])=>`<tr><td>${esc(p)}</td><td class="n">${fmt(o.sub)}</td><td class="n">${o.sub?fmt(o.ps/o.sub,1):'–'}</td><td class="n">${fmt(o.el)}</td>${EQ.map(([k])=>`<td class="n">${fmt(o[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>
 <h2>บัญชีจัดลำดับการจัดสรร${top.length<el.length?` (${fmt(top.length)} ลำดับแรกจาก ${fmt(el.length)} · รายการทั้งหมดอยู่ในไฟล์ Excel)`:''}</h2>${top.length?`<table><thead><tr><th class="n">ลำดับ</th><th>โรงเรียน</th><th>จังหวัด</th><th class="n">% ใช้</th><th class="n">กลุ่ม</th><th class="n">คะแนน</th>${EQ.map(([,l])=>`<th class="n">${l}</th>`).join('')}</tr></thead><tbody>${top.map(r=>`<tr><td class="n">${r.rank}</td><td>${esc(r.name)}</td><td>${esc(r.province||'')}</td><td class="n">${fmt(r.pct,2)}</td><td class="n">${r.group}</td><td class="n">${fmt(r.score,1)}</td>${EQ.map(([k])=>`<td class="n">${fmt(r.alloc?r.alloc[k]:0)}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<p>ยังไม่มีโรงเรียนผ่านเกณฑ์</p>'}
 <p class="note">เกณฑ์: จัดกลุ่มตามร้อยละการใช้ DLTV (กลุ่ม 1 = 100%) กลุ่มที่สูงกว่าได้รับก่อน ภายในกลุ่มเรียงตามคะแนนความจำเป็น 100 คะแนน (ห้องที่ขาดอุปกรณ์ ${D.cfg.w.room} · อายุทีวี ${D.cfg.w.age} · ความห่างไกล ${D.cfg.w.access} · อินเทอร์เน็ต ${D.cfg.w.net} · ประวัติการได้รับ ${D.cfg.w.hist} · ครูไม่ครบชั้น ${D.cfg.w.teach})</p>
 <div class="sign"><div>ลงชื่อ ..................................................<br>(..................................................)<br>ผู้รายงาน<br>วันที่ ........ / ........ / ........</div></div>`;
 const title=`DLTV-report-${stamp()}`;
 return{title,html:`<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${title}</title><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet"><style>${REPORT_CSS}</style></head><body>${body}</body></html>`}}
window.DLTV_reportDoc=()=>D&&reportDoc();
$('#pdf').onclick=async()=>{if(!D)return;const b=$('#pdf');btnBusy(b,true,'กำลังเตรียมรายงาน');
 try{const {title,html}=reportDoc();$('#printFrame')?.remove();
  const f=document.createElement('iframe');f.id='printFrame';f.title='รายงาน';f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';document.body.append(f);
  await new Promise(res=>{f.onload=res;f.srcdoc=html});const w=f.contentWindow;
  try{await Promise.race([w.document.fonts.ready,new Promise(r=>setTimeout(r,2500))])}catch{}
  await Promise.all([...w.document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,2500)})));
  const old=document.title;document.title=title;toast('เลือกปลายทาง "บันทึกเป็น PDF" แล้วกดบันทึก','ok');
  w.focus();w.print();setTimeout(()=>{document.title=old},1500)}
 catch(e){toast(e.message||String(e),'bad')}finally{btnBusy(b,false)}};

/* ---------- boot ---------- */
if(token)enter();else $('#pw').focus();
}
