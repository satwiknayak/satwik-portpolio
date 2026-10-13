/* A dependency-free WebGL torus knot. The scene stays local to this page. */
(() => {
  'use strict';
  const canvas = document.getElementById('sculpture');
  const fallback = document.getElementById('art-fallback');
  if (!canvas) return;
  let gl;
  try { gl = canvas.getContext('webgl', {alpha:true, antialias:true, powerPreference:'low-power'}); } catch (_) {}
  const showFallback = () => {
    canvas.hidden = true;
    fallback.hidden = false;
    document.getElementById('sculpture-help').textContent = 'CODE × CURIOSITY × SECURITY';
  };
  if (!gl) { showFallback(); return; }

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUv;
    uniform vec3 uRotation;
    uniform float uAspect;
    uniform float uCamera;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    void main() {
      vec3 c=cos(uRotation),s=sin(uRotation);
      mat3 rx=mat3(1.,0.,0., 0.,c.x,s.x, 0.,-s.x,c.x);
      mat3 ry=mat3(c.y,0.,-s.y, 0.,1.,0., s.y,0.,c.y);
      mat3 rz=mat3(c.z,s.z,0., -s.z,c.z,0., 0.,0.,1.);
      mat3 rotation=rz*rx*ry;
      vec3 world=rotation*aPosition;
      vNormal=rotation*aNormal;
      vPosition=world;
      vUv=aUv;
      float z=world.z-uCamera;
      float focal=2.8239;
      gl_Position=vec4(world.x*focal/uAspect,world.y*focal,-1.002002*z-0.2002002,-z);
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float uCamera;
    void main() {
      vec3 n=normalize(vNormal);
      vec3 view=normalize(vec3(0.,0.,uCamera)-vPosition);
      vec3 lightA=normalize(vec3(-3.0,4.5,5.0));
      vec3 lightB=normalize(vec3(4.,-1.,2.));
      vec3 lightC=normalize(vec3(-2.,-3.,-1.));
      float diffuse=max(dot(n,lightA),0.);
      float fill=max(dot(n,lightB),0.);
      float rim=pow(1.-max(dot(n,view),0.),2.6);
      vec3 reflectV=reflect(-view,n);
      float band=pow(max(0.,sin(reflectV.y*3.2+reflectV.x*.6+.3)),10.);
      float sheen=pow(max(0.,dot(n,normalize(lightA+view))),75.);
      float sheenB=pow(max(0.,dot(n,normalize(lightB+view))),40.);
      float back=max(dot(n,lightC),0.);
      vec3 base=mix(vec3(.022,.082,.03),vec3(.51,.74,.28),.2+diffuse*.8);
      vec3 color=base*(.4+diffuse*.65+fill*.28);
      color+=vec3(.75,.9,.57)*band*.52;
      color+=vec3(1.,.99,.82)*sheen*.9;
      color+=vec3(.51,.87,.73)*sheenB*.45;
      color+=vec3(.54,.82,.28)*rim*.42;
      color+=vec3(.06,.22,.10)*back*.3;
      float fineRib=pow(.5+.5*cos(vUv.x*6.283185*150.),8.);
      color*=.965+.035*fineRib;
      color=pow(color,vec3(.87));
      gl_FragColor=vec4(color,1.);
    }
  `;
  function shader(type,source) {
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) {gl.deleteShader(s);throw new Error('Shader unavailable');}
    return s;
  }
  let program;
  try {
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexSource));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentSource));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Scene unavailable');
  } catch (_) {showFallback();return;}
  gl.useProgram(program);
  const normalize=v=>{const len=Math.hypot(...v)||1;return v.map(x=>x/len);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const path=t=>[(1.42+.46*Math.cos(3*t))*Math.cos(2*t),(1.42+.46*Math.cos(3*t))*Math.sin(2*t),.50*Math.sin(3*t)];
  const segments=240,sides=36,vertices=[],normals=[],uvs=[],indices=[];
  for(let i=0;i<=segments;i++) {
    const u=i/segments,t=u*Math.PI*2,p=path(t),a=path(t-.001),b=path(t+.001);
    const tangent=normalize(b.map((v,j)=>v-a[j]));
    const normal=normalize(cross(tangent,[0,0,1]));
    const binormal=normalize(cross(tangent,normal));
    for(let j=0;j<=sides;j++) {
      const v=j/sides,angle=v*Math.PI*2;
      const n=normal.map((value,k)=>Math.cos(angle)*value+Math.sin(angle)*binormal[k]);
      vertices.push(...p.map((value,k)=>value+n[k]*.235));
      normals.push(...n);uvs.push(u,v);
      if(i<segments&&j<sides) {
        const first=i*(sides+1)+j,next=first+sides+1;
        indices.push(first,next,first+1,next,next+1,first+1);
      }
    }
  }
  function attribute(name,data,size) {
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    const location=gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
  }
  attribute('aPosition',vertices,3);attribute('aNormal',normals,3);attribute('aUv',uvs,2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const uniforms={rotation:gl.getUniformLocation(program,'uRotation'),aspect:gl.getUniformLocation(program,'uAspect'),camera:gl.getUniformLocation(program,'uCamera')};
  gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  let paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible=true,lost=false,frame=0,last=0,spin=.3,dragX=0,dragY=0,aspect=1;
  let dragging=false,pointerX=0,pointerY=0,driftX=0,driftY=0,smoothDriftX=0,smoothDriftY=0;
  let scrollPhase=0,targetScrollPhase=0;
  function resize() {
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
    aspect=rect.width/rect.height;gl.viewport(0,0,canvas.width,canvas.height);schedule();
  }
  function draw(time) {
    frame=0;
    if(lost||document.hidden||!visible){last=0;return;}
    if(!paused&&!dragging&&last)spin+=Math.min(time-last,50)*.00016;
    last=time;
    smoothDriftX+=(driftX-smoothDriftX)*.06;smoothDriftY+=(driftY-smoothDriftY)*.06;
    scrollPhase=paused?0:scrollPhase+(targetScrollPhase-scrollPhase)*.09;
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform3f(uniforms.rotation,-.53+dragY+smoothDriftY*.5+scrollPhase*1.25,spin+dragX+smoothDriftX*.7+scrollPhase*3.8,.40+Math.sin(spin*.7)*.1-scrollPhase*.55);
    gl.uniform1f(uniforms.aspect,aspect);
    gl.uniform1f(uniforms.camera,(6.9-scrollPhase*.8)/Math.min(aspect,1));
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    if(!paused)schedule();
  }
  function schedule(){if(!frame&&!lost&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  canvas.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    dragging=true;pointerX=e.clientX;pointerY=e.clientY;
    canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove',e=>{
    if(dragging) {
      dragX+=(e.clientX-pointerX)*.008;
      dragY=Math.max(-1.3,Math.min(1.3,dragY+(e.clientY-pointerY)*.008));
      pointerX=e.clientX;pointerY=e.clientY;schedule();
    }else if(e.pointerType==='mouse'&&!paused){
      const r=canvas.getBoundingClientRect();driftX=(e.clientX-r.left)/r.width-.5;driftY=(e.clientY-r.top)/r.height-.5;
    }
  });
  const release=()=>{dragging=false;canvas.classList.remove('dragging');};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('pointerleave',()=>{if(!dragging){driftX=0;driftY=0;}});
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();
    if(e.key==='ArrowLeft')dragX-=.18;
    if(e.key==='ArrowRight')dragX+=.18;
    if(e.key==='ArrowUp')dragY-=.18;
    if(e.key==='ArrowDown')dragY+=.18;
    dragY=Math.max(-1.3,Math.min(1.3,dragY));schedule();
  });
  window.addEventListener('portfolio-motion',e=>{paused=e.detail.paused;last=0;driftX=0;driftY=0;schedule();});
  window.addEventListener('portfolio-scroll',e=>{
    targetScrollPhase=e.detail.active?Math.max(0,Math.min(1,e.detail.heroProgress)):0;
    schedule();
  });
  document.addEventListener('visibilitychange',()=>{last=0;schedule();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;schedule();},{rootMargin:'50px'}).observe(canvas);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;if(frame)cancelAnimationFrame(frame);frame=0;showFallback();});
  resize();
})();
