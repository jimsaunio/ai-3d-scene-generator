import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import depthVertexShader from '../shaders/vertex.glsl?raw';
import depthFragmentShader from '../shaders/fragment.glsl?raw';

const canvas = document.querySelector('#c');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);





const size = {
    width: window.innerWidth - 100,
    height: window.innerHeight - 100,
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
let camera;
let planeWidth;
let planeHeight;


// Set the position of the camera (adjust as needed)



const imageTexture = new THREE.TextureLoader().load('../assets/test_img.png');
imageTexture.wrapT = THREE.RepeatWrapping;
imageTexture.wrapS = THREE.RepeatWrapping;
imageTexture.flipY = false;


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
            if (child.isMesh && child.geometry) {
                const textureMaterial = new THREE.MeshStandardMaterial({ map: imageTexture, side: THREE.DoubleSide, depthWrite: false });
                const mesh = new THREE.Mesh(child.geometry, textureMaterial);
                mesh.position.copy(child.position);
                mesh.rotation.copy(child.rotation);
                mesh.scale.copy(child.scale);
                mesh.wrapT = THREE.RepeatWrapping;
                mesh.wrapS = THREE.RepeatWrapping;
                mesh.flipY = false;
                mesh.uvsNeedUpdate = true;
                scene.add(mesh);


                // child.material = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });

            }
        });
        scene.add(gltf.scene);


        console.log(gltf)
        // Check if cameras exist in the glTF file
        if (gltf.cameras && gltf.cameras.length > 0) {
            const blenderCamera = gltf.cameras[0];
            if (blenderCamera) {
                depthCamera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                depthCamera.position.copy(blenderCamera.position);
                depthCamera.rotation.copy(blenderCamera.rotation);
                depthCamera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                depthCamera.updateMatrixWorld(true);

                camera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 10000);

                camera.rotation.copy(blenderCamera.rotation);
                camera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                camera.updateMatrixWorld(true);


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


                const geometry = new THREE.PlaneGeometry(1012, 704, 100, 100);
                const mesh = new THREE.Mesh(geometry, depthMaterial);
                mesh.rotation.copy(depthCamera.rotation);
                mesh.position.set(350, 350, 0);
                mesh.rotation.x = Math.PI / 2 * 3;
                mesh.scale.set(0.105, 0.105, 0.105);
                scene.add(mesh);
        
                camera.position.set(350, 495, 0);
                camera.lookAt(mesh.position);




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

    const newButton = document.createElement('button');
    newButton.innerText = 'Save Image';
    newButton.addEventListener('click', onClickSaveImage);
    document.body.appendChild(newButton);


    window.addEventListener('resize', onWindowResize);

}



// render scene 
const render = () => {
    requestAnimationFrame(render);

    const depthViewWidth = window.innerWidth;
    const depthHeight = window.innerHeight;


    if (depthCamera) {

        // Depth Camera View
        renderer.setViewport(0, 0, depthViewWidth, depthHeight);
        renderer.setRenderTarget(depthTarget);
        renderer.render(scene, depthCamera);
        // Update the depthMaterial with the depthTarget texture
        depthMaterial.uniforms.tDepth.value = depthTarget.depthTexture;


        // Render the depthTarget texture
        renderer.setRenderTarget(null);

        renderer.render(scene, depthCamera);


    }






};

const onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    depthCamera.aspect = width / height;
    depthCamera.updateProjectionMatrix();

    renderer.setSize(width, height);
}



const onClickSaveImage = () => {

    // Render the scene with the camera onto the offscreen renderer
    renderer.render(scene, camera);
    const imgData = renderer.domElement.toDataURL();
    const img = new Image();
    img.src = imgData;
    img.width = 2024 / 2;
    img.height = 1408 / 2;

    document.body.appendChild(img);

};

render();
init();