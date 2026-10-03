/* terminal typing */
const lines = [
  {p:"$ ", t:"whoami"},
  {o:"future_electrical_engineer · maker · Hanoi, VN"},
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

/* click any photo to view it full screen (fills the screen);
   click the enlarged photo to zoom to full resolution, click again to fit;
   click the background, Esc or × to close */
const lb = document.createElement("div");
lb.className = "lightbox";
lb.setAttribute("role", "dialog");
lb.setAttribute("aria-modal", "true");
lb.innerHTML = '<button class="lb-close" type="button" aria-label="Close">×</button><img alt=""><p class="lb-cap"></p>';
document.body.appendChild(lb);
const lbImg = lb.querySelector("img"), lbCap = lb.querySelector(".lb-cap");
let lbFrom = null;
function canZoom(){ return lbImg.naturalWidth > lbImg.width + 1 || lbImg.naturalHeight > lbImg.height + 1; }
function fitLightbox(){
  const nw = lbImg.naturalWidth, nh = lbImg.naturalHeight;
  if(!nw) return;
  lb.classList.remove("zoomed");
  const s = Math.min(innerWidth * 0.92 / nw, innerHeight * 0.84 / nh, 2);   // fill the screen, at most 2x upscale
  lbImg.style.width = Math.round(nw * s) + "px";
  lbImg.style.height = Math.round(nh * s) + "px";
  lbImg.classList.toggle("can-zoom", canZoom());
}
function zoomLightbox(e){
  const r = lbImg.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;  // keep the clicked spot in view
  lb.classList.add("zoomed");
  lbImg.style.width = lbImg.naturalWidth + "px";
  lbImg.style.height = lbImg.naturalHeight + "px";
  lb.scrollLeft = fx * lbImg.offsetWidth - innerWidth / 2;
  lb.scrollTop = fy * lbImg.offsetHeight - innerHeight / 2;
}
function openLightbox(src, alt, from){
  lbFrom = from;
  lbImg.style.width = lbImg.style.height = "";
  lbImg.onload = fitLightbox;
  lbImg.src = src;
  if(lbImg.complete) fitLightbox();
  lbImg.alt = alt;
  lbCap.textContent = alt;
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
  lb.querySelector(".lb-close").focus();
}
function closeLightbox(){
  lb.classList.remove("open", "zoomed");
  document.body.style.overflow = "";
  if(lbFrom) lbFrom.focus();
}
document.querySelectorAll("main img").forEach(img => {
  img.classList.add("zoomable");
  img.tabIndex = 0;
  img.addEventListener("click", () => openLightbox(img.currentSrc || img.src, img.alt, img));
  img.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openLightbox(img.currentSrc || img.src, img.alt, img); } });
});
/* links marked data-lightbox (e.g. "photo: award ceremony") open their image in the viewer too */
document.querySelectorAll("a[data-lightbox]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  openLightbox(a.href, a.textContent.replace(/^photo:\s*/i, ""), a);
}));
lbImg.addEventListener("click", e => {
  e.stopPropagation();
  if(lb.classList.contains("zoomed")) fitLightbox();
  else if(canZoom()) zoomLightbox(e);
  else closeLightbox();
});
lb.addEventListener("click", closeLightbox);
addEventListener("resize", () => { if(lb.classList.contains("open") && !lb.classList.contains("zoomed")) fitLightbox(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && lb.classList.contains("open")) closeLightbox(); });
