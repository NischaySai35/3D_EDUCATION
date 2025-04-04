import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/RGBELoader.js";

let scene, camera, renderer, model;

// Initialize the scene
function initBackground() {
  // Create the scene
  scene = new THREE.Scene();

  // Calculate FOV for 50mm focal length
  const sensorHeight = 24; // Full-frame sensor height in mm
  const focalLength = 50; // Desired focal length in mm
  const fov = 2 * Math.atan((sensorHeight / 2) / focalLength) * (180 / Math.PI);

  // Create the camera with the calculated FOV
  camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Create the renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("background-canvas"), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const rgbeLoader = new RGBELoader();
  rgbeLoader.load("models/park.hdr", (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap; // Use HDRI for lighting
    texture.dispose();
  });

  // Load the .glb model
  const loader = new GLTFLoader();
  loader.load("./models/shapes.glb", (gltf) => {
    model = gltf.scene;
    scene.add(model);
    model.scale.set(1, 1, 1); // Adjust the scale of the model
    model.position.set(0, 0, 0); // Center the model

    const bbox = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -center.y, -center.z);
    camera.position.set(1, -3, 31);
  });

  // Handle window resize
  window.addEventListener("resize", onWindowResize);

  // Add mouse movement interaction
  document.addEventListener("mousemove", onMouseMove);
  console.log("Entered init function");
  animate();
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle mouse movement
function onMouseMove(event) {
  if (!model) return;

  const mouseX = (event.clientX / window.innerWidth) * 2 - 1; // Normalize mouse X
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1; // Normalize mouse Y

  // Rotate the model based on mouse position
  model.rotation.y = mouseX * 0.15; // Rotate around Y-axis
  model.rotation.x = mouseY * 0.15; // Rotate around X-axis
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Initialize the background
initBackground();