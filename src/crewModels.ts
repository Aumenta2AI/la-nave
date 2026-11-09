import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const badgeTextures=new Map<string,T.Texture>();
function badgeTexture(url:string){let texture=badgeTextures.get(url);if(!texture){texture=new T.TextureLoader().load(url);texture.colorSpace=T.SRGBColorSpace;badgeTextures.set(url,texture);}return texture;}

/** Shared geometry/textures; each person has an independent articulated skeleton. */
export async function loadCrewModel(url: string) {
  const gltf = await new GLTFLoader().loadAsync(url);
  return gltf.scene;
}
export type CrewLook={index:number;leader:boolean;color:string;original:boolean;command?:boolean;council?:boolean;provider?:string};
export function makeCrewModel(source: T.Group, seated: boolean, look?:CrewLook) {
  const root = clone(source) as T.Group;
  root.traverse(o => { if (o instanceof T.SkinnedMesh) { if(seated)o.skeleton.pose(); o.frustumCulled = false; o.castShadow=true;o.receiveShadow=true; } });
  root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(root), size = bounds.getSize(new T.Vector3());
  const wrapper = new T.Group(); wrapper.add(root);
  root.scale.multiplyScalar(2.7 / size.y); root.updateMatrixWorld(true);
  const bones = new Map<string,T.Bone>(); root.traverse(o => { if (o instanceof T.Bone) bones.set(o.name,o); });
  if(look&&!look.original){
    const n=look.index;
    const head=bones.get('Head');
    head?.scale.set(.96+(n%5)*.02,.97+(Math.floor(n/5)%4)*.02,.98+(n%3)*.02);
    const chest=bones.get('Spine');chest?.scale.set(.91+(n%4)*.06,1,1);
    root.traverse(o=>{if(o instanceof T.Mesh){
      const material=(o.material as T.MeshStandardMaterial).clone();o.material=material;
      o.geometry.computeBoundingBox();const box=o.geometry.boundingBox!;
      const suitTone=new T.Color(look.leader?look.color:'#ffffff');
      const hairTone=new T.Color(['#241913','#633923','#ac4929','#c9a46d','#33313b','#171314'][Math.floor(n/6)%6]);
      material.onBeforeCompile=shader=>{
        shader.uniforms.crewSkin={value:new T.Color(['#d8a27f','#a86c4e','#79513d'][Math.floor(n/6)%3])};shader.uniforms.crewSuit={value:suitTone};shader.uniforms.crewHair={value:hairTone};shader.uniforms.crewLeader={value:look.leader?1:0};
        shader.uniforms.crewY={value:new T.Vector2(box.min.y,box.max.y-box.min.y)};
        shader.vertexShader='varying float crewHeight;uniform vec2 crewY;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n crewHeight=(position.y-crewY.x)/crewY.y;');
        shader.fragmentShader='varying float crewHeight;uniform vec3 crewSkin;uniform vec3 crewSuit;uniform vec3 crewHair;uniform float crewLeader;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          vec3 c=diffuseColor.rgb;
          float lightness=dot(c,vec3(.2126,.7152,.0722));
          float warm=step(c.g*1.065,c.r)*step(c.b*1.09,c.g)*smoothstep(.025,.09,c.r-c.b);
          float skinMask=warm*smoothstep(.79,.83,crewHeight)*(1.0-smoothstep(.92,.98,crewHeight));diffuseColor.rgb=mix(diffuseColor.rgb,crewSkin*(.65+lightness),skinMask*.55);
          float neutral=1.0-smoothstep(.10,.50,max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b)));
          float cloth=neutral*smoothstep(.20,.60,lightness)*(1.0-smoothstep(.78,.83,crewHeight))*(1.0-warm*.8);
          float accent=(1.0-neutral)*(1.0-warm)*step(.15,crewHeight)*(1.0-smoothstep(.75,.82,crewHeight));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.32,.10,.57)*(.65+lightness),accent*(1.0-crewLeader));
          float hair=smoothstep(.90,.96,crewHeight)*(1.0-smoothstep(.12,.35,lightness));
          diffuseColor.rgb=mix(diffuseColor.rgb,crewHair*(.7+lightness),hair*.8);
          diffuseColor.rgb=mix(diffuseColor.rgb,crewSuit*(.5+lightness),cloth*mix(.92,.88,crewLeader));
        `);
      };
      material.customProgramCacheKey=()=> 'pulpo-crew-uniform-v4';
    }});
  }
  root.traverse(o=>{if(look?.council||!(o instanceof T.Mesh))return;
    const material=(o.material as T.MeshStandardMaterial).clone();
    const previous=(o.material as T.MeshStandardMaterial).onBeforeCompile;
    o.material=material;o.geometry.computeBoundingBox();const box=o.geometry.boundingBox!;
    const height=box.max.y-box.min.y;
    const brand=badgeTexture('/brands/aumenta2-isotipo.png');
    const provider=badgeTexture(look?.provider?'/brands/'+look.provider+'.svg':'/brands/aumenta2-isotipo.png');
    material.onBeforeCompile=(shader,renderer)=>{
      previous.call(material,shader,renderer);
      shader.uniforms.printMin={value:box.min};shader.uniforms.printHeight={value:height};
      shader.uniforms.printCenter={value:(box.max.x-box.min.x)/height/2};
      shader.uniforms.printDepth={value:(box.max.z-box.min.z)/height/2};
      shader.uniforms.brandPrint={value:brand};shader.uniforms.providerPrint={value:provider};shader.uniforms.hasProvider={value:look?.provider?1:0};
      shader.vertexShader='varying vec3 garmentPosition;varying vec3 garmentNormal;uniform vec3 printMin;uniform float printHeight;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n garmentPosition=(position-printMin)/printHeight;garmentNormal=normal;');
      shader.fragmentShader='varying vec3 garmentPosition;varying vec3 garmentNormal;uniform float printCenter;uniform float printDepth;uniform sampler2D brandPrint;uniform sampler2D providerPrint;uniform float hasProvider;\n'+shader.fragmentShader;
      // Bind-space coordinates deform with the garment; no decal geometry or floating planes.
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float front=step(printDepth,garmentPosition.z)*smoothstep(.15,.6,garmentNormal.z);
        float back=(1.0-step(printDepth,garmentPosition.z))*smoothstep(.15,.6,-garmentNormal.z);
        vec2 brandUV=(garmentPosition.xy-vec2(printCenter+.065,.755))/.065+.5;
        float brandMask=step(0.0,brandUV.x)*step(brandUV.x,1.0)*step(0.0,brandUV.y)*step(brandUV.y,1.0)*front;
        vec4 brandInk=texture2D(brandPrint,clamp(brandUV,0.0,1.0));
        diffuseColor.rgb=mix(diffuseColor.rgb,brandInk.rgb,brandInk.a*brandMask);
        vec2 providerUV=(garmentPosition.xy-vec2(printCenter,.685))/.145+.5;
        float providerMask=step(0.0,providerUV.x)*step(providerUV.x,1.0)*step(0.0,providerUV.y)*step(providerUV.y,1.0)*front;
        vec2 backUV=(garmentPosition.xy-vec2(printCenter,.72))/.19+.5;backUV.x=1.0-backUV.x;
        float backMask=step(0.0,backUV.x)*step(backUV.x,1.0)*step(0.0,backUV.y)*step(backUV.y,1.0)*back;
        vec4 frontInk=texture2D(providerPrint,clamp(providerUV,0.0,1.0)),backInk=texture2D(providerPrint,clamp(backUV,0.0,1.0));
        diffuseColor.rgb=mix(diffuseColor.rgb,frontInk.rgb,frontInk.a*providerMask*hasProvider);
        diffuseColor.rgb=mix(diffuseColor.rgb,backInk.rgb,backInk.a*backMask*hasProvider);
      `);
    };
    material.customProgramCacheKey=()=> 'pulpo-garment-print-v1-'+Number(look?.original);
    material.userData.garmentPrint=true;
  });
  function aim(name:string, childName:string, direction:T.Vector3) {
    const bone=bones.get(name), child=bones.get(childName); if(!bone || !child) return;
    root.updateMatrixWorld(true);
    const from=child.getWorldPosition(new T.Vector3()).sub(bone.getWorldPosition(new T.Vector3())).normalize();
    const world=bone.getWorldQuaternion(new T.Quaternion());
    world.premultiply(new T.Quaternion().setFromUnitVectors(from,direction.normalize()));
    bone.quaternion.copy(bone.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));
  }
  if(seated) for(const side of ['Left','Right']) {
    aim(side+'UpLeg',side+'Leg',new T.Vector3(side==='Left'?.12:-.12,-.12,1));
    aim(side+'Leg',side+'Foot',new T.Vector3(0,-1,.05));
    aim(side+'Arm',side+'ForeArm',new T.Vector3(side==='Left'?.18:-.18,-1,.3));
    aim(side+'ForeArm',side+'Hand',new T.Vector3(0,look?.council?-.7:-.1,1));
  }
  if(!seated) for(const side of ['Left','Right']) {
    aim(side+'UpLeg',side+'Leg',new T.Vector3(side==='Left'?.04:-.04,-1,0));
    aim(side+'Leg',side+'Foot',new T.Vector3(0,-1,.02));
    aim(side+'Arm',side+'ForeArm',new T.Vector3(side==='Left'?.15:-.15,-1,.15));
    aim(side+'ForeArm',side+'Hand',new T.Vector3(0,-.7,.5));
  }
  root.updateMatrixWorld(true);
  const hip=bones.get('Hips');
  root.position.y += seated && hip ? 1.05-hip.getWorldPosition(new T.Vector3()).y : -new T.Box3().setFromObject(root).min.y;
  wrapper.updateMatrixWorld(true);
  // Preserve glasses authored in the original model; generic overlays duplicated
  // frames and did not fit the different facial meshes.
  const names=['Head','Spine','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','Hips'];
  const rest=new Map(names.flatMap(name=>{const b=bones.get(name);return b?[[name,b.quaternion.clone()] as const]:[];}));
  aim('RightArm','RightForeArm',new T.Vector3(-.18,-.4,.85));aim('RightForeArm','RightHand',new T.Vector3(0,.35,1));
  const touch=new Map(['RightArm','RightForeArm'].flatMap(name=>{const b=bones.get(name);return b?[[name,b.quaternion.clone()] as const]:[];}));
  rest.forEach((q,name)=>bones.get(name)!.quaternion.copy(q));
  aim('RightArm','RightForeArm',new T.Vector3(-.2,1,.1));aim('RightForeArm','RightHand',new T.Vector3(0,1,0));
  const raised=new Map(['RightArm','RightForeArm'].flatMap(name=>{const b=bones.get(name);return b?[[name,b.quaternion.clone()] as const]:[];}));
  rest.forEach((q,name)=>bones.get(name)!.quaternion.copy(q));
  aim('LeftArm','LeftForeArm',new T.Vector3(.6,-.8,0));aim('LeftForeArm','LeftHand',new T.Vector3(-.55,.35,.15));const waist=new Map(['LeftArm','LeftForeArm'].flatMap(name=>{const b=bones.get(name);return b?[[name,b.quaternion.clone()] as const]:[];}));rest.forEach((q,name)=>bones.get(name)!.quaternion.copy(q));
  let lastTime:number|undefined,clock=0,raiseWeight=0;
  return {root:wrapper, animate(time:number, working:boolean, paused:boolean, phase:number, pending=false,walking=0) {
    const dt=lastTime===undefined?0:Math.min(.1,Math.max(0,time-lastTime));lastTime=time;if(paused)return;clock+=dt;
    const t=clock+phase;
    rest.forEach((q,name)=>bones.get(name)!.quaternion.copy(q));
    const head=bones.get('Head');head?.rotateY(Math.sin(t*.55)*.075);head?.rotateX(Math.sin(t*.8)*.025);
    bones.get('Spine')?.rotateZ(Math.sin(t*.6)*.009);
    if(!seated){bones.get('Hips')?.rotateZ(Math.sin(t*.65)*.012*(1-walking));for(const [i,side] of ['Left','Right'].entries()){const stride=Math.sin(t*5+i*Math.PI)*walking;bones.get(side+'UpLeg')?.rotateX(stride*.32);bones.get(side+'Leg')?.rotateX(Math.max(0,-stride)*.38);bones.get(side+'Arm')?.rotateX(-stride*.2);}}

    if(seated&&!look?.council){for(const [i,side] of ['Left','Right'].entries()){bones.get(side+'ForeArm')?.rotateX(Math.sin(t*3.3+i*1.8)*(working?.055:.025));bones.get(side+'Hand')?.rotateX(Math.sin(t*4+i)*.04);}}
    else if(!seated&&!look?.command&&!walking){const weight=(1-Math.cos(t*Math.PI/4))*.5;touch.forEach((q,name)=>bones.get(name)!.quaternion.slerp(q,weight));bones.get('RightHand')?.rotateX(Math.sin(t*2)*.035*weight);}
    else{bones.get('LeftForeArm')?.rotateX(Math.sin(t*.7)*.025);bones.get('RightForeArm')?.rotateX(Math.sin(t*.7+1)*.025);}
    if(!seated&&!working&&!walking&&!pending){const weight=(1-Math.cos(t*Math.PI/7))*.3;waist.forEach((q,name)=>bones.get(name)!.quaternion.slerp(q,weight));}
    raiseWeight+=(Number(pending)-raiseWeight)*(1-Math.exp(-dt*6));raised.forEach((q,name)=>bones.get(name)!.quaternion.slerp(q,raiseWeight));
  }};
}
