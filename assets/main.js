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

/* photo viewer: click any photo (or a link marked data-lightbox) to view it full screen.
   ‹ › buttons or the arrow keys move between the photos of the same card / achievement;
   click the enlarged photo to zoom to full resolution, click again to fit;
   click the background, Esc or × to close. The caption is the image's data-cap (or its alt text). */
const lb = document.createElement("div");
lb.className = "lightbox";
lb.setAttribute("role", "dialog");
lb.setAttribute("aria-modal", "true");
lb.innerHTML = '<button class="lb-close" type="button" aria-label="Close">×</button>' +
  '<button class="lb-nav lb-prev" type="button" aria-label="Previous photo">‹</button>' +
  '<button class="lb-nav lb-next" type="button" aria-label="Next photo">›</button>' +
  '<img alt=""><p class="lb-cap"></p>';
document.body.appendChild(lb);
const lbImg = lb.querySelector("img"), lbCap = lb.querySelector(".lb-cap");
const lbPrev = lb.querySelector(".lb-prev"), lbNext = lb.querySelector(".lb-next");
let lbFrom = null, lbGroup = [], lbIndex = 0;
function canZoom(){ return lbImg.naturalWidth > lbImg.width + 1 || lbImg.naturalHeight > lbImg.height + 1; }
function fitLightbox(){
  const nw = lbImg.naturalWidth, nh = lbImg.naturalHeight;
  if(!nw) return;
  lb.classList.remove("zoomed");
  const s = Math.min(innerWidth * 0.86 / nw, innerHeight * 0.80 / nh, 2);   // fill the screen, at most 2x upscale
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
/* each viewable item: { el, src, cap } */
function itemOf(el){
  if(el.tagName === "A"){
    const img = el.querySelector("img");
    const cap = img ? (img.dataset.cap || img.alt) : el.textContent.replace(/^photo:\s*/i, "");
    return { el, src: el.href, cap };
  }
  return { el, src: el.currentSrc || el.src, cap: el.dataset.cap || el.alt };
}
function viewables(scope){
  return [...scope.querySelectorAll("img, a[data-lightbox]")]
    .filter(el => el.tagName === "A" || !el.closest("a[data-lightbox]"))
    .filter(el => el.tagName === "A" || el.closest("main"));
}
function showItem(i){
  lbIndex = (i + lbGroup.length) % lbGroup.length;
  const it = lbGroup[lbIndex];
  lb.classList.remove("zoomed");
  lbImg.style.width = lbImg.style.height = "";
  lbImg.onload = fitLightbox;
  lbImg.src = it.src;
  if(lbImg.complete) fitLightbox();
  lbImg.alt = it.cap;
  lbCap.textContent = lbGroup.length > 1 ? it.cap + "  ·  " + (lbIndex + 1) + " / " + lbGroup.length : it.cap;
  lb.classList.toggle("single", lbGroup.length < 2);
}
function openLightbox(el){
  lbFrom = el;
  const scope = el.closest(".card, .tl-item, .proj, .about-row, .hero") || el.parentElement;
  lbGroup = viewables(scope).map(itemOf);
  const start = Math.max(0, lbGroup.findIndex(it => it.el === el));
  if(!lbGroup.length) lbGroup = [itemOf(el)];
  showItem(start);
  lb.classList.add("open");
  document.body.style.overflow = "hidden";
  lb.querySelector(".lb-close").focus();
}
function closeLightbox(){
  lb.classList.remove("open", "zoomed");
  document.body.style.overflow = "";
  if(lbFrom) lbFrom.focus();
}
viewables(document.querySelector("main") || document.body).forEach(el => {
  if(el.tagName === "IMG"){ el.classList.add("zoomable"); el.tabIndex = 0; }
  el.addEventListener("click", e => { e.preventDefault(); openLightbox(el); });
  el.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openLightbox(el); } });
});
lbPrev.addEventListener("click", e => { e.stopPropagation(); showItem(lbIndex - 1); });
lbNext.addEventListener("click", e => { e.stopPropagation(); showItem(lbIndex + 1); });
lbImg.addEventListener("click", e => {
  e.stopPropagation();
  if(lb.classList.contains("zoomed")) fitLightbox();
  else if(canZoom()) zoomLightbox(e);
  else closeLightbox();
});
lb.addEventListener("click", closeLightbox);
addEventListener("resize", () => { if(lb.classList.contains("open") && !lb.classList.contains("zoomed")) fitLightbox(); });
document.addEventListener("keydown", e => {
  if(!lb.classList.contains("open")) return;
  if(e.key === "Escape") closeLightbox();
  else if(e.key === "ArrowLeft" && lbGroup.length > 1) showItem(lbIndex - 1);
  else if(e.key === "ArrowRight" && lbGroup.length > 1) showItem(lbIndex + 1);
});
const certificateDialog = document.querySelector(".certificate-dialog");
const certificateZoom = document.querySelector(".certificate-zoom");
const certificateClose = certificateDialog ? certificateDialog.querySelector(".certificate-close") : null;
if(certificateDialog && certificateZoom && certificateClose){
  certificateZoom.addEventListener("click", () => certificateDialog.showModal());
  certificateClose.addEventListener("click", () => certificateDialog.close());
  certificateDialog.addEventListener("click", e => {
    if(e.target === certificateDialog) certificateDialog.close();
  });
}
