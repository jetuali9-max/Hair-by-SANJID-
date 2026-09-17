const KEY="sanjidHairTrackerV1";
const DAY_MS=86400000;
const MISSIONS=[
  ["Wash / scalp care","Follow today's wash plan without over-washing."],
  ["Conditioner","Use conditioner after shampoo when washing."],
  ["Gentle handling","No rough towel rubbing or aggressive combing."],
  ["Low heat","Avoid unnecessary high heat / harsh styling."],
  ["Nutrition + water","Eat a balanced meal with protein and stay hydrated."]
];
let state=load();
let selectedDay=null;

function localDateISO(d=new Date()){
  const x=new Date(d.getTime()-d.getTimezoneOffset()*60000); return x.toISOString().slice(0,10);
}
function parseISO(s){return new Date(s+"T00:00:00")}
function defaultState(){
  const today=localDateISO();
  return {startDate:today, days:{}, lastOpened:today};
}
function load(){try{return Object.assign(defaultState(),JSON.parse(localStorage.getItem(KEY))||{})}catch{return defaultState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function dayIndex(date){return Math.floor((parseISO(date)-parseISO(state.startDate))/DAY_MS)+1}
function keyFor(date){return date}
function getDay(date){
  const k=keyFor(date);
  if(!state.days[k]) state.days[k]={checks:[false,false,false,false,false], opened:false, saved:false, photo:null, ai:null, note:"", time:null};
  return state.days[k];
}
function today(){return localDateISO()}
function fmt(date){return parseISO(date).toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}
function render(){
  const t=today(), idx=dayIndex(t), d=getDay(t);
  state.lastOpened=t; d.opened=true; save();
  document.getElementById("dayNumber").textContent=Math.max(1,Math.min(180,idx));
  document.getElementById("todayDate").textContent=fmt(t);
  document.getElementById("progressLabel").textContent=`${Math.max(0,Math.min(100,Math.round((Math.max(0,idx-1)/180)*100)))}% of journey elapsed`;
  document.getElementById("overallProgress").style.width=`${Math.max(0,Math.min(100,((Math.max(0,idx-1))/180)*100))}%`;
  document.getElementById("journeyText").textContent=idx<1?`Journey starts ${fmt(state.startDate)}.`:`You are on day ${idx} of your 180-day plan.`;
  renderMissions(d); renderStats(); renderPhoto(d); renderCalendar(); renderChart(); renderDetails(selectedDay||t);
  document.getElementById("startDate").value=state.startDate;
  document.getElementById("dayNote").value=d.note||"";
}
function renderMissions(d){
  const box=document.getElementById("missionList"); box.innerHTML="";
  MISSIONS.forEach((m,i)=>{
    const row=document.createElement("label"); row.className="mission";
    row.innerHTML=`<input type="checkbox" ${d.checks[i]?"checked":""}><div><b>${m[0]}</b><small>${m[1]}</small></div>`;
    row.querySelector("input").onchange=e=>{d.checks[i]=e.target.checked; d.saved=false; save(); render();};
    box.appendChild(row);
  });
  const done=d.checks.filter(Boolean).length;
  document.getElementById("missionStatus").textContent=`${done} / ${MISSIONS.length} completed`;
}
function renderStats(){
  const dates=Object.keys(state.days), t=today();
  let complete=0,missed=0,notOpened=0,photos=0;
  for(let i=0;i<180;i++){
    const date=localDateISO(new Date(parseISO(state.startDate).getTime()+i*DAY_MS));
    if(date>t) continue;
    const d=state.days[date];
    if(!d || !d.opened){ if(date<t) notOpened++; continue; }
    if(d.photo) photos++;
    if(d.saved && d.checks.every(Boolean)) complete++;
    else if(date<t) missed++;
  }
  document.getElementById("completeCount").textContent=complete;
  document.getElementById("missedCount").textContent=missed;
  document.getElementById("notOpenedCount").textContent=notOpened;
  document.getElementById("photoCount").textContent=photos;
  const td=state.days[t]; const score=td?Math.round(td.checks.filter(Boolean).length/5*100):0;
  document.getElementById("scoreRing").textContent=score;
  document.getElementById("ring").style.background=`conic-gradient(var(--accent2) ${score*3.6}deg,#273143 0deg)`;
}
function renderPhoto(d){
  const p=document.getElementById("photoPreview"), r=document.getElementById("aiReview");
  if(!d.photo){p.classList.add("hidden");r.classList.add("hidden");return}
  p.classList.remove("hidden"); p.innerHTML=`<img src="${d.photo}" alt="SANJID progress photo">`;
  if(d.ai){
    r.classList.remove("hidden");
    r.innerHTML=`<div class="score">${d.ai.score}/100</div><p><b>AI-style review:</b> ${d.ai.summary}</p><ul>${d.ai.tips.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  }
}
function analyzePhoto(dataUrl){
  // Local demo review: intentionally honest; it does not claim to be real computer vision.
  const d=getDay(today()), completed=d.checks.filter(Boolean).length;
  const score=Math.min(100,55+completed*7+(d.note?3:0));
  return {score,summary:score>=85?"Today’s routine looks highly consistent. Keep the same controlled approach.":score>=70?"Solid day. Your routine is becoming more consistent; keep the hair handling gentle.":"Today is a lower-consistency day. Focus on conditioner when washing, gentle drying, and avoiding unnecessary heat.",tips:["Keep the same photo angle and lighting for useful month-to-month comparison.","Do not judge hair density from one photo; compare similar photos over several weeks.","Keep conditioner on the lengths rather than the scalp if your hair gets weighed down easily."]};
}
document.getElementById("photoInput").onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    const d=getDay(today()); d.photo=reader.result; d.ai=analyzePhoto(reader.result); d.time=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); save(); render();
  }; reader.readAsDataURL(file);
};
document.getElementById("completeDayBtn").onclick=()=>{
  const d=getDay(today()); d.saved=true; d.opened=true; d.time=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); save(); render();
  alert(d.checks.every(Boolean)?"🔥 Day saved as COMPLETE!":"Day saved. Some missions are still incomplete.");
};
document.getElementById("saveNoteBtn").onclick=()=>{
  const d=getDay(today()); d.note=document.getElementById("dayNote").value.trim(); save(); render(); alert("Today's note saved.");
};
document.getElementById("startDate").onchange=e=>{
  if(!e.target.value)return;
  if(!confirm("Changing the start date changes all 180 day labels. Continue?")){e.target.value=state.startDate;return}
  state.startDate=e.target.value; save(); render();
};
document.getElementById("todayBtn").onclick=()=>{selectedDay=today();renderDetails(selectedDay);document.getElementById("missionTitle").scrollIntoView({behavior:"smooth",block:"start"})};
document.getElementById("resetBtn").onclick=()=>{
  if(confirm("Delete ALL local journey data, photos and notes? This cannot be undone.")){localStorage.removeItem(KEY);state=defaultState();selectedDay=null;render()}
};
function renderCalendar(){
  const c=document.getElementById("calendar");c.innerHTML="";
  const t=today();
  for(let i=0;i<180;i++){
    const date=localDateISO(new Date(parseISO(state.startDate).getTime()+i*DAY_MS));
    const d=state.days[date], cell=document.createElement("button"); cell.className="day-cell"; cell.textContent=i+1;
    if(d){if(d.saved&&d.checks.every(Boolean))cell.classList.add("complete");else if(date<t&&d.opened)cell.classList.add("missed");if(date<t&&!d.opened)cell.classList.add("not-opened");if(d.photo)cell.classList.add("photo")}
    if(date===selectedDay)cell.classList.add("selected");
    if(date>t)cell.style.opacity=".35";
    cell.title=`Day ${i+1} • ${fmt(date)}`;
    cell.onclick=()=>{selectedDay=date;renderCalendar();renderDetails(date)};
    c.appendChild(cell);
  }
}
function renderDetails(date){
  const box=document.getElementById("dayDetails"), d=state.days[date], idx=dayIndex(date);
  if(!d){box.innerHTML=`<p class="muted">Day ${idx} (${fmt(date)}) has no saved record yet.</p>`;return}
  const status=d.saved?(d.checks.every(Boolean)?"Complete":"Missed / partial"):(d.opened?"Opened, not saved":"Not opened");
  box.innerHTML=`<div class="detail-grid">
    <div class="detail-item"><span>DAY</span><b>${idx} • ${fmt(date)}</b></div>
    <div class="detail-item"><span>STATUS</span><b>${status}</b></div>
    <div class="detail-item"><span>TIME</span><b>${d.time||"—"}</b></div>
    <div class="detail-item"><span>PHOTO</span><b>${d.photo?"Added":"No photo"}</b></div>
  </div>
  <div class="detail-note"><b>Checklist:</b> ${d.checks.map((x,i)=>`${x?"✅":"⬜"} ${MISSIONS[i][0]}`).join(" • ")}</div>
  <div class="detail-note"><b>What I was doing:</b> ${d.note||"No note recorded."}</div>
  ${d.photo?`<img class="detail-photo" src="${d.photo}" alt="Day ${idx} photo">`:""}
  ${d.ai?`<div class="detail-note"><b>Photo review:</b> ${d.ai.score}/100 — ${d.ai.summary}</div>`:""}`;
}
function drawChart(){
  const canvas=document.getElementById("progressChart"),ctx=canvas.getContext("2d");
  const rect=canvas.getBoundingClientRect(), dpr=devicePixelRatio||1; canvas.width=rect.width*dpr; canvas.height=220*dpr; ctx.scale(dpr,dpr);
  const W=rect.width,H=220;ctx.clearRect(0,0,W,H);ctx.font="10px system-ui";ctx.fillStyle="#6f7b8d";
  const values=[];
  for(let i=0;i<180;i++){
    const date=localDateISO(new Date(parseISO(state.startDate).getTime()+i*DAY_MS)), day=state.days[date];
    values.push(day?(day.checks.filter(Boolean).length/5*100):null);
  }
  const maxVisible=Math.max(1,Math.min(180,dayIndex(today()))), left=28,right=10,top=18,bottom=30,w=W-left-right,h=H-top-bottom;
  [0,25,50,75,100].forEach(v=>{let y=top+h-v/100*h;ctx.strokeStyle="#1c2634";ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(W-right,y);ctx.stroke();ctx.fillText(v,left-24,y+3)});
  let last=null;
  values.slice(0,maxVisible).forEach((v,i)=>{if(v==null){last=null;return}const x=left+(i/Math.max(1,maxVisible-1))*w,y=top+h-v/100*h;if(last){ctx.strokeStyle="#7c5cff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(x,y);ctx.stroke()}ctx.fillStyle="#18e0b3";ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();last={x,y}});
  ctx.fillStyle="#6f7b8d";ctx.fillText("Day 1",left,H-9);ctx.fillText(`Day ${maxVisible}`,Math.max(left,W-55),H-9);
}
function renderChart(){requestAnimationFrame(drawChart)}
window.addEventListener("resize",renderChart);
render();
