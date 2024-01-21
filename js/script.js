import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import depthVertexShader from '../shaders/vertex.glsl?raw';
import depthFragmentShader from '../shaders/fragment.glsl?raw';




const canvas = document.querySelector('#c');
const canvas2 = document.querySelector('#c2');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);


const size = {
    width: window.innerWidth - 100,
    height: window.innerHeight,
};

const loader = new GLTFLoader();
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});

const renderer2 = new THREE.WebGLRenderer({
    canvas: canvas2,
    antialias: true,
});


let depthCamera;
let depthTarget;
let depthMaterial;



// Camera in mobile size to see the rendered view of the scene
let camera;

const mobileViewCamera = new THREE.PerspectiveCamera(28.119373240232346, 16 / 9, 0.1, 1000);
mobileViewCamera.position.set(0, 12.167400360107422, 76.681701660156255);
mobileViewCamera.rotation.set(-0.2617993877991494, 0, 0);
mobileViewCamera.updateMatrixWorld(true);



const controls = new OrbitControls(mobileViewCamera, canvas2);
controls.enableDamping = true;
controls.enableZoom = true;
controls.enablePan = true;
controls.minDistance = 0.1;




const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");


// Set the position of the camera (adjust as needed)

let imageTexture;
let textureImage = '../assets/test.png';


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


                const textureMaterial = new THREE.MeshStandardMaterial({ map: imageTexture, side: THREE.DoubleSide, depthTest: false });
                const mesh = new THREE.Mesh(child.geometry, textureMaterial);
                mesh.position.copy(child.position);
                mesh.rotation.copy(child.rotation);
                mesh.scale.copy(child.scale);
                scene.add(mesh);


            }
        });
        scene.add(gltf.scene);


        console.log(gltf)
        // Check if cameras exist in the glTF file
        if (gltf.cameras && gltf.cameras.length > 0) {
            const blenderCamera = gltf.cameras[0];
            if (blenderCamera) {
                depthCamera = new THREE.OrthographicCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                depthCamera.position.copy(blenderCamera.position);
                console.log(blenderCamera.position);
                depthCamera.scale.copy(blenderCamera.scale)
                depthCamera.rotation.copy(blenderCamera.rotation);
                depthCamera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                depthCamera.updateMatrixWorld(true);

                camera = new THREE.PerspectiveCamera(blenderCamera.fov, size.width / size.height, 0.001, 1);
                camera.rotation.copy(blenderCamera.rotation);
                camera.scale.copy(blenderCamera.scale)
                camera.projectionMatrix.copy(blenderCamera.projectionMatrix);
                camera.updateMatrixWorld(true);

                console.log(depthCamera.fov);
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

    renderer2.setSize(size.width, size.height);
    renderer2.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

const addTextureToScene = () => {
    imageTexture = new THREE.TextureLoader().load(textureImage, function (texture) {
        // Callback function to handle texture loading completion
        texture.flipY = false;
        texture.wrapT = THREE.RepeatWrapping;
        texture.wrapS = THREE.RepeatWrapping;
        texture.DoubleSide = false;
        texture.repeat.set(1, 1);
        imageTexture = texture;
        setupDepthCamera();
    });
};


const init = () => {
    setupScene();
    setupDepthCamera();
    createDepthTarget();
    addTextureToScene();
    const newButton = document.createElement('button');
    newButton.innerText = 'Save Image';
    newButton.addEventListener('click', onClickSaveImage);
    document.body.appendChild(newButton);
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

    const mobileWidth = size.width * 0.3;
    const mobileHeight = size.height * 0.5;
    mobileViewCamera.lookAt(0, 0, -1500);
    mobileViewCamera.updateProjectionMatrix();
    renderer2.setViewport(0, 0, mobileWidth, mobileHeight);
    renderer2.render(scene, mobileViewCamera);
    canvas2.style.width = `${mobileWidth}px`;
    canvas2.style.height = `${mobileHeight}px`;

    controls.update();


};

const onWindowResize = () => {
    size.width = window.innerWidth - 100;
    size.height = window.innerHeight;
    mobileViewCamera.aspect = size.width / size.height;
    mobileViewCamera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
}



const onClickSaveImage = (e) => {
    e.preventDefault();
    // Render the scene with the camera onto the offscreen renderer
    renderer.render(scene, camera);
    const imgData = renderer.domElement.toDataURL();
    const img = new Image();
    img.src = imgData;
    img.width = 2760;
    img.height = 1920;


    // download the image 

    // const a = document.createElement('a');
    // a.href = imgData;
    // a.download = 'image.png';
    // a.click();

    // base64 png image
    const base64String = imgData.replace('data:image/png;base64,', '');

    // send to api
    sendRequest(base64String);

};



const sendRequest = async (image) => {


    const raw = JSON.stringify({
        "key": "RH6vKf2wxftFGh7g9wA6NNIZTvPexxxFvkeWUXzwOruQxsFmkaoX7XdyGR64",
        "controlnet_model": "depth",
        "controlnet_type": "depth",
        "model_id": "dream-shaper-8797",
        "guess_mode": "no",
        "prompt": "{{Majestic Alpine mountain range, where snow-capped peaks pierce the azure sky, pristine glaciers cling to rugged cliffs, and evergreen forests blanket the lower slopes in a rich tapestry of green}}, realism, octane render, 8k, exploration, cinematic, trending on artstation, 35 mm camera, unreal engine, hyper detailed, photo - realistic maximum detail, volumetric light, moody cinematic epic concept art, realistic matte painting, hyper photorealistic, epic, trending on artstation, movie concept art, cinematic composition, ultra - detailed, realistic.",
        "base64": "yes",
        "init_image": image,
        "mask_image": null,
        "width": "512",
        "height": "512",
        "use_karras_sigmas": "yes",
        "algorithm_type": null,
        "safety_checker_type": null,
        "tomesd": "yes",
        "vae": null,
        "embeddings": null,
        "lora_strength": null,
        "upscale": null,
        "instant_response": null,
        "strength": 1,
        "negative_prompt": "",
        "guidance": 7.5,
        "samples": 1,
        "safety_checker": "yes",
        "auto_hint": "no",
        "steps": 25,
        "seed": 5,
        "webhook": null,
        "track_id": null,
        "controlnet_conditioning_scale": null,
        "temp": null,
        "ip_adapter_id": null,
        "ip_adapter_scale": null,
        "ip_adapter_image": null,
        "scheduler": "DDPMScheduler",

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
    let output;
    console.log(data);

    if (status === 'processing') {

        setInterval(() => {
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

            fetch("https://modelslab.com/api/v6/images/fetch", requestOptionsStatus)
                .then(response => response.json())
                .then(result => {
                    console.log(result);
                    status = result.status;
                    output = result;
                });

        }, data.eta * 1000);
    }

    if (data.status || status === 'success') {
        status = null;
        const generatedImageData = data.output[0] || output.output[0];
        console.log(generatedImageData);

        try {
            // Fetch the image data from the URL
            fetch(generatedImageData)
                .then(response => response.text())
                .then(base64String => {
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
                })
                .catch(error => {
                    console.error("Error fetching image:", error);
                });

        } catch (error) {
            console.error("Error fetching or decoding image:", error);
        }
    }

    return data;

}




render();
init();