import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Canvas

const canvas = document.querySelector('#c');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);


const size = {
    width: window.innerWidth - 25,
    height: window.innerHeight - 25
};

const camera = new THREE.PerspectiveCamera(
    45,                      // Field of view (FOV)
    9 / 16, // Aspect ratio
    0.1,                     // Near plane
    1000                     // Far plane
);

// Set the position of the camera (adjust as needed)
camera.position.set(0, 10, 60);


const loader = new GLTFLoader();
let depthCamera;

loader.load('assets/scene.glb', function (gltf) {
    scene.add(gltf.scene);
    console.log(gltf);
    console.log(gltf.cameras);
    // Check if cameras exist in the glTF file
    if (gltf.cameras && gltf.cameras.length > 0) {
        const blenderCamera = gltf.cameras[0];

        // Create depthCamera only if blenderCamera is defined
        if (blenderCamera) {
            depthCamera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, blenderCamera.near, blenderCamera.far);
            depthCamera.position.copy(blenderCamera.position);
            depthCamera.rotation.copy(blenderCamera.rotation);
            depthCamera.projectionMatrix.copy(blenderCamera.projectionMatrix);

            console.log(depthCamera);

        } else {
            console.error('No camera data found in Blender camera.');
        }
    } else {
        console.error('No camera data found in glTF file.');
    }
});





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
    requestAnimationFrame(render);

    if (depthCamera) {
        renderer.setViewport(0, 0, 0.7 * window.innerWidth, window.innerHeight);
        renderer.setScissor(0, 0, 0.7 * window.innerWidth, window.innerHeight);
        renderer.setScissorTest(true);
        renderer.render(scene, depthCamera);
    }

    renderer.setViewport(0.7 * window.innerWidth, 0, 0.3 * window.innerWidth, window.innerHeight);
    renderer.setScissor(0.7 * window.innerWidth, 0, 0.3 * window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);


}

render();