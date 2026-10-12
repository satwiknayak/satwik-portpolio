(() => {
  'use strict';
  const root=document.documentElement;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let savedMotion=null;
  try{savedMotion=localStorage.getItem('satwik-motion');}catch(_){}
  let paused=reducedMotion.matches||savedMotion==='paused';
  const motionButton=document.getElementById('motion-toggle');
  function applyMotion(){
    root.classList.toggle('motion-paused',paused);
    motionButton.setAttribute('aria-pressed',String(paused));
    motionButton.setAttribute('aria-label',paused?'Resume animations':'Pause animations');
    motionButton.querySelector('.motion-text').textContent=paused?'Resume motion':'Pause motion';
    motionButton.querySelector('.motion-icon').textContent=paused?'▷':'Ⅱ';
    window.dispatchEvent(new CustomEvent('portfolio-motion',{detail:{paused}}));
    if(paused)document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
  }
  motionButton.addEventListener('click',()=>{
    paused=!paused;savedMotion=paused?'paused':'playing';applyMotion();
    try{localStorage.setItem('satwik-motion',savedMotion);}catch(_){}
  });
  reducedMotion.addEventListener('change',e=>{paused=e.matches||savedMotion==='paused';applyMotion();});
  applyMotion();

  const menuButton=document.querySelector('.menu-toggle');
  const mobileNav=document.getElementById('mobile-nav');
  function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');}
  menuButton.addEventListener('click',()=>{
    const open=menuButton.getAttribute('aria-expanded')!=='true';
    mobileNav.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  });
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
  document.addEventListener('click',e=>{if(!mobileNav.hidden&&!e.target.closest('.header'))closeMenu();});
  window.matchMedia('(min-width:601px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
  if('IntersectionObserver' in window){
    const navObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.desktop-nav a').forEach(a=>{
        const active=a.hash==='#'+entry.target.id;a.classList.toggle('active',active);
        if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
      });}});
    },{rootMargin:'-15% 0px -60% 0px',threshold:0});
    ['work','about','skills','contact'].forEach(id=>navObserver.observe(document.getElementById(id)));
  }

  const projects={
    poverty:{
      label:'01 / MACHINE LEARNING & DATA ANALYTICS',
      title:'Household Poverty Prediction System',
      intro:'A machine learning classification system that uses socioeconomic and demographic data to predict household poverty levels.',
      heading:'What I built',
      points:[
        'Prepared the data through preprocessing, feature scaling, and feature engineering.',
        'Trained Decision Tree, Random Forest, and Logistic Regression classification models.',
        'Created an interactive Streamlit dashboard to make the model accessible.',
        'Deployed trained models using Pickle.'
      ],
      tags:['Python','Decision Tree','Random Forest','Logistic Regression','Streamlit','Pickle']
    },
    vehicle:{
      label:'02 / FULL-STACK WEB DEVELOPMENT',
      title:'Vehicle Service Management System',
      intro:'A MERN-based web application connecting vehicle service booking, job card management, billing, and service history in a single workflow.',
      heading:'What I built',
      points:[
        'Developed the application with MongoDB, Express.js, React.js, and Node.js.',
        'Implemented separate, secure modules for administrators, employees, and customers with database integration.',
        'Built responsive interfaces for the service management experience.',
        'Created backend APIs to support booking, job cards, billing, and service history.'
      ],
      tags:['MongoDB','Express.js','React.js','Node.js','REST APIs','Responsive UI']
    }
  };
  const dialog=document.getElementById('project-dialog');
  const content=document.getElementById('dialog-content');
  let trigger=null;
  document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
    const project=projects[button.dataset.project];if(!project)return;
    trigger=button;
    content.innerHTML=`<p class="eyebrow">${project.label}</p><h2 id="dialog-title">${project.title}</h2><p class="dialog-intro">${project.intro}</p><h3>${project.heading}</h3><ul>${project.points.map(point=>`<li>${point}</li>`).join('')}</ul><h3>Technology & approach</h3><div class="tags">${project.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><div class="dialog-actions"><a class="button button-primary" href="mailto:satwiknayak9@gmail.com?subject=${encodeURIComponent('Let’s talk about '+project.title)}">Discuss this project <svg class="icon"><use href="#i-diagonal"/></svg></a><a class="button button-secondary" href="https://github.com/satwiknayak" target="_blank" rel="noopener noreferrer">GitHub profile <svg class="icon"><use href="#i-github"/></svg></a></div>`;
    dialog.showModal();dialog.scrollTop=0;document.body.classList.add('modal-open');
  }));
  function closeDialog(){dialog.close();}
  dialog.querySelector('.dialog-close').addEventListener('click',closeDialog);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(trigger)trigger.focus({preventScroll:true});});

  const toast=document.getElementById('toast');let toastTimer;
  function showToast(message){clearTimeout(toastTimer);toast.textContent=message;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),3200);}
  document.getElementById('copy-email').addEventListener('click',async()=>{
    const email='satwiknayak9@gmail.com';let success=false;
    try{await navigator.clipboard.writeText(email);success=true;}catch(_){
      const input=document.createElement('textarea');input.value=email;input.setAttribute('readonly','');input.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(input);input.select();
      try{success=document.execCommand('copy');}catch(_){}input.remove();document.getElementById('copy-email').focus({preventScroll:true});
    }
    showToast(success?'Email copied. Let’s make something happen!':'Email: '+email);
  });
  document.getElementById('year').textContent=String(new Date().getFullYear());
})();
