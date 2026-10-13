/* Scroll drives perspective, depth, and the WebGL camera without intercepting scrolling. */
(() => {
  'use strict';
  const root=document.documentElement;
  const track=document.querySelector('.hero-track');
  const header=document.querySelector('.header');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!track)return;
  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
  const targets=[
    ...document.querySelectorAll('.section-heading, .project-card, .about-intro, .about-body, .education-item, .skill-group, .credentials-list article, .contact-content h2')
  ].map((el,index)=>{
    el.classList.add('scroll-depth');
    const strong=el.matches('.project-card, .skill-group');
    return {el,index,strong,top:0,height:0};
  });
  const chapters=[...document.querySelectorAll('.chapter-nav a')].map(a=>({a,el:document.querySelector(a.getAttribute('href')),top:0}));
  let paused=root.classList.contains('motion-paused'),frame=0,measureNeeded=true;
  let viewport=window.innerHeight,trackTop=0,trackHeight=1,pageHeight=1;
  root.classList.add('scroll-enhanced');

  // offsetTop follows layout, unlike transformed bounding boxes during animation.
  function layoutTop(el){let top=0;for(let node=el;node;node=node.offsetParent)top+=node.offsetTop;return top;}
  function measure(){
    viewport=window.innerHeight;
    trackTop=layoutTop(track);trackHeight=track.offsetHeight;
    pageHeight=Math.max(1,root.scrollHeight-viewport);
    targets.forEach(item=>{item.top=layoutTop(item.el);item.height=item.el.offsetHeight;});
    chapters.forEach(item=>{if(item.el)item.top=layoutTop(item.el);});
    measureNeeded=false;
  }
  function render(){
    frame=0;if(measureNeeded)measure();
    const y=window.scrollY||window.pageYOffset||0;
    const page=clamp(y/pageHeight);
    const motion=!paused&&!media.matches;
    const hero=motion?clamp((y-trackTop)/Math.max(1,trackHeight-viewport)):0;
    root.style.setProperty('--page-progress',page.toFixed(5));
    root.style.setProperty('--hero-progress',hero.toFixed(5));
    root.style.setProperty('--scene-turn',(motion?page*28:0).toFixed(3)+'deg');
    root.style.setProperty('--scene-travel',(motion?page*-200:0).toFixed(2)+'px');
    header.classList.toggle('is-scrolled',y>24);
    targets.forEach(item=>{
      const distance=item.top-y;
      const enter=clamp((viewport-distance)/Math.max(1,viewport*.83));
      const leave=clamp((-distance-item.height*.32)/Math.max(1,viewport*.75));
      const depth=motion?(1-enter):0;
      const exit=motion?leave:0;
      const sign=item.index%2===0?1:-1;
      const strength=item.strong?1:.36;
      item.el.style.setProperty('--depth-x',(sign*depth*18*strength).toFixed(2)+'px');
      item.el.style.setProperty('--depth-y',((depth*90-exit*32)*strength).toFixed(2)+'px');
      item.el.style.setProperty('--depth-z',((-depth*260-exit*90)*strength).toFixed(2)+'px');
      item.el.style.setProperty('--depth-rx',((depth*17-exit*5)*strength).toFixed(3)+'deg');
      item.el.style.setProperty('--depth-ry',(sign*(depth*13-exit*3)*strength).toFixed(3)+'deg');
      item.el.style.setProperty('--depth-opacity',(motion?clamp(.35+enter*.8,.35,1):1).toFixed(3));
    });
    let current=0;
    chapters.forEach((item,i)=>{if(item.top<=y+viewport*.43)current=i;});
    chapters.forEach((item,i)=>{
      const active=current===i;item.a.classList.toggle('is-current',active);
      if(active)item.a.setAttribute('aria-current','location');else item.a.removeAttribute('aria-current');
    });
    window.dispatchEvent(new CustomEvent('portfolio-scroll',{detail:{heroProgress:hero,pageProgress:page,active:motion}}));
  }
  function requestRender(){if(!frame)frame=requestAnimationFrame(render);}
  function requestMeasure(){measureNeeded=true;requestRender();}
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',requestMeasure,{passive:true});
  window.addEventListener('orientationchange',requestMeasure);
  window.addEventListener('load',requestMeasure);
  window.addEventListener('portfolio-motion',e=>{paused=e.detail.paused;requestRender();});
  media.addEventListener('change',requestMeasure);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(requestMeasure);
  if('ResizeObserver' in window){const ro=new ResizeObserver(requestMeasure);ro.observe(document.body);}
  requestRender();
})();
