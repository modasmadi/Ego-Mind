import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(5,7,10);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10,20,10);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(0x404040));

const groundGeo = new THREE.PlaneGeometry(50,50);
const groundMat = new THREE.MeshStandardMaterial({color:0x55aa55});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

const playerGeo = new THREE.BoxGeometry(0.6,1,0.6);
const playerMat = new THREE.MeshStandardMaterial({color:0x3399ff});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.y = 0.5;
scene.add(player);

const buildGeo = new THREE.BoxGeometry(1,1,1);
const buildMat = new THREE.MeshStandardMaterial({color:0x8b5a2b});

window.addEventListener('click', ()=>{
  const cube = new THREE.Mesh(buildGeo, buildMat);
  cube.position.set(Math.round(player.position.x),0.5,Math.round(player.position.z));
  cube.castShadow = true;
  scene.add(cube);
});

const keys = {};
onkeydown = e => keys[e.key.toLowerCase()] = true;
onkeyup   = e => keys[e.key.toLowerCase()] = false;

function update(){
  if(keys['w']) player.position.z -= 0.1;
  if(keys['s']) player.position.z += 0.1;
  if(keys['a']) player.position.x -= 0.1;
  if(keys['d']) player.position.x += 0.1;

  camera.position.x = player.position.x + 5;
  camera.position.z = player.position.z + 10;
  camera.lookAt(player.position);
}

function animate(){
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}
animate();

onresize = ()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
};
