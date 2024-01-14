import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Canvas

const canvas = document.querySelector('#c');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

const size = {
    width: window.innerWidth - 100,
    height: window.innerHeight - 100
};

const camera = new THREE.PerspectiveCamera(75, size.width / size.height, 0.1, 1000);
camera.position.z = 55;
camera.position.y = 40;

const loader = new GLTFLoader();

loader.load('assets/scene.glb', function (gltf) {
    gltf.scene.position.y = 50;
    gltf.scene.scale.set(2, 2, 2);
    scene.add(gltf.scene);
    console.log(gltf);
}
);

// position the loader on the scene

const depthCameraSize = { width: 1920, height: 1920 };

const depthCamera = new THREE.PerspectiveCamera(75, depthCameraSize.width / depthCameraSize.height, 0.1, 1000);

// Adjust position based on Blender values
depthCamera.position.x = 0; // Blender X
depthCamera.position.y = 65.6817; // Blender Y
depthCamera.position.z = 103.1674; // Blender Z

// Adjust rotation bas




const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f4f4, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2 - 50;
plane.position.y = -100;
scene.add(plane);




// Lights

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);




// render scene 

const render = () => {
    renderer.render(scene, depthCamera);
    requestAnimationFrame(render);
}

render();