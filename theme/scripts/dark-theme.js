/* ===== Dark Theme Shared JS ===== */

// Custom cursor
(function(){
  const c = document.getElementById('cursor');
  const r = document.getElementById('cursorRing');
  if(!c||!r) return;
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;c.style.left=mx-5+'px';c.style.top=my-5+'px'});
  function animRing(){rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;r.style.left=rx-18+'px';r.style.top=ry-18+'px';requestAnimationFrame(animRing)}
  animRing();
  document.querySelectorAll('a,button,.btn-primary,.btn-secondary,.nav-cta').forEach(el=>{
    el.addEventListener('mouseenter',()=>{c.style.transform='scale(2)';r.style.transform='scale(0.6)'});
    el.addEventListener('mouseleave',()=>{c.style.transform='scale(1)';r.style.transform='scale(1)'});
  });
})();

// Canvas background
(function(){
  const canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W,H,particles=[];
  function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight}
  resize();
  window.addEventListener('resize',resize);
  for(let i=0;i<55;i++){
    particles.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,r:Math.random()*1.5+0.5,o:Math.random()*0.35+0.05,color:Math.random()>0.6?'56,189,248':'129,140,248'});
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color},${p.o})`;ctx.fill();
    });
    particles.forEach((p,i)=>{
      for(let j=i+1;j<particles.length;j++){
        const d=Math.hypot(p.x-particles[j].x,p.y-particles[j].y);
        if(d<120){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(56,189,248,${0.04*(1-d/120)})`;ctx.lineWidth=0.5;ctx.stroke();}
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// Scroll reveal
(function(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}});
  },{threshold:0.1});
  els.forEach(el=>io.observe(el));
})();

// Mobile nav toggle
(function(){
  const btn = document.getElementById('nav-hamburger');
  const menu = document.getElementById('mobile-nav');
  if(!btn||!menu) return;
  btn.addEventListener('click',()=>{
    menu.classList.toggle('open');
    btn.classList.toggle('active');
  });
})();

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(q=>{
  q.addEventListener('click',()=>{
    const item = q.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
});

// Active nav link highlight
(function(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.site-nav .nav-menu a, .mobile-nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href && href !== '#' && path.includes(href.replace('../','').split('/').pop())){
      a.classList.add('active');
    }
  });
})();
