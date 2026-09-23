/* terminal typing */
const lines = [
  {p:"$ ", t:"whoami"},
  {o:"student_engineer · maker · Hanoi, VN"},
  {p:"$ ", t:"ls ~/projects"},
  {o:"smart-pillow/   air-map/   vex-iq-robot/"},
  {p:"$ ", t:"cat mission.txt"},
  {hl:"» make invisible signals visible — and useful for people."}
];
const term = document.getElementById("term");
let li = 0;
function nextLine(){
  if(li >= lines.length){
    const c = document.createElement("div");
    c.className = "ln";
    c.innerHTML = '<span class="p">$ </span><span class="cursor"></span>';
    term.appendChild(c);
    return;
  }
  const l = lines[li++];
  const div = document.createElement("div");
  div.className = "ln";
  term.appendChild(div);
  if(l.t !== undefined){
    div.innerHTML = '<span class="p">'+l.p+'</span><span class="cmd"></span>';
    const tgt = div.querySelector(".cmd");
    let i = 0;
    (function type(){
      if(i < l.t.length){
        tgt.textContent += l.t[i++];
        setTimeout(type, 45);
      } else setTimeout(nextLine, 250);
    })();
  } else {
    div.innerHTML = '<span class="'+(l.hl?'hl':'o')+'"></span>';
    div.firstChild.textContent = l.hl || l.o;
    setTimeout(nextLine, 350);
  }
}
if(term) setTimeout(nextLine, 600);

/* scroll reveal */
const io = new IntersectionObserver(es => {
  es.forEach(e => { if(e.isIntersecting){ e.target.classList.add("on"); io.unobserve(e.target); } });
}, {threshold:.12});
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* stat counters — numbers count up (decimals kept, e.g. 7.5);
   anything else (e.g. A*AA) is simply shown as written */
const so = new IntersectionObserver(es => {
  es.forEach(e => {
    if(!e.isIntersecting) return;
    so.unobserve(e.target);
    const el = e.target, raw = el.dataset.count, end = Number(raw);
    if(raw === "" || isNaN(end)){ el.textContent = raw; return; }
    const dp = (raw.split(".")[1] || "").length, dur = 900, t0 = performance.now();
    (function tick(now){
      const k = Math.min((now - t0)/dur, 1);
      el.textContent = (end * (1-Math.pow(1-k,3))).toFixed(dp);
      if(k < 1) requestAnimationFrame(tick);
    })(t0);
  });
}, {threshold:.5});
document.querySelectorAll(".hstat .v").forEach(el => so.observe(el));

/* light / dark toggle — light by default, choice is remembered in localStorage */
const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
function paintToggle(){
  const light = root.dataset.theme === "light";
  toggle.textContent = light ? "☾ dark" : "☀ light";
  toggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
}
function setTheme(light){
  if(light) root.dataset.theme = "light"; else delete root.dataset.theme;
  try{ localStorage.setItem("site-theme", light ? "light" : "dark"); }catch(e){}
  paintToggle();
}
if(toggle){
  paintToggle();
  toggle.addEventListener("click", () => {
    const light = root.dataset.theme !== "light";
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(document.startViewTransition && !calm) document.startViewTransition(() => setTheme(light));
    else setTheme(light);
  });
}
