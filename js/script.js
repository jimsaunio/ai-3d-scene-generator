import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import depthVertexShader from '../shaders/vertex.glsl?raw';
import depthFragmentShader from '../shaders/fragment.glsl?raw';

const canvas = document.querySelector('#c');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);



const size = {
    width: window.innerWidth - 25,
    height: window.innerHeight - 25
};

const loader = new GLTFLoader();
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});

let depthCamera;
let depthTarget;
let depthMaterial;



// Camera in mobile size to see the rendered view of the scene
const camera = new THREE.PerspectiveCamera(
    45,
    9 / 16,
    0.1,
    1000
);

// Set the position of the camera (adjust as needed)
camera.position.set(0, 10, 400);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;




const createDepthTarget = () => {

    depthTarget = new THREE.WebGLRenderTarget(size.width, size.height);
    depthTarget.texture.format = THREE.RGBAFormat;
    depthTarget.texture.minFilter = THREE.NearestFilter;
    depthTarget.texture.magFilter = THREE.NearestFilter;
    depthTarget.texture.generateMipmaps = false;
    depthTarget.stencilBuffer = false;
    depthTarget.depthBuffer = true;
    depthTarget.depthTexture = new THREE.DepthTexture();
    depthTarget.depthTexture.format = THREE.DepthFormat;
    depthTarget.depthTexture.type = THREE.UnsignedShortType;
}


const setupDepthCamera = () => {
    loader.load('assets/scene.glb', function (gltf) {


        // Set the depthMaterial to all meshes in the scene
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
                child.material.metalness = 0;

            }
        });
        scene.add(gltf.scene);


        console.log(gltf);
        // Check if cameras exist in the glTF file
        if (gltf.cameras && gltf.cameras.length > 0) {
            const blenderCamera = gltf.cameras[0];
            // Create depthCamera only if blenderCamera is defined
            if (blenderCamera) {
                depthCamera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                depthCamera.position.copy(blenderCamera.position);
                depthCamera.rotation.copy(blenderCamera.rotation);
                depthCamera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                depthCamera.updateMatrixWorld();

                depthMaterial = new THREE.ShaderMaterial({
                    extensions: {
                        derivatives: '#extension GL_OES_standard_derivatives : enable',
                    },
                    side: THREE.DoubleSide,
                    uniforms: {
                        cameraNear: { value: depthCamera.near },
                        cameraFar: { value: depthCamera.far },
                        tDepth: { value: null },
                    },
                    vertexShader: depthVertexShader,
                    fragmentShader: depthFragmentShader,

                });


                // Create a plane to render the depthTarget texture

                const geometry = new THREE.PlaneGeometry(150, 100, 200, 100);
                const mesh = new THREE.Mesh(geometry, depthMaterial);

                mesh.position.set(0, 15, 100);

                

                scene.add(mesh);


            } else {
                console.error('No camera data found in Blender camera.');
            }
        } else {
            console.error('No camera data found in glTF file.');
        }
    });

}


const setupScene = () => {
    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.physicallyCorrectLights = true;
    renderer.setClearColor(0xf4f4f4, 1);

    // // Floor to the world
    // const planeGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    // const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f4f4, side: THREE.DoubleSide });
    // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = Math.PI / 2;
    // plane.position.y = 0;
    // scene.add(plane);



    const light = new THREE.AmbientLight(0xffffff, 1);
    light.position.set(0, 10, 0);

    scene.add(light);

    const light2 = new THREE.PointLight(0xffffff, 1);
    light2.position.set(0, 10, 25);

    scene.add(light2);


}


const init = () => {
    setupScene();
    setupDepthCamera();
    createDepthTarget();
    window.addEventListener('resize', onWindowResize);
}



// render scene 
const render = () => {
    requestAnimationFrame(render);

    const depthViewWidth = 0.7 * window.innerWidth;
    const depthViewGap = 10; // Adjust the gap as needed

    if (depthCamera) {

        // Depth Camera View
        renderer.setViewport(0, 0, depthViewWidth - depthViewGap, window.innerHeight);
        renderer.setScissor(0, 0, depthViewWidth - depthViewGap, window.innerHeight);
        renderer.setScissorTest(true);
        renderer.setRenderTarget(depthTarget);
        renderer.render(scene, depthCamera);

        // Update the depthMaterial with the depthTarget texture
        depthMaterial.uniforms.tDepth.value = depthTarget.depthTexture; // Set the depthTexture to the depthMaterial

    

        // Render the depthTarget texture
        renderer.setRenderTarget(null);
        renderer.render(scene, depthCamera);

    }

    

    // Regular Camera View
    renderer.setViewport(0.7 * window.innerWidth + depthViewGap, 0, 0.3 * window.innerWidth, window.innerHeight);
    renderer.setScissor(0.7 * window.innerWidth + depthViewGap, 0, 0.3 * window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);
};

const onWindowResize = () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;

    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();

    renderer.setSize(size.width, size.height);
}

render();
init();