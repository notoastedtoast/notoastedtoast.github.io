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

/* stat counters */
const so = new IntersectionObserver(es => {
  es.forEach(e => {
    if(!e.isIntersecting) return;
    so.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, dur = 900, t0 = performance.now();
    (function tick(now){
      const k = Math.min((now - t0)/dur, 1);
      el.textContent = Math.round(end * (1-Math.pow(1-k,3)));
      if(k < 1) requestAnimationFrame(tick);
    })(t0);
  });
}, {threshold:.5});
document.querySelectorAll(".hstat .v").forEach(el => so.observe(el));
