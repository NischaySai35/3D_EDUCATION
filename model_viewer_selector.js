import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/RGBELoader.js";

let scene, camera, renderer, controls, model;
let lastHovered = null;
const originalMaterials = new Map();

export function initScene() {
    if (scene) return;

    console.log("Initializing 3D scene...");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById("model-canvas") });
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.background = new THREE.Color(0xffffff);

    document.getElementById("model-viewer-container").appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
    const dirLight = new THREE.DirectionalLight(0xffffff, 5.0);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // HDRI
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load("studio.hdr", (texture) => {
        scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
        texture.dispose();
    });

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = true;
    controls.zoomSpeed = 3.0;
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controls.rotateSpeed = 0.5;
    controls.panSpeed = 1;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener("mousemove", onHover);
    window.addEventListener("click", onClick);
    animate();
}

export function loadModel(url) {
    initScene();
    if (model) {
        scene.remove(model);
        model = null;
    }

    const loader = new GLTFLoader();
    console.log("Load function initiated, url =", url);
    loader.load(url, function (gltf) {
        model = gltf.scene;
        model.scale.set(3, 3, 3);
        scene.add(model);
        console.log("Model loaded:", model);

        // Adjust camera
        const bbox = new THREE.Box3().setFromObject(model);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));

        camera.position.set(center.x, center.y, cameraDistance);
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
    });
}

// Shader-based outline effect
const outlineMaterial = new THREE.ShaderMaterial({
    uniforms: { edgeColor: { value: new THREE.Color(0xff0000) } },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 edgeColor;
        void main() {
            float intensity = pow(dot(vNormal, vec3(0.0, 0.0, 1.0)), 1.0);
            gl_FragColor = vec4(edgeColor, intensity * 0.8);
        }
    `,
    transparent: true,
});

function onHover(event) {
    if (!model) return;

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const partNameDiv = document.getElementById("part-name");

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {
        const hoveredPart = intersects[0].object;

        if (lastHovered && lastHovered !== hoveredPart) {
            lastHovered.material = originalMaterials.get(lastHovered);
        }

        if (!originalMaterials.has(hoveredPart)) {
            originalMaterials.set(hoveredPart, hoveredPart.material);
        }

        hoveredPart.material = outlineMaterial;
        lastHovered = hoveredPart;

        // Show part name tooltip
        partNameDiv.innerText = hoveredPart.name || "Unknown Part";
        partNameDiv.style.left = event.clientX + "px";
        partNameDiv.style.top = event.clientY + "px";
        partNameDiv.style.display = "block";
    } else {
        if (lastHovered) {
            lastHovered.material = originalMaterials.get(lastHovered);
            lastHovered = null;
        }
        partNameDiv.style.display = "none";
    }
}

function onClick() {
    if (lastHovered && currentModelName) {  
        const partName = lastHovered.name || "Unknown Part";
        console.log(`Clicked on part: ${partName} of model: ${currentModelName}`);

        fetch(`/${currentModelName}/${partName}/explain`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
        }) // Send to backend
            .then(response => response.json())
            .then(data => {
                document.getElementById("explanation").innerText = data.explanation;
            })
            .catch(error => console.error("Error fetching explanation:", error));
    }
}


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

