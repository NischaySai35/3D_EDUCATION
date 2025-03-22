import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/RGBELoader.js';

console.log("Three.js and modules loaded!");

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
scene.background = new THREE.Color(0xffffff); // White
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let model; // Declare at the top

// Load Model
const loader = new GLTFLoader();
loader.load("models/bike.glb", function (gltf) {
    model = gltf.scene;
    model.scale.set(3, 3, 3);
    scene.add(model);
    console.log("Model loaded:", model);

    // Compute bounding box
    const bbox = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());

    // Adjust camera position based on model size
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180); // Convert FOV to radians
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2));

    camera.position.set(center.x, center.y, cameraDistance);
    camera.lookAt(center);

    controls.target.copy(center);
    controls.update();
});

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1.0);  // Too high before, now balanced
scene.add(light);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const rgbeLoader = new RGBELoader();
rgbeLoader.load('studio.hdr', (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;  // Apply HDRI as environment
    //scene.background = envMap;   // If you want the HDR as background
    texture.dispose();
});

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 5.0); // Increase brightness
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Orbit Controls (Mimicking Model-Viewer)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Smooth interactions
controls.dampingFactor = 0.1;   // Fine-tune damping
controls.screenSpacePanning = true;  // Allow panning like model-viewer
controls.zoomSpeed = 3.0; // Increase zoom speed (default is 1)
controls.minDistance = 2;  // Restrict zoom-in
controls.maxDistance = 50; // Restrict zoom-out
controls.rotateSpeed = 0.5;
controls.panSpeed = 1;
controls.autoRotate = true;       // Enable auto-rotation
controls.autoRotateSpeed = 0.3;   // Adjust for natural movement

// Set Initial Camera Position
//camera.position.set(0, 5, 20);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create a simple outline shader material
const outlineMaterial = new THREE.ShaderMaterial({
    uniforms: {
        edgeColor: { value: new THREE.Color(0xff0000) }, // Red outline
    },
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

//composer.addPass(outlinePass);
// Store original material
const originalMaterials = new Map(); // Store original materials per part
let lastHovered = null;

window.addEventListener("mousemove", (event) => {
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
            lastHovered.material = originalMaterials.get(lastHovered); // Restore previous part's material
        }

        if (!originalMaterials.has(hoveredPart)) {
            originalMaterials.set(hoveredPart, hoveredPart.material); // Store original material once
        }

        hoveredPart.material = outlineMaterial; // Apply outline material
        lastHovered = hoveredPart;

        // Show part name
        partNameDiv.innerText = hoveredPart.name || "Unknown Part";
        partNameDiv.style.left = event.clientX + "px";
        partNameDiv.style.top = event.clientY + "px";
        partNameDiv.style.display = "block";
    } else {
        if (lastHovered) {
            lastHovered.material = originalMaterials.get(lastHovered); // Restore original material
            lastHovered = null;
        }
        partNameDiv.style.display = "none"; // Hide name if no part is hovered
    }
});


// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
