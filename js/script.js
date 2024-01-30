import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import depthVertexShader from '../shaders/vertex.glsl?raw';
import depthFragmentShader from '../shaders/fragment.glsl?raw';
import gsap from 'gsap';


const canvas = document.querySelector('#c');
const canvas2 = document.querySelector('#c2');

canvas2.style.display = 'none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);


const size = {
    width: window.innerWidth / 1.5,
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
let depthImageCamera;

const mobileViewCamera = new THREE.PerspectiveCamera(28.119373240232346, 1, 1, 1000);
mobileViewCamera.position.set(0, 12.167400360107422, 76.681701660156255);
mobileViewCamera.rotation.set(-0.2617993877991494, 0, 0);
const mobileWidth = size.width;
const mobileHeight = size.height;


renderer2.setViewport(0, 0, mobileWidth, mobileHeight);

const tl1 = gsap.timeline({ paused: true, yoyo: true, repeat: 1 });
const tl3 = gsap.timeline({ paused: true, yoyo: true, repeat: 1 });
const tl2 = gsap.timeline({ paused: true, yoyo: true, repeat: 1 });
const tl4 = gsap.timeline({ paused: true, yoyo: true, repeat: 1 });

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");


// Set the position of the camera (adjust as needed)

let imageTexture;
let textureImage;

let selectedView;

let originalCameraPosition;
let originalCameraScale;
let originalCameraRotation;
let originalCameraProjectionMatrix;

const $fileInput = document.querySelector('.upload__input');
const $loader = document.querySelector('.loader');


let albumMesh;

let selectedAnimation;
const $renderButton = document.querySelector('.prompt__button');



const $restartButton = document.querySelector('.restart__button');
$restartButton.addEventListener('click', () => {
    window.location.reload();
});

const $startButton = document.querySelector('.introduction__button');
$startButton.addEventListener('click', () => {
    const $app = document.querySelector('.app__container');
    $app.style.display = 'flex';
    const $introduction = document.querySelector('.introduction');
    $introduction.style.display = 'none';
});

const addAlbumCoverTexture = () => {

    $fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        const file = e.target.files[0];


        const albumGeometry = new THREE.BoxGeometry(9, 7, 0.2);
        const albumMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: new THREE.Texture() });
        albumMesh = new THREE.Mesh(albumGeometry, albumMaterial);
        albumMesh.position.set(0, 15, -10);
        albumMesh.scale.set(1.2, 1.2, 1.2);
        scene.add(albumMesh);



        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const albumTexture = new THREE.TextureLoader().load(e.target.result);
                albumTexture.flipY = true;
                albumTexture.wrapT = THREE.RepeatWrapping;
                albumTexture.wrapS = THREE.RepeatWrapping;
                albumMaterial.map = albumTexture;
                albumMaterial.needsUpdate = true;
                albumMaterial.format = THREE.RGBAFormat;
                albumMaterial.castShadow = true;

                renderer2.render(scene, mobileViewCamera);
            }
            reader.readAsDataURL(file);
            const $uploadInput = document.querySelector('.upload__image');
            $uploadInput.style.display = 'none';
        }
    });

}


const updateSelectedView = () => {
    const $firstView = document.querySelector('.camera__button.first');
    const $secondView = document.querySelector('.camera__button.second');
    const $thirdView = document.querySelector('.camera__button.third');

    $firstView.classList.add('active');

    $firstView.addEventListener('click', () => {
        selectedView = 1;
        $firstView.classList.add('active');
        $secondView.classList.remove('active');
        $thirdView.classList.remove('active');
        updateCameraView();
    });

    $secondView.addEventListener('click', () => {
        selectedView = 2;
        $secondView.classList.add('active');
        $firstView.classList.remove('active');
        $thirdView.classList.remove('active');
        updateCameraView();

    });

    $thirdView.addEventListener('click', () => {
        selectedView = 3;
        $thirdView.classList.add('active');
        $firstView.classList.remove('active');
        $secondView.classList.remove('active');
        updateCameraView();
    });

}

const updateCameraView = () => {

    depthCamera.position.copy(originalCameraPosition);
    depthCamera.scale.copy(originalCameraScale);
    depthCamera.rotation.copy(originalCameraRotation);
    depthCamera.projectionMatrix.copy(originalCameraProjectionMatrix);

    depthImageCamera.position.copy(originalCameraPosition);
    depthImageCamera.scale.copy(originalCameraScale);
    depthImageCamera.rotation.copy(originalCameraRotation);
    depthImageCamera.projectionMatrix.copy(originalCameraProjectionMatrix);

    if (selectedView === 1) {
        // dont change anything
        setupDepthCamera();

    } else if (selectedView === 2) {
        // second view
        depthCamera.position.z = 40;
        depthCamera.lookAt(3, 15, 5);

        depthImageCamera.position.z = 50;
        depthImageCamera.lookAt(3, 15, 5);

        setupDepthCamera();

    } else if (selectedView === 3) {

        // third view
        depthCamera.position.x = 11;
        depthCamera.lookAt(-10, 10, -20);

        depthImageCamera.position.x = 11;
        depthImageCamera.lookAt(-10, 10, -20);

        setupDepthCamera();
    }
}




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
        scene.add(gltf.scene);

        if (gltf.cameras && gltf.cameras.length > 0) {
            const blenderCamera = gltf.cameras[0];

            originalCameraPosition = blenderCamera.position;
            originalCameraScale = blenderCamera.scale;
            originalCameraRotation = blenderCamera.rotation;
            originalCameraProjectionMatrix = blenderCamera.projectionMatrix;

            if (blenderCamera) {
                depthCamera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                depthCamera.position.copy(blenderCamera.position);
                depthCamera.scale.copy(blenderCamera.scale)
                depthCamera.rotation.copy(blenderCamera.rotation);
                depthCamera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                depthCamera.colorDepth = 16;

                depthCamera.updateMatrixWorld(true);

                depthImageCamera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                depthImageCamera.rotation.copy(blenderCamera.rotation);
                depthImageCamera.scale.copy(blenderCamera.scale)
                depthImageCamera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                depthImageCamera.colorDepth = 16;

                depthImageCamera.updateMatrixWorld(true);

                if (selectedView === 2) {
                    // second view
                    depthCamera.position.z = 40;
                    depthCamera.lookAt(3, 15, 5);

                    depthImageCamera.position.z = 50;
                    depthImageCamera.lookAt(3, 15, 5);

                    depthCamera.updateMatrixWorld(true);
                    depthImageCamera.updateMatrixWorld(true);
                } else if (selectedView === 3) {

                    // third view
                    depthCamera.position.x = 11;
                    depthCamera.lookAt(-10, 10, -20);

                    depthImageCamera.position.x = 11;
                    depthImageCamera.lookAt(-10, 10, -20);
                    depthCamera.updateMatrixWorld(true);
                    depthImageCamera.updateMatrixWorld(true);
                }


                // Create the depth material

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

                    if (textureImage !== undefined) {
                        const textureMaterial = new THREE.MeshBasicMaterial({ map: imageTexture, aoMap: imageTexture, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
                        const mesh = new THREE.Mesh(child.geometry, textureMaterial);
                        mesh.position.copy(child.position);
                        mesh.rotation.copy(child.rotation);
                        mesh.scale.copy(child.scale);
                        scene.add(mesh);
                    }

                });

                const geometry = new THREE.PlaneGeometry(1012, 704, 100, 100);
                const mesh = new THREE.Mesh(geometry, depthMaterial);
                mesh.rotation.copy(depthCamera.rotation);
                mesh.position.set(350, 350, 0);
                mesh.rotation.x = Math.PI / 2 * 3;
                mesh.scale.set(0.105, 0.105, 0.105);
                scene.add(mesh);

                depthImageCamera.position.set(350, 495, 0);
                depthImageCamera.lookAt(mesh.position);




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

    setupDepthCamera();



    const light = new THREE.AmbientLight(0xffffff, 0.5);
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
        texture.format = THREE.RGBAFormat;
        imageTexture = texture;
        setupDepthCamera();
    });
};


const init = () => {
    setupScene();
    createDepthTarget();
    updateSelectedView();
    $renderButton.addEventListener('click', onClickSendData);


    const $addingCoverPlane = document.querySelector('.upload__input');
    $addingCoverPlane.addEventListener('click', addAlbumCoverTexture);


    cameraMovement();

    const $videoRenderButton = document.querySelector('.render__button');
    $videoRenderButton.addEventListener('click', () => {
        onClickRenderVideo('video');
    });
}


// render scene 
const render = () => {
    requestAnimationFrame(render);

    if (depthCamera) {

        // Depth Camera View
        const depthWidth = size.width;
        const depthHeight = size.height;
        renderer.setViewport(0, 0, depthWidth, depthHeight);
        depthCamera.updateMatrixWorld(true);
        renderer.setRenderTarget(depthTarget);
        renderer.render(scene, depthCamera);
        // Update the depthMaterial with the depthTarget texture
        depthMaterial.uniforms.tDepth.value = depthTarget.depthTexture;


        // Render the depthTarget texture
        renderer.setRenderTarget(null);

        depthCamera.updateMatrixWorld(true);

        renderer.render(scene, depthCamera);
        // Mobile Camera View
    }


    mobileViewCamera.updateProjectionMatrix();
    mobileViewCamera.lookAt(0, 0, -1650);
    mobileViewCamera.scale.set(0.7, 0.9, 1.3);
    mobileViewCamera.zoom = 0.75;
    mobileViewCamera.updateMatrixWorld(true);

    canvas2.style.width = `${mobileWidth * 0.4}px`;
    canvas2.style.height = `${mobileHeight}px`;

    renderer2.setSize(mobileWidth * 0.4, mobileHeight);
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // make render2 very clear and sharp image 
    renderer2.render(scene, mobileViewCamera);

    // window resize
    window.addEventListener('resize', onWindowResize);



};



const cameraMovement = () => {
    // Camera movements
    const $firstAnimation = document.querySelector('.first__animation');
    const $secondAnimation = document.querySelector('.second__animation');
    const $thirdAnimation = document.querySelector('.third__animation');
    const $fourthAnimation = document.querySelector('.fourth__animation');
    // Initial state
    gsap.set(mobileViewCamera.position, { z: 76.681701660156255 });


    $firstAnimation.addEventListener('click', () => {
        selectedAnimation = 1;
        $firstAnimation.classList.add('active');
        $secondAnimation.classList.remove('active');
        $thirdAnimation.classList.remove('active');
        $fourthAnimation.classList.remove('active');
        firstAnimation();
    });

    $secondAnimation.addEventListener('click', () => {
        selectedAnimation = 2;
        $secondAnimation.classList.add('active');
        $firstAnimation.classList.remove('active');
        $thirdAnimation.classList.remove('active');
        $fourthAnimation.classList.remove('active');
        secondAnimation();

    });

    $thirdAnimation.addEventListener('click', () => {
        selectedAnimation = 3;
        $thirdAnimation.classList.add('active');
        $firstAnimation.classList.remove('active');
        $secondAnimation.classList.remove('active');
        $fourthAnimation.classList.remove('active');
        thirdAnimation();
    });

    $fourthAnimation.addEventListener('click', () => {
        selectedAnimation = 4;
        $fourthAnimation.classList.add('active');
        $firstAnimation.classList.remove('active');
        $secondAnimation.classList.remove('active');
        $thirdAnimation.classList.remove('active');
        fourthAnimation();
    });



    tl1.fromTo(mobileViewCamera.position, { z: 76.681701660156255, delay: 1 }, { z: 65, duration: 7, ease: "power1.inOut", });
    tl2.fromTo(mobileViewCamera.position, { z: 76.681701660156255, delay: 1 }, { z: 58, duration: 7, ease: "circ.inOut" });
    tl3.fromTo(mobileViewCamera.position, { z: 76.681701660156255, delay: 1 }, { z: 58, duration: 4, ease: "power1.inOut" });
    tl4.fromTo(mobileViewCamera.position, { z: 76.681701660156255, delay: 1 }, { z: 65, duration: 4, ease: "circ.inOut" });

}


const firstAnimation = () => {
    tl2.pause().progress(0);
    tl3.pause().progress(0);
    tl4.pause().progress(0);

    tl1.restart();
    gsap.to(albumMesh?.rotation, { delay: 2, y: 3.5, duration: 6, ease: "power1.inOut", repeat: 1, yoyo: true, onComplete: () => { albumMesh?.rotation.set(0, 0, 0); } });
    gsap.to(albumMesh?.position, { delay: 1, y: 16, duration: 6, ease: "power1.inOut", repeat: 1, yoyo: true, onComplete: () => { albumMesh?.position.set(0, 15, -10); } });

}

const secondAnimation = () => {
    tl1.pause().progress(0);
    tl3.pause().progress(0);
    tl4.pause().progress(0);

    tl2.restart();
    gsap.to(albumMesh?.position, { delay: 1, z: -2, duration: 6, ease: "circ.inOut", repeat: 1, yoyo: true, onComplete: () => { albumMesh?.position.set(0, 15, -10); } });
}

const thirdAnimation = () => {
    tl1.pause().progress(0);
    tl2.pause().progress(0);
    tl4.pause().progress(0);

    tl3.restart();
    gsap.to(albumMesh?.rotation, { delay: 1, y: -3, duration: 3, ease: "power1.inOut", repeat: 1, yoyo: true, onComplete: () => { albumMesh?.rotation.set(0, 0, 0); } });
    gsap.to(albumMesh?.position, { z: 10, duration: 4, ease: "power1.inOut", repeat: 1, yoyo: true, onComplete: () => { albumMesh?.position.set(0, 15, -10); } });
}


const fourthAnimation = () => {
    tl1.pause().progress(0);
    tl2.pause().progress(0);
    tl3.pause().progress(0);

    tl4.restart();
    gsap.to(albumMesh?.position, { delay: 1, z: -2, duration: 3.5, ease: "circ.inOut", repeat: 1, yoyo: true, onComplete: () => { albumMesh?.position.set(0, 15, -10); } });
}

const onClickRenderVideo = async (output) => {

    let chunks = [];
    let canvasStream = canvas2.captureStream(30);
    const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm; codecs=vp9', });

    const $renderIndicator = document.querySelector('.render__indicator');
    $renderIndicator.style.display = 'inline-block';

    $renderButton.style.cursor = 'not-allowed';

    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    }

    mediaRecorder.onstop = function (e) {
        const blob = new Blob(chunks, { type: 'video/webm' });
        chunks = [];
        const videoURL = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = videoURL;
        downloadLink.download = output + '.webm';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    if (selectedAnimation === 1) {
        firstAnimation();
        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
            $renderIndicator.style.display = 'none';
            $renderButton.style.cursor = 'pointer';

        }, 14000);


    } else if (selectedAnimation === 2) {
        secondAnimation();
        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
            $renderIndicator.style.display = 'none';
            $renderButton.style.cursor = 'pointer';

        }, 14000);

    } else if (selectedAnimation === 3) {

        thirdAnimation();
        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
            $renderIndicator.style.display = 'none';
            $renderButton.style.cursor = 'pointer';

        }, 8000);


    } else if (selectedAnimation === 4) {

        fourthAnimation();
        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
            $renderIndicator.style.display = 'none';
            $renderButton.style.cursor = 'pointer';

        }, 8000);
    }

    clearTimeout();



}

const onClickSendData = (e) => {
    e.preventDefault();
    // Render the scene with the camera onto the offscreen renderer
    renderer.render(scene, depthImageCamera);
    const imgData = renderer.domElement.toDataURL();
    const img = new Image();
    img.colorDepth = 16;
    img.width = 2024;
    img.height = 1408;
    img.aspectRatio = 1;
    img.src = imgData;


    const $prompt = document.querySelector('.prompt__textarea');
    const prompt = $prompt.value;


    // base64 png image
    const base64String = imgData.replace('data:image/png;base64,', '');

    // send to api
    sendRequest(base64String, prompt);

    $loader.style.display = 'flex';
    console.log("sent")

};


const onWindowResize = () => {
    size.width = window.innerWidth / 1.5;
    size.height = window.innerHeight / 1.3;

    renderer.setSize(size.width, size.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer2.setSize(size.width, size.height);
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mobileViewCamera.aspect = size.width / size.height;
    mobileViewCamera.updateProjectionMatrix();

    canvas2.style.width = `${size.width * 0.4}px`;
    canvas2.style.height = `${size.height}px`;

    renderer.render(scene, depthCamera);
    renderer2.render(scene, mobileViewCamera);
}


const sendRequest = async (image, prompt) => {


    const raw = JSON.stringify({
        "key": "",
        "model_id": "dream-shaper-8797",
        "init_image": image,
        "mask_image": null,
        "guess_mode": "no",
        "width": "512",
        "height": "512",
        "prompt": `{{${prompt}}}, maximum detail, trending on artstation, unreal engine, hyper-realistic, light effect, volumetric light, 3d, ultra clear detailed, octane render, 8k, 35 mm camera, moody cinematic epic concept art, hyper photorealistic, epic, movie concept art, cinematic composition`,
        "use_karras_sigmas": "yes",
        "algorithm_type": null,
        "safety_checker_type": null,
        "tomesd": "yes",
        "vae": null,
        "embeddings": null,
        "upscale": null,
        "instant_response": null,
        "strength": 1,
        "negative_prompt": "blurry, horror, distorted, low quality, pixelated, low resolution, transparent",
        "guidance": 8,
        "samples": 1,
        "safety_checker": "yes",
        "auto_hint": "no",
        "steps": 50,
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
                "key": "",
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

                    const $loaderStatus = document.createElement('p');
                    $loaderStatus.classList.add('loader__status');
                    $loaderStatus.textContent = `Estimated time left: ${data.eta} seconds`;
                    $loader.appendChild($loaderStatus);

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
                imgElement.width = 2024;
                imgElement.height = 1408;
                imgElement.aspectRatio = 1;
                textureImage = imgElement.src;

                const $settingsGeneration = document.querySelector('.settings__generation');
                const $settingsAnimation = document.querySelector('.settings__animation');
                $settingsGeneration.style.display = 'none';
                $settingsAnimation.style.display = 'flex';

                canvas.style.display = 'none';
                canvas2.style.display = 'block';
                $loader.style.display = 'none';
                selectedView = 1;

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
