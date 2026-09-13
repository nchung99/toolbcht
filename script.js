const $ = (s) => document.querySelector(s);
const skillNames = ["Programming","Creativity","Design","Logic"];
const state = { students: [], current: 0 };

function toast(msg){
  const el=$("#toast");
  if(!el) return;
  el.textContent=msg; el.classList.add("show");
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>el.classList.remove("show"),2400);
}
const safe=v=>(v??"").toString().trim();
const clamp=n=>Math.max(0,Math.min(100,Number(n)||0));
const escapeHtml=s=>safe(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
function teacherName(){
  const v=$("#teacher").value;
  return v==="__other__" ? safe($("#teacherOther").value) : safe(v);
}

function todayVN(){ return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date()); }

function nameSeed(text=""){
  let h=0;
  for(const ch of text) h=((h<<5)-h)+ch.charCodeAt(0), h|=0;
  return Math.abs(h);
}
function defaultSkills(score, identity=""){
  const hasScore = !(score===null || score==="" || typeof score==="undefined" || Number.isNaN(Number(score)));
  const base = hasScore ? clamp(Number(score)*10) : 65;
  const seed = nameSeed(identity || "student");
  const j1 = (seed % 9) - 4;
  const j2 = ((seed >> 3) % 9) - 4;
  const j3 = ((seed >> 6) % 9) - 4;
  const j4 = ((seed >> 9) % 9) - 4;
  return {
    Programming: clamp(base + 2 + j1),
    Creativity: clamp(base + j2),
    Design: clamp(base - 4 + j3),
    Logic: clamp(base + 5 + j4)
  };
}
function makeStudent(raw={},i=0){
  return {
    id:`${Date.now()}-${i}`,
    tenHocVien:safe(raw.tenHocVien)||`Học viên ${i+1}`,
    nickName:safe(raw.nickName),
    diemDanh:safe(raw.diemDanh)||"Có mặt",
    diem:raw.diem===null||raw.diem===""||typeof raw.diem==="undefined"?null:Number(raw.diem),
    skills:defaultSkills(raw.diem, `${safe(raw.tenHocVien)}|${safe(raw.nickName)}|${i}`),
    report:{concept:"",completion:"",project:"",focus:"",overallText:"",strengths:[],improvements:[],teacherComment:"",encouragement:""}
  };
}

function loadData(d){
  if(!d || typeof d!=="object") throw new Error("JSON không hợp lệ.");
  if(!Array.isArray(d.danhSachHocVien)) throw new Error("JSON thiếu danhSachHocVien.");

  $("#className").value=safe(d.tenLop);
  $("#dateLearn").value=safe(d.ngayHoc);
  $("#dateEval").value=safe(d.ngayHoc)||todayVN();
  $("#timeLearn").value=safe(d.thoiGianHoc);
  $("#sessionName").value=safe(d.tenBuoiHoc);
  $("#lessonName").value=safe(d.tenBaiHoc);
  $("#lessonContent").value=safe(d.noiDungBaiHoc);

  state.students=d.danhSachHocVien.map((s,i)=>makeStudent(s,i));
  state.current=0;

  $("#loadStatus").textContent=`Đã đọc ${state.students.length} học viên từ ${safe(d.tenLop)||"file JSON"}.`;
  renderStudentsEditor();
  renderStudentNav();
  renderPreview();
  toast("Đã nạp JSON EMS.");
}

function renderStudentsEditor(){
  const wrap=$("#studentsEditor");
  wrap.innerHTML="";
  state.students.forEach((s,i)=>{
    const card=document.createElement("div");
    card.className="student-card";
    card.innerHTML=`
      <div class="student-card-head">
        <b>${String(i+1).padStart(2,"0")} · ${escapeHtml(s.tenHocVien)}</b>
        <button class="remove-student" data-remove="${i}" type="button">×</button>
      </div>
      <div class="student-row">
        <label class="field"><span>Họ và tên</span><input data-i="${i}" data-k="tenHocVien" value="${escapeHtml(s.tenHocVien)}"></label>
        <label class="field"><span>Nickname</span><input data-i="${i}" data-k="nickName" value="${escapeHtml(s.nickName)}"></label>
        <label class="field"><span>Điểm</span><input data-i="${i}" data-k="diem" type="number" min="0" max="10" step="0.1" value="${s.diem??""}"></label>
      </div>`;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll("input[data-k]").forEach(inp=>inp.addEventListener("input",e=>{
    const i=Number(e.target.dataset.i), k=e.target.dataset.k;
    state.students[i][k]=k==="diem"?(e.target.value===""?null:Number(e.target.value)):e.target.value;
    if(k==="diem" && $("#scoringMode").value==="balanced") state.students[i].skills=defaultSkills(state.students[i].diem, `${state.students[i].tenHocVien}|${state.students[i].nickName}|${i}`);
    renderStudentNav();
    if(i===state.current) renderPreview();
  }));
  wrap.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>{
    state.students.splice(Number(btn.dataset.remove),1);
    state.current=Math.max(0,Math.min(state.current,state.students.length-1));
    renderStudentsEditor(); renderStudentNav(); renderPreview();
  }));
}

function renderStudentNav(){
  $("#classCount").textContent=`${state.students.length} HỌC VIÊN`;
  $("#previewClass").textContent=$("#className").value||"Chưa có lớp";
  const sel=$("#studentSelect");
  sel.innerHTML="";
  state.students.forEach((s,i)=>{
    const o=document.createElement("option");
    o.value=i; o.textContent=`${i+1}. ${s.tenHocVien}`;
    sel.appendChild(o);
  });
  if(state.students.length) sel.value=String(state.current);
}
function current(){return state.students[state.current];}
function overall(sk){return Math.round(skillNames.map(k=>clamp(sk[k])).reduce((a,b)=>a+b,0)/4);}
function overallText(v){
  if(v>=80)return"Năng lực tổng thể ở mức xuất sắc.";
  if(v>=60)return"Năng lực tổng thể ở mức tốt và đang tiến bộ.";
  if(v>=40)return"Năng lực tổng thể ở mức khá, cần luyện tập thêm.";
  if(v>=20)return"Năng lực tổng thể ở mức trung bình.";
  return"Năng lực tổng thể cần được hỗ trợ thêm.";
}

function renderPreview(){
  const s=current();
  if(!s){
    $("#reportPaper").classList.add("hidden");
    $("#emptyState").classList.remove("hidden");
    return;
  }
  $("#reportPaper").classList.remove("hidden");
  $("#emptyState").classList.add("hidden");

  $("#rName").textContent=s.tenHocVien;
  $("#rClass").textContent=$("#className").value;
  $("#rDate").textContent=$("#dateEval").value||$("#dateLearn").value;
  $("#rShift").textContent=$("#timeLearn").value;
  $("#rTeacher").textContent=teacherName()||"—";
  $("#rSubject").textContent=$("#subject").value;

  const r=s.report;
  $("#rConcept").textContent=r.concept||$("#lessonContent").value;
  $("#rCompletion").textContent=r.completion||"Hoàn thành các nhiệm vụ thực hành trong buổi học";
  $("#rProject").textContent=r.project||$("#lessonName").value;
  $("#rFocus").textContent=r.focus||$("#lessonContent").value;

  const ov=overall(s.skills);
  $("#rOverall").textContent=`${ov}%`;
  $("#rOverallText").textContent=r.overallText||overallText(ov);

  renderSkills(s);
  renderBullets("#strengths",r.strengths,true);
  renderBullets("#improvements",r.improvements,false);
  $("#teacherComment").textContent=r.teacherComment||"";
  $("#encouragement").textContent=r.encouragement||"";
  drawRadar(s.skills);
}

function renderSkills(s){
  const wrap=$("#skillList"); wrap.innerHTML="";
  skillNames.forEach(k=>{
    const item=document.createElement("div");
    item.className="skill-item";
    const icons={
      Programming:`<svg viewBox="0 0 24 24"><path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4 10.5 20"/></svg>`,
      Creativity:`<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M8.8 15.2A7 7 0 1 1 15.2 15.2c-.9.7-1.2 1.4-1.2 2.3h-4c0-.9-.3-1.6-1.2-2.3Z"/><path d="M12 2V1M5 5 4 4M19 5l1-1"/></svg>`,
      Design:`<svg viewBox="0 0 24 24"><path d="m5 19 6.8-6.8M14.2 9.8 20 4"/><path d="m5 4 15 15M4 8l12 12"/><path d="M3.5 3.5 7 4l13 13-3 3L4 7Z"/></svg>`,
      Logic:`<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="7" r="2.3"/><circle cx="12" cy="17" r="2.3"/><circle cx="12" cy="11.5" r="1.6"/><path d="M9.3 7h5.4M8.8 8.4l1.8 1.6M15.2 8.4 13.4 10M11.4 13l-.7 1.8M12.6 13l.7 1.8"/></svg>`
    };
    item.innerHTML=`
      <div class="skill-icon-box">
        <div class="skill-icon-circle">${icons[k]||""}</div>
      </div>
      <div class="skill-content">
        <div class="skill-line">
          <span class="skill-name">${k}</span>
          <div class="skill-score" contenteditable="true" data-skill="${k}">${Math.round(clamp(s.skills[k]))}%</div>
        </div>
        <div class="bar"><i style="width:${clamp(s.skills[k])}%"></i></div>
      </div>`;
    wrap.appendChild(item);
  });
  wrap.querySelectorAll("[data-skill]").forEach(inp=>inp.addEventListener("input",e=>{
    const raw=e.target.innerText.replace(/[^0-9.]/g,"");
    const val=clamp(raw);
    s.skills[e.target.dataset.skill]=val;
    e.target.textContent=`${Math.round(val)}%`;
    renderPreview();
  }));
}

function renderBullets(sel,items,stars){
  const wrap=$(sel); wrap.innerHTML="";
  const student=current();
  const seed=nameSeed(`${student?.tenHocVien||""}|${student?.nickName||""}`);
  const strengthBank=[
    "Chủ động tham gia hoạt động",
    "Đóng góp ý tưởng trong giờ học",
    "Tập trung nghe giảng và quan sát",
    "Hoàn thành nhiệm vụ đúng tiến độ",
    "Thực hiện thao tác khá cẩn thận",
    "Biết thử nhiều cách khi gặp lỗi",
    "Phối hợp tốt trong hoạt động thực hành",
    "Ghi nhớ tốt kiến thức vừa học"
  ];
  const improveBank=[
    "Cẩn thận hơn khi thao tác",
    "Tăng cường kỹ năng tìm và sửa lỗi",
    "Mạnh dạn đặt câu hỏi khi gặp vấn đề khó",
    "Chủ động kiểm tra lại sản phẩm trước khi hoàn thành",
    "Rèn thêm khả năng trình bày ý tưởng",
    "Tập trung hơn ở các bước thực hành",
    "Luyện thêm tốc độ hoàn thành nhiệm vụ"
  ];
  const bank=stars?strengthBank:improveBank;
  const wanted=stars?6:4;
  const defaults=[];
  for(let n=0;n<wanted;n++) defaults.push(bank[(seed+n*3)%bank.length]);
  const arr=(items&&items.length?items:defaults).slice(0,stars?6:5);
  arr.forEach((txt,i)=>{
    const row=document.createElement("div");
    row.className="bullet-row";
    row.innerHTML=`<div class="stars">${stars?"★".repeat(Math.min(5,3+i%2)):"★"}</div><div class="bullet-text" contenteditable="true" data-bullet="${i}">${escapeHtml(txt)}</div>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll("[data-bullet]").forEach(inp=>inp.addEventListener("input",e=>{
    const target=stars?current().report.strengths:current().report.improvements;
    while(target.length<=Number(e.target.dataset.bullet)) target.push("");
    target[Number(e.target.dataset.bullet)]=e.target.innerText;
  }));
}

function renderRadarSkillSummary(sk){
  const wrap=$("#radarSkillSummary");
  if(!wrap) return;
  const iconMap={
    Programming:`<svg viewBox="0 0 24 24"><path d="M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4 10.5 20"/></svg>`,
    Creativity:`<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M8.8 15.2A7 7 0 1 1 15.2 15.2c-.9.7-1.2 1.4-1.2 2.3h-4c0-.9-.3-1.6-1.2-2.3Z"/></svg>`,
    Design:`<svg viewBox="0 0 24 24"><path d="m5 19 6.8-6.8M14.2 9.8 20 4"/><path d="m5 4 15 15"/></svg>`,
    Logic:`<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="7" r="2.3"/><circle cx="12" cy="17" r="2.3"/><path d="M9.3 7h5.4M8.8 8.4l2.1 5.7M15.2 8.4l-2.1 5.7"/></svg>`
  };
  wrap.innerHTML=skillNames.map(k=>`
    <div class="radar-summary-row">
      <span class="radar-summary-icon">${iconMap[k]||""}</span>
      <span class="radar-summary-name">${k}</span>
      <b>${Math.round(clamp(sk[k]))}%</b>
    </div>`).join("");
}

function drawRadar(sk){
  const svg=$("#radar"),cx=150,cy=105,R=72;
  const axes=[[-Math.PI/2,sk.Programming],[0,sk.Creativity],[Math.PI/2,sk.Design],[Math.PI,sk.Logic]];
  const poly=r=>axes.map(([a])=>`${cx+Math.cos(a)*R*r},${cy+Math.sin(a)*R*r}`).join(" ");
  let h="";
  [1,.75,.5,.25].forEach(r=>h+=`<polygon points="${poly(r)}" fill="none" stroke="#cfd9e6"/>`);
  axes.forEach(([a])=>h+=`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}" stroke="#d6e0ec"/>`);
  const vp=axes.map(([a,v])=>`${cx+Math.cos(a)*R*clamp(v)/100},${cy+Math.sin(a)*R*clamp(v)/100}`).join(" ");
  h+=`<polygon points="${vp}" fill="rgba(197,34,40,.18)" stroke="#c52228" stroke-width="2"/>`;
  axes.forEach(([a,v])=>{
    const x=cx+Math.cos(a)*R*clamp(v)/100,y=cy+Math.sin(a)*R*clamp(v)/100;
    const lx=cx+Math.cos(a)*(R+20),ly=cy+Math.sin(a)*(R+20)+3;
    h+=`<circle cx="${x}" cy="${y}" r="4" fill="#10386f" stroke="white" stroke-width="2"/><text x="${lx}" y="${ly}" text-anchor="middle" font-size="9" font-weight="700">${Math.round(v)}%</text>`;
  });
  svg.innerHTML=h;
  renderRadarSkillSummary(sk);
}

function syncReport(){
  const s=current(); if(!s)return;
  Object.assign(s.report,{
    concept:$("#rConcept").innerText,
    completion:$("#rCompletion").innerText,
    project:$("#rProject").innerText,
    focus:$("#rFocus").innerText,
    teacherComment:$("#teacherComment").innerText,
    encouragement:$("#encouragement").innerText
  });
}

async function generate(){
  if(!state.students.length)return toast("Chưa có học viên.");
  syncReport();
  const btn=$("#generateBtn"),old=btn.textContent;
  btn.disabled=true; btn.textContent="Đang tạo...";
  try{
    const payload={
      teacher:teacherName(),subject:$("#subject").value,tone:$("#tone").value,scoringMode:$("#scoringMode").value,
      classInfo:{tenLop:$("#className").value,ngayHoc:$("#dateLearn").value,ngayDanhGia:$("#dateEval").value,thoiGianHoc:$("#timeLearn").value,tenBuoiHoc:$("#sessionName").value,tenBaiHoc:$("#lessonName").value,noiDungBaiHoc:$("#lessonContent").value},
      students:state.students.map(s=>({tenHocVien:s.tenHocVien,nickName:s.nickName,diemDanh:s.diemDanh,diem:s.diem,skills:s.skills}))
    };
    const res=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const body=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(body.error||`HTTP ${res.status}`);
    if(!Array.isArray(body.students)) throw new Error("Backend trả dữ liệu không hợp lệ.");
    body.students.forEach((g,i)=>{
      const exact = state.students.find(s => safe(s.tenHocVien) === safe(g.tenHocVien));
      const s = exact || state.students[i];
      if(!s) return;
      if(g.skills&&$("#scoringMode").value!=="manual") skillNames.forEach(k=>{ if(g.skills[k]!=null) s.skills[k]=clamp(g.skills[k]); });
      s.report={
        concept:safe(g.concept),
        completion:safe(g.completion),
        project:safe(g.project),
        focus:safe(g.focus),
        overallText:safe(g.overallText),
        strengths:Array.isArray(g.strengths)?g.strengths:[],
        improvements:Array.isArray(g.improvements)?g.improvements:[],
        teacherComment:safe(g.teacherComment),
        encouragement:safe(g.encouragement)
      };
    });
    renderPreview(); toast("Đã tạo report cho cả lớp.");
  }catch(e){ console.error(e); toast("Lỗi AI: "+e.message); }
  finally{btn.disabled=false;btn.textContent=old;}
}

async function pdfBlob(){
  syncReport();

  const paper=$("#reportPaper");

  // Wait for the browser to paint the exact live preview before capture.
  await new Promise(requestAnimationFrame);
  await new Promise(r=>setTimeout(r,80));

  const canvas=await html2canvas(paper,{
    scale:2,
    backgroundColor:"#ffffff",
    useCORS:false,
    allowTaint:true,
    logging:false,
    scrollX:0,
    scrollY:-window.scrollY
  });

  if(!canvas || !canvas.width || !canvas.height){
    throw new Error("Không tạo được ảnh PDF.");
  }

  const img=canvas.toDataURL("image/jpeg",0.96);
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});

  const pageW=210;
  const pageH=297;
  const imgH=canvas.height*pageW/canvas.width;

  pdf.addImage(img,"JPEG",0,0,pageW,imgH);

  let remaining=imgH-pageH;
  let y=-pageH;
  while(remaining>0){
    pdf.addPage();
    pdf.addImage(img,"JPEG",0,y,pageW,imgH);
    remaining-=pageH;
    y-=pageH;
  }

  return pdf.output("blob");
}

function dl(blob,name){
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);
}
const filename=s=>safe(s).replace(/[\\/:*?"<>|]/g,"-").replace(/\s+/g," ").trim()||"report";
async function exportPdf(){
  if(!current()) return toast("Chưa có học viên.");
  $("#pdfBtn").disabled=true;
  try{
    toast("Đang tạo PDF...");
    const blob=await pdfBlob();
    dl(blob,`${filename($("#className").value)}-${filename(current().tenHocVien)}.pdf`);
    toast("Đã tải PDF.");
  }catch(e){
    console.error("PDF export error:",e);
    toast("Lỗi xuất PDF: "+e.message);
  }finally{
    $("#pdfBtn").disabled=false;
  }
}
async function exportZip(){
  if(!state.students.length) return toast("Chưa có học viên.");
  const old=state.current;
  const zip=new JSZip();
  $("#zipBtn").disabled=true;

  try{
    toast("Đang tạo ZIP...");
    for(let i=0;i<state.students.length;i++){
      state.current=i;
      renderStudentNav();
      renderPreview();
      await new Promise(r=>setTimeout(r,80));
      const blob=await pdfBlob();
      zip.file(`${filename(current().tenHocVien)}.pdf`,blob);
    }

    const out=await zip.generateAsync({type:"blob"});
    dl(out,`${filename($("#className").value)}-reports.zip`);
    toast("Đã tải ZIP toàn lớp.");
  }catch(e){
    console.error("ZIP export error:",e);
    toast("Lỗi xuất ZIP: "+e.message);
  }finally{
    state.current=old;
    renderStudentNav();
    renderPreview();
    $("#zipBtn").disabled=false;
  }
}

// Upload: the label opens the native file picker even if JS click handlers fail.
$("#jsonFile").addEventListener("change",async e=>{
  const f=e.target.files?.[0]; if(!f)return;
  try{
    const text=await f.text();
    loadData(JSON.parse(text));
  }catch(err){
    console.error(err);
    $("#loadStatus").textContent="Không đọc được file JSON.";
    toast("Không đọc được file JSON. Kiểm tra file EMS.");
  }
});

const dz=$("#dropzone");
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add("dragging");}));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove("dragging");}));
dz.addEventListener("drop",async e=>{
  const f=e.dataTransfer.files?.[0]; if(!f)return;
  try{loadData(JSON.parse(await f.text()));}catch(err){toast("Không đọc được file JSON.");}
});

$("#addStudentBtn").addEventListener("click",()=>{state.students.push(makeStudent({},state.students.length));renderStudentsEditor();renderStudentNav();renderPreview();});
$("#studentSelect").addEventListener("change",e=>{syncReport();state.current=Number(e.target.value)||0;renderPreview();});
$("#prevStudent").addEventListener("click",()=>{if(!state.students.length)return;syncReport();state.current=(state.current-1+state.students.length)%state.students.length;renderStudentNav();renderPreview();});
$("#nextStudent").addEventListener("click",()=>{if(!state.students.length)return;syncReport();state.current=(state.current+1)%state.students.length;renderStudentNav();renderPreview();});
["#subject","#className","#dateLearn","#dateEval","#timeLearn","#sessionName","#lessonName","#lessonContent"].forEach(sel=>{
  $(sel).addEventListener("input",()=>{renderStudentNav();renderPreview();});
});
$("#teacher").addEventListener("change",()=>{
  const custom=$("#teacher").value==="__other__";
  $("#teacherOtherWrap").classList.toggle("hidden",!custom);
  if(custom) setTimeout(()=>$("#teacherOther").focus(),0);
  renderPreview();
});
$("#teacherOther").addEventListener("input",renderPreview);
["#rConcept","#rCompletion","#rProject","#rFocus","#teacherComment","#encouragement"].forEach(sel=>{
  document.addEventListener("input",e=>{if(e.target.matches(sel))syncReport();});
});
$("#generateBtn").addEventListener("click",generate);
$("#pdfBtn").addEventListener("click",exportPdf);
$("#zipBtn").addEventListener("click",exportZip);
$("#dateEval").value=todayVN();
