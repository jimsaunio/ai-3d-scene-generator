import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import depthVertexShader from '../shaders/vertex.glsl?raw';
import depthFragmentShader from '../shaders/fragment.glsl?raw';

import ProjectedMaterial from 'three-projected-material'


const canvas = document.querySelector('#c');
const canvas2 = document.querySelector('#c2');

canvas2.style.display = 'none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);


const size = {
    width: window.innerWidth / 1.3,
    height: window.innerHeight / 1.3,
};

const loader = new GLTFLoader();
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});

const renderer2 = new THREE.WebGLRenderer({
    canvas: canvas2,

});


let depthCamera;
let depthTarget;
let depthMaterial;



// Camera in mobile size to see the rendered view of the scene
let camera;

const mobileViewCamera = new THREE.PerspectiveCamera(28.119373240232346, 1, 1, 1000);
mobileViewCamera.position.set(0, 12.167400360107422, 76.681701660156255);
mobileViewCamera.rotation.set(-0.2617993877991494, 0, 0);
const mobileWidth = size.width;
const mobileHeight = size.height;


renderer2.setViewport(0, 0, mobileWidth, mobileHeight);



const controls = new OrbitControls(mobileViewCamera, canvas2);
controls.enableDamping = true;
controls.enableZoom = true;
controls.enablePan = true;
controls.minDistance = 0.1;
controls.zoomSpeed = 0.1;



const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");


// Set the position of the camera (adjust as needed)

let imageTexture;
let textureImage = '../assets/test_img2.png';


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
    loader.load('assets/scene_export2.glb', function (gltf) {
        // Set the depthMaterial to all meshes in the scene

        scene.add(gltf.scene);

        console.log(gltf)
        // Check if cameras exist in the glTF file
        if (gltf.cameras && gltf.cameras.length > 0) {
            const blenderCamera = gltf.cameras[0];
            if (blenderCamera) {
                depthCamera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                depthCamera.position.copy(blenderCamera.position);
                depthCamera.scale.copy(blenderCamera.scale)
                depthCamera.rotation.copy(blenderCamera.rotation);
                depthCamera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                depthCamera.updateMatrixWorld(true);

                camera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                camera.rotation.copy(blenderCamera.rotation);
                camera.scale.copy(blenderCamera.scale)
                camera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                camera.colorDepth = 16;
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

                gltf.scene.traverse(function (child) {
                    if (child.isMesh && child.geometry) {

                        // const textureMaterial = new THREE.MeshStandardMaterial({ map: imageTexture, side: THREE.DoubleSide, depthTest: false, depthWrite: false, });
                        // const mesh = new THREE.Mesh(child.geometry, textureMaterial);
                        // mesh.position.copy(child.position);
                        // mesh.rotation.copy(child.rotation);
                        // mesh.scale.copy(child.scale);
                        // scene.add(mesh);

                        const textureMaterial = new ProjectedMaterial({
                            depthCamera,
                            map: imageTexture,
                            side: THREE.DoubleSide,
                            depthTest: false,
                            depthWrite: false,
                            textureScale: 0.8,
                            cover: true,
                            color: '#ffffff',
                            roughness: 0.3,
                            metalness: 0,
                        });
                        const mesh = new THREE.Mesh(child.geometry, textureMaterial);
                        mesh.position.copy(child.position);
                        mesh.rotation.copy(child.rotation);
                        mesh.scale.copy(child.scale);

                        scene.add(mesh);

                        textureMaterial.project(mesh);


                    }
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

    renderer2.setSize(size.width, size.height);
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));




    const light = new THREE.AmbientLight(0xffffff, 1.5);
    light.position.set(0, 10, 50);

    scene.add(light);


}

const addTextureToScene = () => {
    imageTexture = new THREE.TextureLoader().load(textureImage, function (texture) {
        texture.flipY = false;
        texture.wrapT = THREE.RepeatWrapping;
        texture.wrapS = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.depthTest = false;
        texture.depthWrite = false;

        imageTexture = texture;
        setupDepthCamera();
    });
};


const init = () => {
    setupScene();
    setupDepthCamera();
    createDepthTarget();
    addTextureToScene();
    setSettingsView();
    const $renderButton = document.querySelector('.prompt__button');
    $renderButton.addEventListener('click', onClickSendData);
    window.addEventListener('resize', onWindowResize);

}


// render scene 
const render = () => {
    requestAnimationFrame(render);

    if (depthCamera) {

        // Depth Camera View
        const depthWidth = size.width;
        const depthHeight = size.height;
        renderer.setViewport(0, 0, depthWidth, depthHeight);

        renderer.setRenderTarget(depthTarget);
        renderer.render(scene, depthCamera);
        // Update the depthMaterial with the depthTarget texture
        depthMaterial.uniforms.tDepth.value = depthTarget.depthTexture;


        // Render the depthTarget texture
        renderer.setRenderTarget(null);

        renderer.render(scene, depthCamera);

        // Mobile Camera View
    }

    mobileViewCamera.updateProjectionMatrix();
    mobileViewCamera.updateMatrixWorld(true);
    mobileViewCamera.lookAt(0, 0, -1650);
    mobileViewCamera.updateMatrixWorld(true);
    mobileViewCamera.scale.set(0.7, 1.0, 1.3);
    mobileViewCamera.zoom = 0.75;
    mobileViewCamera.updateMatrixWorld(true);

    canvas2.style.width = `${mobileWidth * 0.4}px`;
    canvas2.style.height = `${mobileHeight}px`;

    renderer2.setSize(mobileWidth * 0.4, mobileHeight);
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer2.render(scene, mobileViewCamera);

    controls.update();

};

const animate = () => {
    requestAnimationFrame(animate);

    mobileViewCamera.position.z = Math.sin(Date.now() * 0.001) * 5 + 65;
    // mobileViewCamera.position.x = Math.cos(Date.now() * 0.001) * 1 + 4;
}

animate();

const onWindowResize = () => {
    size.width = window.innerWidth - 100;
    size.height = window.innerHeight;
    mobileViewCamera.aspect = size.width / size.height;
    mobileViewCamera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
}

const setSettingsView = () => {


    const $settingsGeneration = document.querySelector('.settings__generation');
    const $settingsAnimation = document.querySelector('.settings__animation');
    const $settingsToggle = document.querySelector('.settings__toggle');

    $settingsGeneration.style.display = 'flex';

    $settingsToggle.addEventListener('click', (e) => {

        if ($settingsGeneration.style.display === 'flex') {
            $settingsGeneration.style.display = 'none';
            $settingsAnimation.style.display = 'flex';

            canvas.style.display = 'none';
            canvas2.style.display = 'block';
        } else {
            $settingsGeneration.style.display = 'flex';
            $settingsAnimation.style.display = 'none';

            canvas.style.display = 'block';
            canvas2.style.display = 'none';
        }

    });


}

const onClickSendData = (e) => {
    e.preventDefault();
    // Render the scene with the camera onto the offscreen renderer
    renderer.render(scene, camera);
    const imgData = renderer.domElement.toDataURL();
    const img = new Image();
    img.colorDepth = 16;
    img.width = 2760;
    img.height = 1920;
    img.src = imgData;


    const $prompt = document.querySelector('.prompt__textarea');
    const prompt = $prompt.value;

    // download the image 

    // base64 png image
    const base64String = imgData.replace('data:image/png;base64,', '');

    // send to api
    sendRequest(base64String, prompt);

};



const sendRequest = async (image, prompt) => {


    const raw = JSON.stringify({
        "key": "RH6vKf2wxftFGh7g9wA6NNIZTvPexxxFvkeWUXzwOruQxsFmkaoX7XdyGR64",
        "model_id": "dream-shaper-8797",
        "init_image": image,
        "mask_image": null,
        "guess_mode": "no",
        "width": "512",
        "height": "512",
        "prompt": `{{${prompt}}}, epic concept art by barlowe wayne, ruan jia, maximum detail, trending on artstation, unreal engine, hyper-realistic, light effect, volumetric light, 3d, ultra clear detailed, octane render, 8k`,
        "use_karras_sigmas": "yes",
        "algorithm_type": null,
        "safety_checker_type": null,
        "tomesd": "yes",
        "vae": null,
        "embeddings": null,
        "upscale": null,
        "instant_response": null,
        "strength": 1,
        "negative_prompt": "",
        "guidance": 7.5,
        "samples": 1,
        "safety_checker": "yes",
        "auto_hint": "no",
        "steps": 25,
        "seed": null,
        "webhook": null,
        "track_id": null,
        "scheduler": "DPMSolverMultistepScheduler",
        "base64": "yes",
        "clip_skip": "2",
        "controlnet_conditioning_scale": null,
        "temp": null,
        "ip_adapter_id": null,
        "ip_adapter_scale": null,
        "ip_adapter_image": null,
        "controlnet_model": "depth",
        "controlnet_type": "depth",

    });

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch("https://modelslab.com/api/v5/controlnet", requestOptions);
    let data = await response.json();
    let status = data.status;
    let output = data.output[0];

    while (status === 'processing') {
        await new Promise(resolve => {
            let rawStatus = JSON.stringify({
                "key": "RH6vKf2wxftFGh7g9wA6NNIZTvPexxxFvkeWUXzwOruQxsFmkaoX7XdyGR64",
                "request_id": data.id
            });

            let requestOptionsStatus = {
                method: 'POST',
                headers: myHeaders,
                body: rawStatus,
                redirect: 'follow'
            };

            setTimeout(async () => {
                try {
                    const response = await fetch("https://modelslab.com/api/v6/images/fetch", requestOptionsStatus);
                    const result = await response.json();
                    console.log(result);
                    status = result.status;
                    output = result.output[0];

                    if (status === "success") {
                        clearTimeout();
                    }
                    resolve();
                } catch (error) {
                    console.error("Error fetching status:", error);
                    // Handle the error or retry logic if needed
                    resolve();
                }
            }, data.eta * 1000);
        });
    }

    if (status === 'success') {
        status = null;
        const generatedImageData = data.output[0] || output;

        try {
            // Fetch the image data from the URL
            const imageResponse = await fetch(generatedImageData);
            const base64String = await imageResponse.text();

            if (base64String) {
                console.log(base64String);
                const imgElement = new Image();
                imgElement.src = `data:image/png;base64,${base64String}`;
                imgElement.width = 2760;
                imgElement.height = 1920;
                textureImage = imgElement.src;

                addTextureToScene();
            } else {
                console.error("Base64 string is empty or undefined.");
            }
        } catch (error) {
            console.error("Error fetching or decoding image:", error);
        }
    }

}


render();
init();