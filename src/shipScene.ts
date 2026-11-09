import {crewAreaModel} from '../shared/crewAppearance';
import {councilMember,councilMembers} from '../shared/council';
import {providerPlacement,councilSeats} from './providerLayout';
import {createPatrol,stepPatrol,patrolHeight} from './crewPatrol';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadCrewModel, makeCrewModel } from './crewModels';

import { departments as defaultDepartments, providers } from '../shared/organization';
export { defaultDepartments as departments };
export type Crew = { enabled?:boolean; id: string; name: string; role?:string; state: string; pending?: number; appearance: string; leaderId?: string; seat?: number };
type Actor = { id: string; root: T.Group; head: T.Group; arms: T.Group[]; status: T.Mesh; screen: T.Mesh; phase: number; standing?: boolean; baseY?: number };
export function createShip(host: HTMLDivElement, initial: Crew[], select: (id: string) => void, report: (fps: number, calls: number) => void, departments=defaultDepartments, tenantMode=false) {
  const extraDepth=Math.max(0,...departments.map(d=>Math.ceil(initial.filter(a=>a.leaderId===d.id).length/3)-2))*3.4;
  const shipRadius=Math.max(47,...departments.map(d=>Math.hypot(d.x,d.z)+11+extraDepth));
  const scale=shipRadius/47;
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .8;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label', 'Nave espacial 3D: arrastra para orbitar, rueda para acercar, clic para inspeccionar');
  renderer.domElement.tabIndex = 0;
  host.appendChild(renderer.domElement);
  const scene = new T.Scene(); scene.background = new T.Color('#141c3b');
  const environment = new RoomEnvironment(), pmrem = new T.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment, .05, .1, 100, { size: 128 });
  scene.environment = environmentMap.texture; scene.environmentIntensity = .65;
  environment.dispose(); pmrem.dispose();
  const camera = new T.PerspectiveCamera(43, 1, .1, 350*scale);
  camera.position.set(8, 64*scale, 88*scale);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0); controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minDistance = 4; controls.maxDistance = 145*scale; controls.maxPolarAngle = Math.PI * .47; controls.minPolarAngle = .12;
  controls.maxTargetRadius = shipRadius-3; controls.screenSpacePanning = false;
  const ambient = new T.HemisphereLight('#e5eaff', '#52546d', 1.5); scene.add(ambient);
  const sun = new T.DirectionalLight('#fff5ee', 2.1); sun.position.set(-20, 42, 25); scene.add(sun);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:.5,far:110});sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;
  sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;
  const rim = new T.DirectionalLight('#9a87ff', 2); rim.position.set(25, 10, -20); scene.add(rim);
  const staticRoot = new T.Group(), actorRoot = new T.Group();
  const torso = new T.LatheGeometry([new T.Vector2(.23, 0),new T.Vector2(.24,.12),new T.Vector2(.22,.3),new T.Vector2(.27,.52),new T.Vector2(.33,.72),new T.Vector2(.31,.8),new T.Vector2(.13,.87)], 16);
  torso.scale(1, 1, .57);
  const geos = { box: new T.BoxGeometry(1, 1, 1), rounded: new RoundedBoxGeometry(1,1,1,2,.075), torso, sphere: new T.SphereGeometry(1, 20, 14), cylinder: new T.CylinderGeometry(.86, 1, 1, 14), cone: new T.ConeGeometry(1, 1, 10) };
  const metalCanvas=document.createElement('canvas');metalCanvas.width=128;metalCanvas.height=128;
  const mc=metalCanvas.getContext('2d')!;mc.fillStyle='#e9e9ed';mc.fillRect(0,0,128,128);
  for(let i=0;i<128;i++){mc.strokeStyle=`rgba(80,75,100,${.025+(i*17%9)/180})`;mc.beginPath();mc.moveTo(0,i);mc.lineTo(128,i);mc.stroke();}
  mc.strokeStyle='#a8a4b5';mc.strokeRect(2,2,124,124);for(const x of [7,121])for(const y of [7,121]){mc.fillStyle='#9993a4';mc.fillRect(x,y,2,2);}
  const metalTexture=new T.CanvasTexture(metalCanvas);metalTexture.colorSpace=T.SRGBColorSpace;
  const materials = new Map<string, T.MeshStandardMaterial>();
  const mat = (color: string, glow = false) => {
    const key = color + glow;
    if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, map:glow?null:metalTexture, roughness: .36, metalness: glow ? .15 : .45, emissive: glow ? color : '#000000', emissiveIntensity: glow ? 1.5 : 0 }));
    return materials.get(key)!;
  };
  const mesh = (parent: T.Object3D, type: keyof typeof geos, color: string, pos: number[], scale: number[], glow = false) => {
    const m = new T.Mesh(geos[type], mat(color, glow)); m.position.set(pos[0], pos[1], pos[2]); m.scale.set(scale[0], scale[1], scale[2]); parent.add(m); return m;
  };
  const box = (p: T.Object3D, c: string, xyz: number[], size: number[], glow = false) => mesh(p, 'box', c, xyz, size, glow);
  const sphere = (p: T.Object3D, c: string, xyz: number[], size: number[]) => mesh(p, 'sphere', c, xyz, size);
  const rounded = (p: T.Object3D, c: string, xyz: number[], size: number[], glow = false) => mesh(p, 'rounded', c, xyz, size, glow);
  const textures: T.Texture[] = [], labels: T.Object3D[] = [];
  textures.push(metalTexture);
  let currentTheme='DIRECCIÓN';
  const dashboardMaterials=new Map<string,T.MeshStandardMaterial>();
  const panelGeometry=new T.PlaneGeometry(1,1);
  function dashboard(theme:string){
    if(dashboardMaterials.has(theme))return dashboardMaterials.get(theme)!;
    const c=document.createElement('canvas');c.width=768;c.height=384;const ctx=c.getContext('2d')!;
    ctx.fillStyle='rgba(96,50,155,.32)';ctx.fillRect(0,0,768,384);
    ctx.strokeStyle='#d9baff';ctx.lineWidth=3;ctx.strokeRect(5,5,758,374);
    ctx.fillStyle='#f0dfff';ctx.font='bold 23px system-ui';ctx.fillText(theme.toUpperCase(),25,42,715);
    ctx.font='16px monospace';ctx.fillText('AUMENTA2 / LIVE WORKSPACE',25,365);
    const legal=theme.includes('Legal'),people=/Humanos|Dirección/.test(theme),flow=/Orquest|Soporte|Apify|Composio|LLM/.test(theme);
    if(legal){ctx.beginPath();ctx.moveTo(150,90);ctx.lineTo(150,290);ctx.moveTo(65,125);ctx.lineTo(235,125);ctx.moveTo(100,290);ctx.lineTo(200,290);ctx.stroke();for(const x of [75,225]){ctx.beginPath();ctx.moveTo(x,125);ctx.lineTo(x-35,225);ctx.lineTo(x+35,225);ctx.closePath();ctx.stroke();}}
    else if(people){for(let i=0;i<3;i++){const x=75+i*80;ctx.beginPath();ctx.arc(x,155,23,0,7);ctx.stroke();ctx.strokeRect(x-27,190,54,80);}}
    else if(flow){for(let i=0;i<5;i++){const x=65+(i%3)*85,y=130+Math.floor(i/3)*100;ctx.strokeRect(x,y,55,45);ctx.beginPath();ctx.moveTo(x+55,y+20);ctx.lineTo(280,220);ctx.stroke();}}
    else if(/Ciberseguridad/.test(theme)){ctx.beginPath();ctx.moveTo(150,90);ctx.lineTo(250,130);ctx.lineTo(235,240);ctx.quadraticCurveTo(200,285,150,315);ctx.quadraticCurveTo(90,280,65,240);ctx.lineTo(50,130);ctx.closePath();ctx.stroke();ctx.strokeRect(117,180,66,65);ctx.beginPath();ctx.arc(150,180,24,Math.PI,Math.PI*2);ctx.stroke();}
    else if(/Calidad/.test(theme)){ctx.strokeRect(55,85,230,240);for(let i=0;i<4;i++){ctx.strokeRect(80,115+i*48,25,25);ctx.beginPath();ctx.moveTo(83,128+i*48);ctx.lineTo(91,136+i*48);ctx.lineTo(108,111+i*48);ctx.stroke();ctx.fillRect(130,125+i*48,115,4);}}
    else if(/Licitaciones/.test(theme)){ctx.beginPath();ctx.moveTo(40,150);ctx.lineTo(160,85);ctx.lineTo(280,150);ctx.closePath();ctx.stroke();for(let i=0;i<4;i++)ctx.strokeRect(65+i*56,165,22,120);ctx.strokeRect(40,300,240,15);}
    else if(/Administrativo/.test(theme)){ctx.strokeRect(50,110,235,205);ctx.strokeRect(50,110,235,40);for(let i=0;i<3;i++)for(let j=0;j<4;j++)ctx.strokeRect(70+j*53,175+i*40,30,23);}
    else if(/Mercadeo/.test(theme)){ctx.beginPath();ctx.moveTo(65,170);ctx.lineTo(220,110);ctx.lineTo(220,255);ctx.lineTo(65,215);ctx.closePath();ctx.stroke();ctx.strokeRect(100,220,30,75);for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(225,180,35+i*20,-.7,.7);ctx.stroke();}}
    else if(/Ventas/.test(theme)){ctx.beginPath();ctx.moveTo(40,110);ctx.lineTo(290,110);ctx.lineTo(195,220);ctx.lineTo(195,290);ctx.lineTo(140,315);ctx.lineTo(140,220);ctx.closePath();ctx.stroke();}
    else if(/I\+D/.test(theme)){ctx.beginPath();ctx.arc(160,165,70,0,Math.PI*2);ctx.stroke();ctx.strokeRect(130,240,60,40);for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(160+Math.cos(a)*90,165+Math.sin(a)*90);ctx.lineTo(160+Math.cos(a)*110,165+Math.sin(a)*110);ctx.stroke();}}
    else{ctx.font='bold 110px system-ui';ctx.fillText('$',90,210);for(let i=0;i<4;i++)ctx.strokeRect(45+i*58,290-i*14,35,20+i*14);}
    for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#d1adf4':'#a982dc';ctx.fillRect(340,95+i*32,170+(i*47)%200,5);}
    ctx.beginPath();for(let i=0;i<10;i++){const x=340+i*39,y=290-Math.sin(i*.8)*28-i*5;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);
    const m=new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#bca1eb',emissiveIntensity:.6,transparent:true,opacity:.78,depthWrite:false,roughness:.2,metalness:.1,side:T.DoubleSide});dashboardMaterials.set(theme,m);return m;
  }
  function display(x:number,y:number,z:number,w:number,h:number){const base=dashboard(currentTheme),material=base.clone(),map=base.map!.clone();const ratio=w/h;map.repeat.set(Math.max(1,ratio/2),Math.max(1,2/ratio));map.offset.set((1-map.repeat.x)/2,(1-map.repeat.y)/2);material.map=map;material.emissiveMap=map;textures.push(map);const m=new T.Mesh(panelGeometry,material);m.position.set(x,y,z);m.scale.set(w,h,1);staticRoot.add(m);return m;}
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=64;shadowCanvas.height=64;
  const shadowContext=shadowCanvas.getContext('2d')!, gradient=shadowContext.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(29,24,48,.35)');gradient.addColorStop(1,'rgba(29,24,48,0)');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,64,64);
  const shadowTexture=new T.CanvasTexture(shadowCanvas);textures.push(shadowTexture);
  const shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
  function contactShadow(x:number,z:number,w:number,d:number){const m=new T.Mesh(panelGeometry,shadowMaterial);m.position.set(x,.285,z);m.rotation.x=-Math.PI/2;m.scale.set(w,d,1);staticRoot.add(m);}
  function label(text: string, x: number, y: number, z: number, width: number, color = '#ede9ff') {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 96;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#65329a'; ctx.fillRect(0, 0, 768, 96); ctx.fillStyle = color;
    ctx.font = `600 ${Math.min(34,Math.floor(1250/Math.max(text.length,1)))}px system-ui`;  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 384, 48);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; textures.push(texture);
    const m = new T.Mesh(new T.PlaneGeometry(width, width / 8), new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide }));
    m.position.set(x, y, z); m.rotation.x = -Math.PI / 2; scene.add(m); labels.push(m); return m;
  }
  // Circular pressure hull, radial walkways and panoramic perimeter glazing.
  const hull=new T.Mesh(new T.CylinderGeometry(shipRadius,shipRadius-1,1.6,96),mat('#818395'));hull.position.y=-.8;staticRoot.add(hull);
  const floor=new T.Mesh(new T.CylinderGeometry(shipRadius-.4,shipRadius-.4,.22,96),mat('#dedbe6'));floor.position.y=.1;staticRoot.add(floor);
  const glassMaterial=new T.MeshStandardMaterial({color:'#c8b4ef',transparent:true,opacity:.15,roughness:.15,metalness:.3,side:T.DoubleSide,depthWrite:false});
  function rail(radius:number,y:number,color:string,width=.055){const r=new T.Mesh(new T.TorusGeometry(radius,width,6,96),mat(color,true));r.rotation.x=Math.PI/2;r.position.y=y;staticRoot.add(r);}
  for(const r of [25,shipRadius-1.2])rail(r,.27,'#bb7cff');
  for(let i=0;i<32;i++){
    const angle=i*Math.PI/16,x=(shipRadius-1)*Math.sin(angle),z=(shipRadius-1)*Math.cos(angle);
    const frame=rounded(staticRoot,'#c5c1d1',[x,1.5,z],[.4,3,.6]);frame.rotation.y=angle;
    const pane=new T.Mesh(new T.PlaneGeometry(7.4*scale,2.6),glassMaterial);pane.position.set(x,1.6,z);pane.rotation.y=angle;staticRoot.add(pane);
    const armor=rounded(staticRoot,'#b8b5c5',[x,-.6,z],[7.2*scale,1.5,.55]);armor.rotation.y=angle;
    const light=box(staticRoot,'#ae63f1',[x,2.95,z],[7.2*scale,.07,.14],true);light.rotation.y=angle;
    const vent=box(staticRoot,'#62596f',[x,-.6,z],[4.8,.5,.62]);vent.rotation.y=angle;
  }
  for(let i=0;i<8;i++){const angle=(i+.5)*Math.PI/4;const path=box(staticRoot,'#a99bbd',[Math.sin(angle)*29,.23,Math.cos(angle)*29],[.08,.025,32],true);path.rotation.y=angle;}
  const dome=new T.Group();scene.add(dome);dome.visible=false;
  const cap=new T.Mesh(new T.SphereGeometry(shipRadius-.5,48,20,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:'#b2a8cd',metalness:.65,roughness:.27,transparent:true,opacity:.78,side:T.DoubleSide}));cap.scale.y=.48;cap.position.y=3;dome.add(cap);
  for(let i=0;i<12;i++){const curve=new T.EllipseCurve(0,0,shipRadius-.4,shipRadius*.47,0,Math.PI/2,false,0);const pts=curve.getPoints(24).map(p=>new T.Vector3(p.x,p.y+3,0));const rib=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:'#e2bbff'}));rib.rotation.y=i*Math.PI/6;dome.add(rib);}
  renderer.domElement.dataset.dome='open';
  const actors: Actor[] = [], proxies: T.Mesh[] = [];
  const crewLabels: T.Sprite[]=[];
  function crewLabel(id:string,x:number,z:number){
    const c=document.createElement('canvas');c.width=512;c.height=80;
    const ctx=c.getContext('2d')!;
    ctx.fillStyle='#fffaff';ctx.beginPath();ctx.roundRect(2,2,508,76,38);ctx.fill();
    ctx.fillStyle='#8544bf';ctx.beginPath();ctx.arc(30,40,7,0,Math.PI*2);ctx.fill();
    const person=initial.find(a=>a.id===id);
    const provider=providers.find(p=>'provider-'+p.id===id);
    const name=tenantMode?person?.name||id:councilMember(id)?.name||(provider?provider.name:id==='hittan'?'Hittan · Dirección':id==='pulpo'?'Donna · Coordinación':person?.leaderId?person.name:'Dirección · '+(person?.name||id));
    ctx.fillStyle='#342047';ctx.font='600 25px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';if(person?.role){ctx.font='600 22px system-ui';ctx.fillText(name,270,27,438);ctx.font='18px system-ui';ctx.fillText(person.role,270,56,438);}else ctx.fillText(name,270,40,438);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);
    const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true,depthWrite:false,toneMapped:false}));
    sprite.position.set(x,person?.leaderId?3.05:4.25,z);sprite.scale.set(3.5,.55,1);sprite.userData.id=id;sprite.userData.leader=!person?.leaderId;scene.add(sprite);crewLabels.push(sprite);
  }
  function plant(x: number, z: number) {
    mesh(staticRoot, 'cylinder', '#f2edf9', [x, .45, z], [.4, .8, .4]);
    mesh(staticRoot, 'cylinder', '#665b69', [x, 1, z], [.06, .8, .06]);
    for (let i = 0; i < 14; i++) { const a = i * 2.4; const leaf = sphere(staticRoot, '#476c40', [x + Math.cos(a) * .35, 1.25 + i * .045, z + Math.sin(a) * .35], [.09, .54, .035]); leaf.rotation.set(Math.sin(a)*.8, a, Math.cos(a)*.85); }
  }
  function desk(x: number, z: number, color: string, lead = false) {
    const start=staticRoot.children.length, labelStart=labels.length;
    const width=lead ? 5.2 : 2.7;
    if(lead){
      // Executive U: two returns, storage plinths, dark worktop and gold perimeter.
      for(const side of [-1,1]){
        rounded(staticRoot,'#40334f',[x+side*2.25,1.17,z-.05],[.85,.2,2.8]);
        rounded(staticRoot,'#d4c0e4',[x+side*2.25,.66,z-.55],[.7,1,.95]);
        box(staticRoot,'#d7b36a',[x+side*2.65,1.27,z-.05],[.035,.04,2.7],true);
        for(let drawer=0;drawer<3;drawer++)box(staticRoot,'#8c719e',[x+side*2.25,.38+drawer*.25,z-.05],[.5,.025,.025]);
      }
      rounded(staticRoot,'#463650',[x,1.3,z+.8],[5.02,.055,1.2]);

      const sign=label('DIRECCIÓN DE ÁREA',x,.83,z+1.5,2.8);sign.rotation.x=0;
    }
    contactShadow(x,z+.5,width+1.3,3.6);
    rounded(staticRoot, '#8c92a5', [x, 1.13, z + .8], [width, .17, 1.35]);
    rounded(staticRoot, '#f3f1f8', [x, 1.24, z + .8], [width-.12, .065, 1.23]);
    for(const side of [-1,1]){
      rounded(staticRoot, '#c5c8d4', [x+side*(width/2-.2), .68, z + .8], [.15, 1.05, .9]);
      rounded(staticRoot, '#65687b', [x+side*(width/2-.2), .22, z + .8], [.32, .12, 1.05]);
    }
    box(staticRoot, '#b366ff', [x, 1.18, z + 1.48], [width-.12, .035, .025], true);
    box(staticRoot, '#2e364e', [x, 1.22, z + .7], [1.05, .04, .35]);
    for (let k = 0; k < 5; k++) box(staticRoot, '#9ecade', [x - .4 + k * .2, 1.25, z + .7], [.12, .015, .2]);
    if(!lead){rounded(staticRoot, '#f4f1f8', [x, .99, z-.1], [.64,.13,.65]);
    rounded(staticRoot, '#dcdde7', [x, 1.40, z-.43], [.66,.86,.10]);
    rounded(staticRoot, '#655970', [x, 1.43, z-.37], [.49,.64,.065]);
    mesh(staticRoot, 'cylinder', '#858a9c', [x,.61,z-.1],[.065,.67,.065]);
    for(const side of [-1,1]){box(staticRoot,'#999daf',[x+side*.32,1.19,z-.02],[.08,.07,.45]);box(staticRoot,'#7f8495',[x,.31,z-.1],[.75,.055,.075]);}
    }
    // Floating violet hologram: no opaque blue backing.
    const panel=display(x,1.87,z+1.061,1.64,.75);
    // Translucent side screens and offset steel frames retain the holographic workstation language.
    const sideDisplay=display(x+.93,1.79,z+.94,.36,.58);sideDisplay.rotation.y=-.24;
    if(lead){for(const o of staticRoot.children.slice(start))o.position.y+=.65;for(const o of labels.slice(labelStart))o.position.y+=.65;rounded(staticRoot,'#b4a4cd',[x,.38,z],[6,.35,3.6]);}
    return panel;
  }
  function character(id: string, x: number, z: number, color: string, variant: number, screen: T.Mesh, owner = false, donna = false, standing = false) {
    const root = new T.Group(); root.position.set(x, .18, z); actorRoot.add(root);
    const skin = owner ? '#d6a080' : ['#d7aa8b', '#a96c4e', '#e8bd9a', '#8e614a'][variant % 4];
    const hair = donna ? '#b94baa' : owner ? '#483024' : ['#3f2d2c', '#564233', '#a56b47', '#29262e'][variant % 4];
    const uniform = owner ? '#2b2e3b' : '#f4effb';
    // Adult anatomical proportions: small cranium, defined jaw, tailored torso and seated legs.
    // Every part is volume geometry, so silhouettes remain correct from every camera angle.
    mesh(root, 'torso', uniform, [0, .91, -.10], [1, 1, 1]);
    rounded(root, owner ? '#f2f0ed' : '#d0c5df', [0, 1.64, .04], [.13, .25, .045]);
    box(root, owner ? '#7d4da2' : '#a996b8', [0, 1.35, .065], [.018, .61, .02]);
    for (const side of [-1,1]) {
      const lapel = rounded(root, owner ? '#37323c' : '#7c4ca2', [side*.145,1.62,.075],[.11,.32,.035]); lapel.rotation.z=side*.32;
      rounded(root, '#524359', [side*.20,1.1,.04],[.08,.2,.035]);
    }
    rounded(root, '#ac85cf', [.19, 1.49, .087], [.10, .055, .018]);
    mesh(root, 'cylinder', skin, [0, 1.84, -.10], [.075, .18, .075]);
    const head = new T.Group(); head.position.set(0, 2.065, -.10); root.add(head);
    const face = sphere(head, skin, [0,.015,0], [.135,.194,.137]);
    // Skin is matte, unlike the brushed alloy and fabric equipment.
    const skinMat = mat(skin); skinMat.metalness=0; skinMat.roughness=.7;
    sphere(head, skin, [0,-.10,.025],[.107,.102,.106]);
    sphere(head, hair, [0,.14,-.035],[.143,.092,.137]);
    sphere(head, hair, [0,.045,-.108],[.132,.14,.055]);
    if (owner || donna) for(let i=0;i<7;i++) {
      const tuft=sphere(head,hair,[-.10+i*.033,.205+Math.sin(i)*.012,-.025],[.034,.065,.065]); tuft.rotation.z=-.45;
    }
    if (!owner && !donna && variant%2===0) {
      for(const side of [-1,1]) sphere(head,hair,[side*.125,-.06,-.065],[.042,.20,.087]);
      sphere(head,hair,[0,-.16,-.13],[.13,.16,.07]);
    }
    if(owner) {
      sphere(head,hair,[0,-.116,.056],[.108,.076,.082]);
      sphere(head,skin,[0,-.085,.113],[.079,.039,.027]);
      sphere(head,hair,[0,-.064,.132],[.066,.013,.014]);
    }
    for (const side of [-1,1]) {
      sphere(head,skin,[side*.136,-.025,0],[.025,.047,.021]);
      sphere(head,'#e1d9d2',[side*.052,.031,.124],[.027,.010,.009]);
      sphere(head,owner||donna ? '#608075' : '#443e3a',[side*.052,.031,.132],[.008,.009,.004]);
      const brow=box(head,hair,[side*.052,.057,.124],[.049,.009,.009]); brow.rotation.z=side*-.08;
      sphere(head,skin,[side*.067,-.028,.105],[.047,.045,.034]);
    }
    sphere(head,skin,[0,-.005,.128],[.021,.047,.024]);
    sphere(head,skin,[0,-.035,.148],[.026,.018,.024]);
    box(head,'#a26c66',[0,-.091,.128],[.052,.007,.009]);
    if(donna) { sphere(head,'#dedce7',[-.151,0,-.01],[.022,.064,.052]); const mic=box(head,'#797387',[-.102,-.09,.093],[.015,.013,.17]); mic.rotation.y=-.42; }
    const arms: T.Group[]=[];
    for(const side of [-1,1]) {
      const arm=new T.Group(); arm.position.set(side*.31,1.64,-.10); root.add(arm); arms.push(arm);
      const sleeve=mesh(arm,'cylinder',uniform,[side*.015,-.19,.015],[.095,.40,.095]); sleeve.rotation.z=side*.1;
      rounded(arm,owner ? '#323039' : '#76528f',[side*.026,-.035,.015],[.13,.105,.16]);
      sphere(arm,uniform,[side*.033,-.39,.04],[.077,.085,.075]);
      const forearm=mesh(arm,'cylinder',uniform,[side*.018,-.43,.275],[.064,.43,.064]);forearm.rotation.x=-1.40;
      rounded(arm,'#61536e',[side*.015,-.465,.46],[.12,.08,.075]);
      sphere(arm,skin,[side*.01,-.475,.53],[.058,.033,.105]);
      for(let finger=0;finger<4;finger++) sphere(arm,skin,[side*.01-.037+finger*.024,-.48,.611],[.011,.018,.048]);
      // Bent thighs and knees meet the chair; lower legs rest on the deck.
      const thigh=mesh(root,'cylinder',uniform,[side*.145,.87,.14],[.125,.54,.125]);thigh.rotation.x=Math.PI/2;
      sphere(root,uniform,[side*.145,.84,.40],[.12,.12,.12]);
      mesh(root,'cylinder',uniform,[side*.145,.49,.42],[.09,.67,.09]);
      rounded(root,owner ? '#25252c' : '#d9d5df',[side*.145,.14,.49],[.19,.18,.35]);
      box(root,'#544c60',[side*.145,.055,.49],[.19,.035,.35]);
    }
    const status=sphere(root,'#ffffff',[0,2.54,0],[.05,.05,.05]);
    root.position.y=standing?.56:.18;
    const actor:Actor = { id, root, head, arms, status, screen, phase: actors.length * .7, standing,baseY:root.position.y }; actors.push(actor);
    crewLabel(id,x,z);
    const proxy = new T.Mesh(new T.BoxGeometry(1.2, 2.8, 1.15), new T.MeshBasicMaterial());
    proxy.position.set(x, 1.5, z); proxy.userData.id = id; proxy.updateMatrixWorld(); proxies.push(proxy);
    return actor;
  }
  for (const [d, area] of departments.entries()) {
    const members=initial.filter(a=>a.leaderId===area.id).sort((a,b)=>(a.seat||0)-(b.seat||0));
    const depth=Math.max(0,Math.ceil(members.length/3)-2)*3.4;
    const dept={...area,x:0,z:0};currentTheme=dept.name;
    const statStart=staticRoot.children.length,sceneStart=scene.children.length,actorStart=actors.length,proxyStart=proxies.length;

    box(staticRoot, '#edeaf5', [dept.x, .18, dept.z-depth/2], [16.2, .18, 12.5+depth]);
    rounded(staticRoot,'#c3c4d0',[dept.x,2,dept.z-6.1-depth],[16.1,3.8,.32]);
    rounded(staticRoot,'#e5e4eb',[dept.x,2.2,dept.z-5.9-depth],[15.6,3.2,.12]);
    for(const side of [-1,1]){
      rounded(staticRoot,'#989cac',[dept.x+side*7.6,2.3,dept.z-5.7-depth],[.3,4.25,.5]);
      box(staticRoot,'#b570ff',[dept.x+side*7.39,2.3,dept.z-5.42-depth],[.045,4.1,.025],true);
      rounded(staticRoot,'#585369',[dept.x+side*6.1,1.68,dept.z-5.62-depth],[1.2,2.7,.5]);
      for(let shelf=0;shelf<5;shelf++){
        box(staticRoot,'#bac0d3',[dept.x+side*6.1,.6+shelf*.47,dept.z-5.31-depth],[1,.055,.05]);
        for(let book=0;book<5;book++) box(staticRoot,book%2 ? '#9682ba' : '#cad1ea',[dept.x+side*6.1-.38+book*.18,.8+shelf*.47,dept.z-5.32-depth],[.09,.31,.14]);
      }
    }
    rounded(staticRoot,'#8e8b9f',[dept.x,4.16,dept.z-5.79-depth],[15.4,.19,.56]);
    box(staticRoot,'#b76aff',[dept.x,4.07,dept.z-5.49-depth],[15,.045,.035],true);
    rounded(staticRoot,'#49425e',[dept.x,3.64,dept.z-5.59-depth],[9.7,.73,.17]);
    const nameplate=label(dept.name.toUpperCase(),dept.x,3.65,dept.z-5.49-depth,9.2);nameplate.rotation.x=0;
    rounded(staticRoot,'#7f8caa',[dept.x,2.05,dept.z-5.6-depth],[8.9,2.03,.13]);
    display(dept.x,2.05,dept.z-5.51-depth,8.65,1.81);
    for(let tile=-7;tile<=7;tile+=2)box(staticRoot,'#d4d1dd',[dept.x+tile,.28,dept.z],[.018,.008,12.3]);
    for(let tile=-5;tile<=5;tile+=2)box(staticRoot,'#d4d1dd',[dept.x,.28,dept.z+tile],[15.9,.008,.018]);
    for(const side of [-1,1]){rounded(staticRoot,'#a4a7b5',[dept.x+side*8,.3,dept.z-depth/2],[.14,.15,12.5+depth]);box(staticRoot,'#bb79ff',[dept.x+side*7.9,.38,dept.z-depth/2],[.045,.035,12.4+depth],true);}
    box(staticRoot,'#b86eff',[dept.x,.34,dept.z+6.2],[16,.035,.05],true);
    const rampGeometry=new T.BufferGeometry();
    rampGeometry.setAttribute('position',new T.Float32BufferAttribute([-1,.27,1.35,1,.27,1.35,-1,.555,1.8,1,.27,1.35,1,.555,1.8,-1,.555,1.8],3));rampGeometry.computeVertexNormals();
    const ramp=new T.Mesh(rampGeometry,mat('#b4a4cd'));ramp.material.side=T.DoubleSide;ramp.receiveShadow=true;staticRoot.add(ramp);
    const leadScreen = desk(dept.x, dept.z + 3.6, dept.color, true);
    character(dept.id, dept.x, dept.z + 3, dept.color, d, leadScreen,false,false,true);
    members.forEach((member,index)=>{
      const x=dept.x+(index%3-1)*4.6,z=dept.z-.9-Math.floor(index/3)*3.4;
      character(member.id,x,z,dept.color,d+index+1,desk(x,z,dept.color));
    });
    label(dept.name.toUpperCase(),0,.33,5.65,14);
    plant(dept.x - 6.5, dept.z - 3.5); plant(dept.x + 6.5, dept.z - 3.5);
    for (const x of [dept.x - 7.7, dept.x + 7.7]) box(staticRoot, '#c1bccf', [x, .6, dept.z + 1.3], [.12, .8, 8.9]);
    const matrix=new T.Matrix4().makeRotationY(-area.angle);matrix.setPosition(area.x,0,area.z);
    for(const o of staticRoot.children.slice(statStart))o.applyMatrix4(matrix);
    for(const o of scene.children.slice(sceneStart))o.applyMatrix4(matrix);
    for(const actor of actors.slice(actorStart))actor.root.applyMatrix4(matrix);
    for(const proxy of proxies.slice(proxyStart)){proxy.applyMatrix4(matrix);proxy.updateMatrixWorld(true);}

  }
  function totem(x:number,z:number,color:string,baseY=0){
    mesh(staticRoot,'cylinder','#9d8daa',[x,baseY+.35,z+1.6],[.62,.55,.62]);
    rounded(staticRoot,'#bfb6cf',[x,baseY+1.25,z+1.6],[.32,1.55,.35]);
    box(staticRoot,color,[x,baseY+1.4,z+1.82],[.09,1.35,.035],true);
    const center=display(x,baseY+2.65,z+1.5,2.8,1.4);
    for(const side of [-1,1]){const panel=display(x+side*2.35,baseY+2.65,z+1.05,2.4,1.2);panel.rotation.y=side*.35;}
    return center;
  }
  currentTheme='Dirección';
  for(const [radius,y,height,color] of [[9.2,.65,1.3,'#857292'],[8.7,1.45,.3,'#e2dce9'],[8.2,1.85,.5,'#c5b4d6']] as const){const deck=new T.Mesh(new T.CylinderGeometry(radius,radius,height,12),mat(color));deck.position.y=y;staticRoot.add(deck);}
  const sign=label('DIRECCIÓN',0,5.8,-5.3,10);sign.rotation.x=0;
  const beltCanvas=document.createElement('canvas');beltCanvas.width=1024;beltCanvas.height=128;
  const beltContext=beltCanvas.getContext('2d')!;beltContext.fillStyle='#4a217e';beltContext.fillRect(0,0,1024,128);
  beltContext.font='600 64px Arial';beltContext.fillStyle='#ffffff';beltContext.textAlign='center';beltContext.textBaseline='middle';beltContext.fillText('CENTRO DE MANDO  ·',512,64);
  const beltTexture=new T.CanvasTexture(beltCanvas);beltTexture.colorSpace=T.SRGBColorSpace;beltTexture.wrapS=T.RepeatWrapping;beltTexture.repeat.x=8;textures.push(beltTexture);
  const belt=new T.Mesh(new T.CylinderGeometry(9.23,9.23,.65,96,1,true),new T.MeshBasicMaterial({map:beltTexture}));belt.position.y=.85;scene.add(belt);
  if(!tenantMode){for(const [id,x,owner] of [['hittan',-3.6,true],['pulpo',3.6,false]] as const){const panel=totem(x,-1,'#aa6ada',2.1);const a=character(id,x,-1,'#9252bd',0,panel,owner,!owner,true);a.root.position.y=2.1;a.baseY=2.1;const proxy=proxies.at(-1)!;proxy.position.y=3.5;proxy.updateMatrixWorld(true);crewLabels.at(-1)!.position.y=5.3;}
  label('HITTAN',-3.6,2.13,2.3,4);label('DONNA',3.6,2.13,2.3,4);
  for(const [i,p] of providers.entries()){
    const {angle,x,z}=providerPlacement(i,providers.length);
    currentTheme=p.kind==='llm'?'LLMs / '+p.name:'Orquestadores / '+p.name;
    const start=staticRoot.children.length,sceneStart=scene.children.length;
    const panel=totem(0,0,p.color);
    const a=character('provider-'+p.id,0,0,p.color,i,panel,false,false,true);a.root.position.y=.24;a.baseY=.24;
    const floorSign=label(p.name.toUpperCase(),0,.29,-1.6,5.4);
    const matrix=new T.Matrix4().makeRotationY(-angle);matrix.setPosition(x,0,z);
    for(const o of staticRoot.children.slice(start))o.applyMatrix4(matrix);
    for(const o of scene.children.slice(sceneStart))o.applyMatrix4(matrix);
    a.root.applyMatrix4(matrix);const proxy=proxies.at(-1)!;proxy.applyMatrix4(matrix);proxy.updateMatrixWorld(true);
  }
  currentTheme='Consejo';
  for(const [i,[x,z]] of councilSeats.entries()){
    const start=staticRoot.children.length;
    rounded(staticRoot,'#78608f',[0,.45,0],[2.2,.5,2]);rounded(staticRoot,'#ded7e7',[0,.85,0],[1.8,.35,1.65]);rounded(staticRoot,'#b9accd',[0,1.35,-.75],[2.1,1.3,.35]);for(const side of [-1,1])rounded(staticRoot,'#a496b8',[side,1,0],[.25,.8,1.85]);
    const yaw=Math.atan2(-x,-z),matrix=new T.Matrix4().makeRotationY(yaw);matrix.setPosition(x,0,z);
    for(const o of staticRoot.children.slice(start))o.applyMatrix4(matrix);
    const panel=new T.Mesh();const actor=character(councilMembers[i].id,x,z,'#7852a0',i,panel);
    actor.root.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),yaw);actor.root.position.add(new T.Vector3(0,0,.6).applyAxisAngle(new T.Vector3(0,1,0),yaw));actor.baseY=.18;const proxy=proxies.at(-1)!;proxy.position.x=actor.root.position.x;proxy.position.z=actor.root.position.z;proxy.updateMatrixWorld(true);
    const label=crewLabels.at(-1)!;label.position.y=3.4;label.userData.leader=true;
  }
  rounded(staticRoot,'#a89bb9',[0,.8,12],[7,.25,1.2]);for(const x of [-4,4])rounded(staticRoot,'#a89bb9',[x,.8,11],[1.1,.25,3]);label('EL CONSEJO · 6 PUESTOS',0,.3,16.5,10);
  label('ORQUESTADORES',-10,.3,10,9);label('LLMs / INTELIGENCIA ARTIFICIAL',0,.3,24,16);}
  // Deterministic stars and a low-poly planetary limb make the exterior genuinely 3D.
  const positions = new Float32Array(1800 * 3);
  let seed = 23; const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i=0;i<1800;i++){const y=random()*2-1,az=random()*Math.PI*2,r=150+random()*45,h=Math.sqrt(1-y*y);positions[i*3]=r*h*Math.cos(az);positions[i*3+1]=r*y;positions[i*3+2]=r*h*Math.sin(az);}
  const starGeometry = new T.BufferGeometry(); starGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const stars = new T.Points(starGeometry, new T.PointsMaterial({ color: '#cadbff', size: .3, sizeAttenuation: true })); scene.add(stars);
  const earthTexture=new T.TextureLoader().load('/models/earth.jpg');earthTexture.colorSpace=T.SRGBColorSpace;textures.push(earthTexture);
  const earth = new T.Mesh(new T.SphereGeometry(80, 64, 40), new T.MeshStandardMaterial({map:earthTexture,emissiveMap:earthTexture,emissive:'#ffffff',emissiveIntensity:.35,roughness:.9})); earth.position.set(0,-62,-100);earth.rotation.z=.3;scene.add(earth);

  // Batch all repeated geometry/material combinations, including articulated characters.
  type Batch = { instanced: T.InstancedMesh; sources: T.Mesh[] };
  function batch(root: T.Group): Batch[] {
    root.updateMatrixWorld(true); const buckets = new Map<string, T.Mesh[]>();
    root.traverse(obj => { if (obj instanceof T.Mesh) { const key = obj.geometry.uuid + (obj.material as T.Material).uuid; const list = buckets.get(key) || []; list.push(obj); buckets.set(key, list); } });
    return [...buckets.values()].map(sources => {
      const instanced = new T.InstancedMesh(sources[0].geometry, sources[0].material, sources.length);
      instanced.castShadow=true;instanced.receiveShadow=true;
      sources.forEach((source, i) => instanced.setMatrixAt(i, source.matrixWorld)); instanced.frustumCulled = false; scene.add(instanced); return { instanced, sources };
    });
  }
  const staticBatches = batch(staticRoot), dynamicBatches = batch(actorRoot);
  const ring = new T.Mesh(new T.RingGeometry(.7, .84, 32), new T.MeshBasicMaterial({ color: '#eac4ff', side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
  let agents = initial, active = '', disposed = false, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const detailed = new Map<string,ReturnType<typeof makeCrewModel>>();
  const hiddenMatrix=new T.Matrix4().makeScale(0,0,0);
  const attachModels=async(url:string,filter:(actor:Actor)=>boolean)=>{
    try {
      const source=await loadCrewModel(url);
      if(disposed){source.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{Object.values(m).forEach(v=>{if(v instanceof T.Texture)v.dispose();});m.dispose();});}});return;}
      for(const actor of actors.filter(filter)){
        const person=initial.find(a=>a.id===actor.id),area=departments.find(d=>d.id===(person?.leaderId||actor.id));
        const provider=providers.find(p=>'provider-'+p.id===actor.id);
        const model=makeCrewModel(source,!actor.standing,{index:actors.indexOf(actor),leader:actor.id==='hittan'||!!provider||!!area&&!person?.leaderId,color:tenantMode?(person as any)?.color||'#7839b0':actor.id==='hittan'?'#173e80':provider?.color||'#7839b0',original:!!councilMember(actor.id)||actor.id==='pulpo'||actor.id==='hittan',council:!!councilMember(actor.id),command:actor.id==='pulpo'||actor.id==='hittan',provider:provider?.kind==='llm'?provider.id:undefined});model.root.position.copy(actor.root.position);model.root.rotation.copy(actor.root.rotation);model.root.userData.appearance=actor.id;scene.add(model.root);detailed.set(actor.id,model);
        actor.root.traverse(o=>{if(o instanceof T.Mesh && o!==actor.status)o.userData.replaced=true;});
      }
      renderer.domElement.dataset.models=String(detailed.size);
      for(const batch of dynamicBatches) if(batch.sources.every(s=>s.userData.replaced)) batch.instanced.count=0;
      sun.shadow.needsUpdate=true;
    } catch { renderer.domElement.dataset.modelError='No se pudo cargar un modelo 3D'; }
  };
  for(const member of councilMembers)void attachModels(member.model,a=>a.id===member.id);
  void attachModels('/models/hittan.glb',a=>a.id==='hittan');
  void attachModels('/models/donna.glb',a=>a.id==='pulpo');
  const modelNames=['administrativo','legal','diseno','soporte','contabilidad','marketing'];
  function modelArea(id:string){
    const provider=providers.find(p=>'provider-'+p.id===id);if(provider)return provider.model;
    const person=initial.find(a=>a.id===id),area=departments.find(d=>d.id===(person?.leaderId||id));
    if(!area)return '';
    return crewAreaModel(person,area.model);
  }
  for(const name of modelNames)void attachModels(`/models/areas/${name}.glb`,a=>modelArea(a.id)===name);
  let last = 0, frames = 0, sampleStart = performance.now(), frameId = 0;
  const pointer = new T.Vector2(), ray = new T.Raycaster(); let down: { x: number; y: number } | null = null;
  const pointerdown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
  const pointerup = (e: PointerEvent) => {
    if (!down || e.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(pointer, camera); const hit = ray.intersectObjects(proxies, false)[0]; if (hit) select(hit.object.userData.id);
    down = null;
  };
  renderer.domElement.addEventListener('pointerdown', pointerdown); renderer.domElement.addEventListener('pointerup', pointerup);
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const keyboard = (e: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(e.key)) {
      e.preventDefault();
      if (e.key === '+' || e.key === '=' || e.key === '-') camera.position.sub(controls.target).multiplyScalar(e.key === '-' ? 1.12 : .89).add(controls.target);
      else { const delta = new T.Vector3(e.key === 'ArrowLeft' ? -2 : e.key === 'ArrowRight' ? 2 : 0, 0, e.key === 'ArrowUp' ? -2 : e.key === 'ArrowDown' ? 2 : 0); camera.position.add(delta); controls.target.add(delta); }
    }
  }; renderer.domElement.addEventListener('keydown', keyboard);
  const patrols=new Map(departments.map(area=>[area.id,{state:createPatrol(),area}]));
  let previousTime=0;
  function tick(now: number) {
    if (disposed) return; frameId = requestAnimationFrame(tick);
    if (document.hidden || now - last < 1000 / 40) return; last = now;
    const time = now / 1000,dt=previousTime?Math.min(.08,time-previousTime):0;previousTime=time;
    for (const actor of actors) {
      const a = agents.find(a => a.id === actor.id), working = a?.state === 'working', pending = (a?.pending || 0) > 0;
      actor.head.rotation.y = paused ? 0 : Math.sin(time * .65 + actor.phase) * .1;
      actor.arms.forEach((arm, i) => {
        arm.rotation.x = pending && i === 0 ? 2.5 : working ? -.35 + (paused ? 0 : Math.sin(time * 5 + actor.phase + i * 2) * .18) : -.05;
        arm.rotation.z = pending && i === 0 ? -.3 : (i ? -.08 : .08);
      });
      // Instance colors update independently; no scene rebuild when backend states change.
      actor.status.userData.color = pending ? '#efb54c' : working ? '#51dbcb' : a?.state === 'error' ? '#f2768e' : '#8ea3bb';
      actor.root.position.y = (actor.baseY||.18) + (paused ? 0 : Math.sin(time * 1.3 + actor.phase) * .012);
      const patrol=patrols.get(actor.id);let walking=0;const model=detailed.get(actor.id);
      if(patrol){
       if(!paused)walking=stepPatrol(patrol.state,dt,a?.state==='idle'&&!pending&&a?.enabled!==false);
       const local=new T.Vector3(patrol.state.x,patrolHeight(patrol.state.z),patrol.state.z).applyAxisAngle(new T.Vector3(0,1,0),-patrol.area.angle);
       actor.root.position.set(local.x+patrol.area.x,local.y,local.z+patrol.area.z);
       actor.root.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),patrol.state.yaw-patrol.area.angle);
       const proxy=proxies.find(p=>p.userData.id===actor.id);if(proxy){proxy.position.set(actor.root.position.x,actor.root.position.y+1.4,actor.root.position.z);proxy.updateMatrixWorld(true);}
       const label=crewLabels.find(l=>l.userData.id===actor.id);if(label)label.position.set(actor.root.position.x,actor.root.position.y+3.69,actor.root.position.z);
       if(active===actor.id&&ring.visible)ring.position.set(actor.root.position.x,actor.root.position.y+.02,actor.root.position.z);
      }
      if(model){model.root.position.copy(actor.root.position);model.root.quaternion.copy(actor.root.quaternion);model.animate(time,working,paused,actor.phase,pending,walking);}
    }
    actorRoot.updateMatrixWorld(true);
    for (const b of dynamicBatches) {
      if(!b.instanced.count)continue;
      b.sources.forEach((source, i) => { b.instanced.setMatrixAt(i, source.userData.replaced?hiddenMatrix:source.matrixWorld); if (source.userData.color) b.instanced.setColorAt(i, new T.Color(source.userData.color)); });
      b.instanced.instanceMatrix.needsUpdate = true; if (b.instanced.instanceColor) b.instanced.instanceColor.needsUpdate = true;
    }
    controls.update();
    for(const label of crewLabels){const distance=camera.position.distanceTo(label.position);label.visible=label.userData.leader||distance<26;const height=Math.min(.55,distance*.025);label.scale.set(height*6.36,height,1);}
    renderer.render(scene, camera); frames++;
    renderer.domElement.dataset.camera = camera.position.toArray().map(n => n.toFixed(2)).join(',');
    renderer.domElement.dataset.crew = String(actors.length);
    if (now - sampleStart > 2000) { report(Math.round(frames * 1000 / (now - sampleStart)), renderer.info.render.calls); frames = 0; sampleStart = now; }
  }
  frameId = requestAnimationFrame(tick);
  return {
    dome(closed:boolean){dome.visible=closed;renderer.domElement.dataset.dome=closed?'closed':'open';sun.shadow.needsUpdate=true;},
    update(next: Crew[]) { agents = next; },
    focusArea(id:string){const area=departments.find(d=>d.id===id);if(!area){const p=id==='consejo'?new T.Vector3(0,1,12):id==='orquestadores'?new T.Vector3(9,1,-14):new T.Vector3(0,1,0);controls.target.copy(p);camera.position.copy(p).add(new T.Vector3(8,27,35));controls.update();}if(area){controls.target.set(area.x,0,area.z);camera.position.set(area.x+7,16,area.z+20);controls.update();}},
    focus(id: string) {
      active = id; const actor = actors.find(a => a.id === active); const area = departments.find(d => d.id === id);
      const pos = actor?.root.position || (area ? new T.Vector3(area.x, 0, area.z) : new T.Vector3());
      controls.target.set(pos.x, pos.y+1.5, pos.z); const front=new T.Vector3(3.5,4.3,6.5).applyQuaternion(actor?.root.quaternion||new T.Quaternion());camera.position.copy(pos).add(front); controls.update();
      ring.visible = !!actor; ring.position.set(pos.x, .4, pos.z);
    },
    home() { controls.target.set(0, 0, 0); camera.position.set(8, 64*scale, 88*scale); ring.visible = false; controls.update(); },
    top() { controls.target.set(0, 0, 0); camera.position.set(.1, 74*scale, .1); ring.visible = false; controls.update(); },
    zoom(factor: number) { camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target); controls.update(); },
    pause(value: boolean) { paused = value; },
    quality(low: boolean) { renderer.setPixelRatio(low ? .8 : Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled=!low;sun.shadow.needsUpdate=true;resize(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerdown); renderer.domElement.removeEventListener('pointerup', pointerup); renderer.domElement.removeEventListener('keydown', keyboard);
      const geometries = new Set<T.BufferGeometry>(), mats = new Set<T.Material>();
      scene.traverse(obj => { if (obj instanceof T.Mesh || obj instanceof T.Points) { geometries.add(obj.geometry); (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => mats.add(m)); } });
      crewLabels.forEach(label=>label.material.dispose());
      proxies.forEach(p => { geometries.add(p.geometry); mats.add(p.material as T.Material); });
      [...staticBatches, ...dynamicBatches].forEach(b => b.instanced.dispose());
      geometries.forEach(g => g.dispose()); mats.forEach(m => {Object.values(m).forEach(v=>{if(v instanceof T.Texture)v.dispose();});m.dispose();}); textures.forEach(t => t.dispose());
      environmentMap.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}

