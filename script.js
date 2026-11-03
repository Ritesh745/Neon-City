/* ============================================================
   NEON CITY - PART 1/7
   01. Configuration | 02. DOM References | 03. State 
   04. Input | 05. Three.js Vars | 06. Helpers | 07. Notifications
   08. Loading Screen | 09. Engine Init
============================================================ */

import * as THREE from "three";

/* ============================================================
   01. CONFIGURATION
============================================================ */

const CONFIG = {
    worldSize: 620,
    roadSpacing: 70,
    roadWidth: 19,
    playerSpeed: 8,
    runSpeed: 13,
    vehicleSpeed: 25,
    cameraDistance: 8,
    cameraHeight: 4.2,
    cameraSensitivity: 0.006,
    joystickRadius: 34,
    maxPixelRatio: 1.5,
    mobilePixelRatio: 1.25,
    shadowMapSize: 512,
    fogDistance: 390
};

/* ============================================================
   02. DOM REFERENCES
============================================================ */

const $ = (id) => document.getElementById(id);

const gameCanvas = $("gameCanvas");

const loadingScreen = $("loadingScreen");
const loadingProgress = $("loadingProgress");
const loadingText = $("loadingText");
const loadingPercentage = $("loadingPercentage");

const mainMenu = $("mainMenu");
const gameContainer = $("gameContainer");

const startGameBtn = $("startGameBtn");
const pauseBtn = $("mobilePauseBtn");

const pauseMenu = $("pauseMenu");
const resumeBtn = $("resumeBtn");
const restartBtn = $("restartBtn");
const mainMenuBtn = $("mainMenuBtn");

const controlsBtn = $("controlsBtn");
const aboutBtn = $("aboutBtn");

const controlsPanel = $("controlsPanel");
const aboutPanel = $("aboutPanel");

const joystick = $("joystick");
const joystickKnob = $("joystickKnob");

const cameraTouchArea = $("cameraTouchArea");

const mobileControls = $("mobileControls");
const actionControls = document.querySelector(".action-controls");

const vehicleControls = $("vehicleControls");
const vehicleHUD = $("vehicleHUD");

const healthBar = $("healthBar");
const healthValue = $("healthValue");

const staminaBar = $("staminaBar");
const staminaValue = $("staminaValue");

const playerMoney = $("playerMoney");

const missionTitle = $("missionTitle");
const missionDescription = $("missionDescription");

const locationName = $("locationName");

const gameTime = $("gameTime");

const minimap = $("minimap");

const speedValue = $("speedValue");

const interactionMessage = $("interactionMessage");

const notification = $("notification");
const notificationText = $("notificationText");

const gameOverPanel = $("gameOverPanel");
const gameOverTitle = $("gameOverTitle");
const gameOverDescription = $("gameOverDescription");

const playAgainBtn = $("playAgainBtn");

/* ============================================================
   03. GAME STATE
============================================================ */

const state = {
    running: false,
    paused: false,
    started: false,
    gameOver: false,
    inVehicle: false,
    playerHealth: 100,
    stamina: 100,
    money: 2500,
    gameMinutes: 20 * 60,
    joystickX: 0,
    joystickY: 0,
    cameraYaw: 0,
    cameraPitch: 0.22,
    moving: false,
    jumping: false,
    verticalVelocity: 0,
    jumpHeight: 0,
    vehicleThrottle: 0,
    vehicleSteering: 0,
    braking: false,
    lastTime: 0,
    deltaTime: 0,
    elapsedTime: 0,
    notificationTimeout: null,
    notificationVisible: false,
    missionIndex: 0,
    missionCompleted: false,
    currentLocation: "NEON DISTRICT"
};

/* ============================================================
   04. INPUT STATE
============================================================ */

const input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    interact: false,
    accelerate: false,
    brake: false,
    vehicleLeft: false,
    vehicleRight: false
};

/* ============================================================
   05. THREE.JS VARIABLES
============================================================ */

let scene;
let camera;
let renderer;
let clock;
let player;
let playerBody;
let playerHead;
let playerShadow;
let car;
let carBody;
let missionMarker;
let missionRing;
let sunLight;
let ambientLight;
let worldGroup;
let cityBuildings = [];
let collisionObjects = [];
let streetLights = [];
let decorativeObjects = [];
let vehicleWheels = [];
let buildingMaterials = [];
let groundMaterial;
let playerMaterial;
let carMaterial;
let missionParticles = [];
let animationFrameId = null;
let minimapContext;

/* ============================================================
   06. HELPER FUNCTIONS
============================================================ */

function isMobileDevice() {
    return (
        window.matchMedia("(pointer: coarse)").matches ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function distanceXZ(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function showElement(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}

function hideElement(element) {
    if (element) {
        element.classList.add("hidden");
    }
}

/* ============================================================
   07. NOTIFICATION SYSTEM
============================================================ */

function showNotification(message, duration = 2800) {
    if (!notification || !notificationText) return;

    notificationText.textContent = message;
    showElement(notification);
    state.notificationVisible = true;

    if (state.notificationTimeout) {
        clearTimeout(state.notificationTimeout);
    }

    state.notificationTimeout = setTimeout(() => {
        hideElement(notification);
        state.notificationVisible = false;
    }, duration);
}

/* ============================================================
   08. LOADING SCREEN
============================================================ */

function updateLoading(progress, message) {
    const percentage = Math.round(progress);

    if (loadingProgress) {
        loadingProgress.style.width = percentage + "%";
    }

    if (loadingText) {
        loadingText.textContent = message;
    }

    if (loadingPercentage) {
        loadingPercentage.textContent = percentage + "%";
    }
}

function finishLoading() {
    updateLoading(100, "CITY READY");

    setTimeout(() => {
        hideElement(loadingScreen);
        showElement(mainMenu);
    }, 500);
}

/* ============================================================
   09. THREE.JS INITIALIZATION
============================================================ */

function initializeEngine() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b1b);
    scene.fog = new THREE.Fog(
        0x080c20,
        100,
        CONFIG.fogDistance
    );

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        800
    );

    camera.position.set(0, 6, 10);

    const mobile = isMobileDevice();

    renderer = new THREE.WebGLRenderer({
        canvas: gameCanvas,
        antialias: !mobile,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            mobile
                ? CONFIG.mobilePixelRatio
                : CONFIG.maxPixelRatio
        )
    );

    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    clock = new THREE.Clock();

    worldGroup = new THREE.Group();
    scene.add(worldGroup);

    minimapContext = minimap
        ? minimap.getContext("2d")
        : null;

    setupLighting();
}
/* ============================================================
   NEON CITY - PART 2/7
   10. Lighting | 11. Materials | 12. Ground | 13. Roads
   14. Building Generation | 15. City Generation | 16. Street Lights
============================================================ */

/* ============================================================
   10. LIGHTING
============================================================ */

function setupLighting() {
    ambientLight = new THREE.HemisphereLight(
        0x789cff,
        0x111025,
        1.6
    );
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(
        0xa9c8ff,
        1.7
    );
    sunLight.position.set(80, 120, 50);
    sunLight.castShadow = !isMobileDevice();

    if (sunLight.castShadow) {
        sunLight.shadow.mapSize.width = CONFIG.shadowMapSize;
        sunLight.shadow.mapSize.height = CONFIG.shadowMapSize;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0003;
    }

    scene.add(sunLight);

    const blueLight = new THREE.PointLight(
        0x005dff,
        20,
        150
    );
    blueLight.position.set(-80, 20, -80);
    scene.add(blueLight);

    const pinkLight = new THREE.PointLight(
        0xff168a,
        15,
        130
    );
    pinkLight.position.set(90, 18, 80);
    scene.add(pinkLight);
}

/* ============================================================
   11. MATERIAL HELPERS
============================================================ */

function createMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.8,
        metalness: options.metalness ?? 0.15,
        emissive: options.emissive ?? 0x000000,
        emissiveIntensity: options.emissiveIntensity ?? 0
    });
}

function createNeonMaterial(color, intensity = 2) {
    return new THREE.MeshBasicMaterial({
        color,
        toneMapped: false
    });
}

/* ============================================================
   12. GROUND
============================================================ */

function createGround() {
    groundMaterial = createMaterial(0x11172b, {
        roughness: 0.95,
        metalness: 0.05
    });

    const groundGeometry = new THREE.PlaneGeometry(
        CONFIG.worldSize,
        CONFIG.worldSize
    );

    const ground = new THREE.Mesh(
        groundGeometry,
        groundMaterial
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = !isMobileDevice();

    worldGroup.add(ground);

    // Large city floor
    const floorGrid = new THREE.GridHelper(
        CONFIG.worldSize,
        62,
        0x123b60,
        0x111d35
    );

    floorGrid.position.y = 0.01;
    floorGrid.material.transparent = true;
    floorGrid.material.opacity = 0.12;
    worldGroup.add(floorGrid);
}

/* ============================================================
   13. ROAD SYSTEM
============================================================ */

function createRoads() {
    const roadMaterial = createMaterial(0x151b2c, {
        roughness: 0.9,
        metalness: 0.1
    });

    const lineMaterial = createNeonMaterial(0x315477);

    const roadGeometry = new THREE.BoxGeometry(
        CONFIG.roadWidth,
        0.08,
        CONFIG.worldSize
    );

    const horizontalGeometry = new THREE.BoxGeometry(
        CONFIG.worldSize,
        0.08,
        CONFIG.roadWidth
    );

    const count = Math.floor(
        CONFIG.worldSize / CONFIG.roadSpacing
    );

    for (let i = -count / 2; i <= count / 2; i++) {
        const coordinate = i * CONFIG.roadSpacing;

        const verticalRoad = new THREE.Mesh(
            roadGeometry,
            roadMaterial
        );
        verticalRoad.position.set(coordinate, 0.01, 0);
        worldGroup.add(verticalRoad);

        const horizontalRoad = new THREE.Mesh(
            horizontalGeometry,
            roadMaterial
        );
        horizontalRoad.position.set(0, 0.01, coordinate);
        worldGroup.add(horizontalRoad);

        // Road edge lines
        for (const side of [-1, 1]) {
            const edge = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.04, CONFIG.worldSize),
                lineMaterial
            );
            edge.position.set(
                coordinate + side * (CONFIG.roadWidth / 2),
                0.08,
                0
            );
            worldGroup.add(edge);

            const edge2 = new THREE.Mesh(
                new THREE.BoxGeometry(CONFIG.worldSize, 0.04, 0.12),
                lineMaterial
            );
            edge2.position.set(
                0,
                0.08,
                coordinate + side * (CONFIG.roadWidth / 2)
            );
            worldGroup.add(edge2);
        }
    }

    // Road lane markings
    const laneMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b9cb6,
        transparent: true,
        opacity: 0.32
    });

    for (let i = -4; i <= 4; i++) {
        const coordinate = i * CONFIG.roadSpacing;

        for (let z = -250; z <= 250; z += 18) {
            const dash = new THREE.Mesh(
                new THREE.BoxGeometry(0.13, 0.03, 6),
                laneMaterial
            );
            dash.position.set(coordinate, 0.07, z);
            worldGroup.add(dash);

            const dash2 = new THREE.Mesh(
                new THREE.BoxGeometry(6, 0.03, 0.13),
                laneMaterial
            );
            dash2.position.set(z, 0.07, coordinate);
            worldGroup.add(dash2);
        }
    }
}

/* ============================================================
   14. BUILDING GENERATION
============================================================ */

function createBuilding(x, z, width, depth, height, color) {
    const material = createMaterial(color, {
        roughness: 0.76,
        metalness: 0.22
    });

    const geometry = new THREE.BoxGeometry(width, height, depth);

    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);

    building.castShadow = !isMobileDevice();
    building.receiveShadow = !isMobileDevice();

    worldGroup.add(building);
    cityBuildings.push(building);

    collisionObjects.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
    });

    // Roof decoration
    const roofMaterial = createMaterial(0x1c2842, { metalness: 0.5 });
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.9, 0.5, depth * 0.9),
        roofMaterial
    );
    roof.position.set(x, height + 0.15, z);
    worldGroup.add(roof);

    // Neon facade strips
    const neonColors = [0x00dfff, 0x9b5cff, 0xff3cac, 0x00ffb3];
    const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    const neonMaterial = createNeonMaterial(neonColor);

    const stripCount = 2;
    for (let i = 0; i < stripCount; i++) {
        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, height * 0.78, 0.12),
            neonMaterial
        );
        strip.position.set(
            x - width / 2 + 1.2 + i * 2.2,
            height / 2,
            z - depth / 2 - 0.08
        );
        worldGroup.add(strip);
    }

    // Small rooftop antenna
    if (height > 18) {
        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 4, 6),
            neonMaterial
        );
        antenna.position.set(x, height + 2, z);
        worldGroup.add(antenna);
    }
}

/* ============================================================
   15. CITY GENERATION
============================================================ */

function createCity() {
    const buildingColors = [
        0x151b30, 0x1a1c36, 0x20223b,
        0x121a2c, 0x1c2037, 0x25243e
    ];

    for (let gx = -4; gx < 4; gx++) {
        for (let gz = -4; gz < 4; gz++) {
            const centerX = gx * CONFIG.roadSpacing;
            const centerZ = gz * CONFIG.roadSpacing;

            // Leave the central starting area relatively open
            const isStartingArea = Math.abs(centerX) < 35 && Math.abs(centerZ) < 35;
            if (isStartingArea) continue;

            const buildingCount = 1 + Math.floor(Math.random() * 3);

            for (let b = 0; b < buildingCount; b++) {
                const width = randomRange(12, 22);
                const depth = randomRange(12, 22);
                const height = randomRange(15, 65);

                const offsetX = randomRange(-15, 15);
                const offsetZ = randomRange(-15, 15);

                const x = centerX + offsetX;
                const z = centerZ + offsetZ;
                const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

                createBuilding(x, z, width, depth, height, color);
            }
        }
    }
}

/* ============================================================
   16. STREET LIGHTS
============================================================ */

function createStreetLight(x, z) {
    const group = new THREE.Group();

    const poleMaterial = createMaterial(0x313a56, {
        metalness: 0.75,
        roughness: 0.3
    });

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 7, 8),
        poleMaterial
    );
    pole.position.y = 3.5;
    group.add(pole);

    const arm = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.14, 0.14),
        poleMaterial
    );
    arm.position.set(0.9, 6.8, 0);
    group.add(arm);

    const lampMaterial = createNeonMaterial(0x00eaff);
    const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.18, 0.5),
        lampMaterial
    );
    lamp.position.set(1.8, 6.65, 0);
    group.add(lamp);

    group.position.set(x, 0, z);
    worldGroup.add(group);
    streetLights.push(group);
}

function createStreetLightNetwork() {
    for (let x = -245; x <= 245; x += 70) {
        for (let z = -245; z <= 245; z += 70) {
            if (Math.random() > 0.55) {
                createStreetLight(x + 12, z + 12);
            }
        }
    }
}
/* ============================================================
   NEON CITY - PART 3/7
   17. Player Creation | 18. Vehicle Creation | 19. Mission System
============================================================ */

/* ============================================================
   17. PLAYER CREATION
============================================================ */

function createPlayer() {
    player = new THREE.Group();

    playerMaterial = createMaterial(0x172b55, {
        roughness: 0.65,
        metalness: 0.25,
        emissive: 0x031b35,
        emissiveIntensity: 0.3
    });

    const bodyGeometry = new THREE.CylinderGeometry(0.48, 0.55, 1.35, 12);
    playerBody = new THREE.Mesh(bodyGeometry, playerMaterial);
    playerBody.position.y = 1.05;
    playerBody.castShadow = !isMobileDevice();
    player.add(playerBody);

    // Head
    const headMaterial = createMaterial(0xffc59f, { roughness: 0.85 });
    playerHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 12, 10),
        headMaterial
    );
    playerHead.position.y = 2.0;
    playerHead.castShadow = !isMobileDevice();
    player.add(playerHead);

    // Neon chest strip
    const chestStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.13, 0.1),
        createNeonMaterial(0x00eaff)
    );
    chestStrip.position.set(0, 1.2, -0.45);
    player.add(chestStrip);

    // Legs
    const legMaterial = createMaterial(0x11172d);
    const legGeometry = new THREE.BoxGeometry(0.25, 0.65, 0.3);

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.22, 0.35, 0);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.22, 0.35, 0);

    player.add(leftLeg, rightLeg);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.22, 0.85, 0.25);

    const leftArm = new THREE.Mesh(armGeometry, playerMaterial);
    leftArm.position.set(-0.62, 1.0, 0);

    const rightArm = new THREE.Mesh(armGeometry, playerMaterial);
    rightArm.position.set(0.62, 1.0, 0);

    player.add(leftArm, rightArm);

    // Shadow
    const shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.25
    });

    playerShadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.75, 16),
        shadowMaterial
    );
    playerShadow.rotation.x = -Math.PI / 2;
    playerShadow.position.y = 0.035;
    player.add(playerShadow);

    player.position.set(0, 0, 0);
    scene.add(player);
}

/* ============================================================
   18. VEHICLE CREATION
============================================================ */

function createVehicle() {
    car = new THREE.Group();

    carMaterial = createMaterial(0x182b55, {
        roughness: 0.35,
        metalness: 0.65,
        emissive: 0x06142d,
        emissiveIntensity: 0.25
    });

    // Main body
    carBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.75, 4.2),
        carMaterial
    );
    carBody.position.y = 0.85;
    carBody.castShadow = !isMobileDevice();
    car.add(carBody);

    // Cabin
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.75, 2.0),
        createMaterial(0x14213d, { metalness: 0.6, roughness: 0.2 })
    );
    cabin.position.set(0, 1.5, -0.25);
    car.add(cabin);

    // Windshield
    const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 0.48, 0.06),
        new THREE.MeshBasicMaterial({
            color: 0x0a8ba9,
            transparent: true,
            opacity: 0.65
        })
    );
    glass.position.set(0, 1.53, -1.27);
    car.add(glass);

    // Headlights
    const headlightMaterial = createNeonMaterial(0x00eaff);
    for (const x of [-0.72, 0.72]) {
        const headlight = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.17, 0.08),
            headlightMaterial
        );
        headlight.position.set(x, 0.95, -2.13);
        car.add(headlight);
    }

    // Rear lights
    const rearMaterial = createNeonMaterial(0xff174d);
    for (const x of [-0.72, 0.72]) {
        const rearLight = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.16, 0.08),
            rearMaterial
        );
        rearLight.position.set(x, 0.95, 2.13);
        car.add(rearLight);
    }

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12);
    const wheelMaterial = createMaterial(0x080b13, { roughness: 0.95 });

    const wheelPositions = [
        [-1.08, 0.45, -1.35],
        [1.08, 0.45, -1.35],
        [-1.08, 0.45, 1.35],
        [1.08, 0.45, 1.35]
    ];

    vehicleWheels = [];
    wheelPositions.forEach((position) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(position[0], position[1], position[2]);
        car.add(wheel);
        vehicleWheels.push(wheel);
    });

    car.position.set(4, 0, 7);
    scene.add(car);
}

/* ============================================================
   19. MISSION SYSTEM
============================================================ */

const missions = [
    {
        title: "EXPLORE THE CITY",
        description: "Reach the glowing checkpoint to discover your first destination.",
        x: 105,
        z: -70,
        reward: 500
    },
    {
        title: "NEON DISTRICT",
        description: "Travel to the next checkpoint and explore the neon district.",
        x: -105,
        z: -140,
        reward: 750
    },
    {
        title: "CITY EXPLORER",
        description: "Discover the heart of the city. Your next adventure awaits.",
        x: 175,
        z: 105,
        reward: 1000
    }
];

function createMissionMarker() {
    missionMarker = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.12, 24),
        new THREE.MeshBasicMaterial({
            color: 0x00eaff,
            transparent: true,
            opacity: 0.3
        })
    );
    base.position.y = 0.1;
    missionMarker.add(base);

    missionRing = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.12, 8, 32),
        createNeonMaterial(0x00f5ff)
    );
    missionRing.rotation.x = Math.PI / 2;
    missionRing.position.y = 0.25;
    missionMarker.add(missionRing);

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.3, 7, 8, 1, true),
        new THREE.MeshBasicMaterial({
            color: 0x00eaff,
            transparent: true,
            opacity: 0.16,
            side: THREE.DoubleSide
        })
    );
    beam.position.y = 3.7;
    missionMarker.add(beam);

    const top = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.65),
        createNeonMaterial(0x00eaff)
    );
    top.position.y = 7.3;
    missionMarker.add(top);

    missionMarker.userData.top = top;
    scene.add(missionMarker);

    updateMission();
}

function updateMission() {
    if (!missions.length) return;

    if (state.missionIndex >= missions.length) {
        state.missionIndex = 0;
    }

    const mission = missions[state.missionIndex];

    missionMarker.position.set(mission.x, 0, mission.z);
    missionTitle.textContent = mission.title;
    missionDescription.textContent = mission.description;

    state.missionCompleted = false;
}

function completeMission() {
    if (state.missionCompleted) return;

    const mission = missions[state.missionIndex];
    state.missionCompleted = true;
    state.money += mission.reward;

    updateMoney();
    showNotification("MISSION COMPLETE! Reward: $" + mission.reward, 3500);

    if (gameOverTitle) {
        gameOverTitle.textContent = "MISSION COMPLETE";
    }

    if (gameOverDescription) {
        gameOverDescription.textContent =
            "You earned $" + mission.reward + ". Keep exploring the city!";
    }

    state.missionIndex++;

    if (state.missionIndex >= missions.length) {
        state.missionIndex = 0;
    }

    setTimeout(() => {
        updateMission();
    }, 1200);
}
/* ============================================================
   NEON CITY - PART 4/7
   20. Collision System | 21. Player Movement | 22. Player Animation
   23. Jumping | 24. Vehicle System | 25. Interaction System
============================================================ */

/* ============================================================
   20. COLLISION SYSTEM
============================================================ */

function collidesWithBuilding(x, z, radius = 0.8) {
    for (const building of collisionObjects) {
        if (
            x + radius > building.minX &&
            x - radius < building.maxX &&
            z + radius > building.minZ &&
            z - radius < building.maxZ
        ) {
            return true;
        }
    }
    return false;
}

function keepInsideWorld(position) {
    const limit = CONFIG.worldSize / 2 - 8;
    position.x = clamp(position.x, -limit, limit);
    position.z = clamp(position.z, -limit, limit);
}

/* ============================================================
   21. PLAYER MOVEMENT
============================================================ */

function getMovementInput() {
    let x = state.joystickX;
    let y = state.joystickY;

    if (input.left) x -= 1;
    if (input.right) x += 1;
    if (input.forward) y += 1;
    if (input.backward) y -= 1;

    x = clamp(x, -1, 1);
    y = clamp(y, -1, 1);

    const length = Math.sqrt(x * x + y * y);
    if (length > 1) {
        x /= length;
        y /= length;
    }

    return { x, y };
}

function movePlayer(delta) {
    if (!player || state.inVehicle) return;

    const movement = getMovementInput();
    const x = movement.x;
    const y = movement.y;

    const moving = Math.abs(x) > 0.05 || Math.abs(y) > 0.05;
    state.moving = moving;

    const wantsToRun = input.run && moving && state.stamina > 0;
    state.running = wantsToRun;

    let speed = wantsToRun ? CONFIG.runSpeed : CONFIG.playerSpeed;

    if (wantsToRun) {
        state.stamina -= 24 * delta;
    } else {
        state.stamina += 13 * delta;
    }

    state.stamina = clamp(state.stamina, 0, 100);

    const forward = new THREE.Vector3(
        -Math.sin(state.cameraYaw),
        0,
        -Math.cos(state.cameraYaw)
    );

    const right = new THREE.Vector3(
        Math.cos(state.cameraYaw),
        0,
        -Math.sin(state.cameraYaw)
    );

    const direction = new THREE.Vector3();
    direction.addScaledVector(right, x);
    direction.addScaledVector(forward, y);

    if (direction.lengthSq() > 0) {
        direction.normalize();

        const nextX = player.position.x + direction.x * speed * delta;
        const nextZ = player.position.z + direction.z * speed * delta;

        if (!collidesWithBuilding(nextX, player.position.z)) {
            player.position.x = nextX;
        }

        if (!collidesWithBuilding(player.position.x, nextZ)) {
            player.position.z = nextZ;
        }

        keepInsideWorld(player.position);

        const targetRotation = Math.atan2(-direction.x, -direction.z);

        player.rotation.y = lerpAngle(
            player.rotation.y,
            targetRotation,
            Math.min(1, delta * 12)
        );
    }

    animatePlayer(delta);
}

function lerpAngle(a, b, t) {
    let difference = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
    return a + difference * t;
}

/* ============================================================
   22. PLAYER ANIMATION
============================================================ */

function animatePlayer(delta) {
    if (!player) return;

    if (state.moving && !state.inVehicle) {
        const frequency = state.running ? 12 : 8;
        const bob = Math.sin(state.elapsedTime * frequency) * 0.035;

        playerBody.position.y = 1.05 + bob;
        playerHead.position.y = 2.0 + bob;
    } else {
        playerBody.position.y = lerp(playerBody.position.y, 1.05, delta * 8);
        playerHead.position.y = lerp(playerHead.position.y, 2.0, delta * 8);
    }

    // Jumping
    if (state.jumping) {
        state.verticalVelocity -= 20 * delta;
        state.jumpHeight += state.verticalVelocity * delta;

        if (state.jumpHeight <= 0) {
            state.jumpHeight = 0;
            state.verticalVelocity = 0;
            state.jumping = false;
        }

        player.position.y = state.jumpHeight;
    }
}

/* ============================================================
   23. JUMPING
============================================================ */

function jump() {
    if (
        state.paused ||
        !state.started ||
        state.inVehicle ||
        state.jumping
    ) return;

    state.jumping = true;
    state.verticalVelocity = 8.5;
}

/* ============================================================
   24. VEHICLE SYSTEM
============================================================ */

function enterVehicle() {
    if (state.inVehicle) {
        exitVehicle();
        return;
    }

    if (distanceXZ(player.position, car.position) > 5) {
        showNotification("Move closer to the vehicle first.");
        return;
    }

    state.inVehicle = true;
    player.visible = false;
    car.position.y = 0;

    showElement(vehicleControls);
    hideElement(actionControls);
    showElement(vehicleHUD);

    showNotification("Vehicle entered. Let's drive!");
}

function exitVehicle() {
    if (!state.inVehicle) return;

    state.inVehicle = false;
    player.visible = true;

    const offset = new THREE.Vector3(2.2, 0, 0);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);

    player.position.copy(car.position).add(offset);
    player.position.y = 0;

    hideElement(vehicleControls);
    showElement(actionControls);
    hideElement(vehicleHUD);

    showNotification("You exited the vehicle.");
}

function updateVehicle(delta) {
    if (!state.inVehicle || !car) return;

    const throttle = (input.accelerate ? 1 : 0) - (input.brake ? 1 : 0);
    const steering = (input.vehicleRight ? 1 : 0) - (input.vehicleLeft ? 1 : 0);

    const targetSpeed = throttle * CONFIG.vehicleSpeed;
    car.userData.speed = car.userData.speed || 0;

    car.userData.speed = lerp(car.userData.speed, targetSpeed, delta * 2.5);

    if (Math.abs(car.userData.speed) > 0.1) {
        car.rotation.y += steering * delta * 1.7 * Math.sign(car.userData.speed);
    }

    const forward = new THREE.Vector3(
        -Math.sin(car.rotation.y),
        0,
        -Math.cos(car.rotation.y)
    );

    const nextX = car.position.x + forward.x * car.userData.speed * delta;
    const nextZ = car.position.z + forward.z * car.userData.speed * delta;

    if (!collidesWithBuilding(nextX, nextZ, 1.5)) {
        car.position.x = nextX;
        car.position.z = nextZ;
    } else {
        car.userData.speed *= -0.12;
    }

    keepInsideWorld(car.position);

    // Wheel rotation
    vehicleWheels.forEach((wheel) => {
        wheel.rotation.x += car.userData.speed * delta * 0.8;
    });

    // Update speed display
    if (speedValue) {
        speedValue.textContent = String(
            Math.round(Math.abs(car.userData.speed) * 3.6)
        ).padStart(3, "0");
    }

    if (player) {
        player.position.copy(car.position);
    }
}

/* ============================================================
   25. INTERACTION SYSTEM
============================================================ */

function updateInteraction() {
    if (!state.started || state.paused) {
        hideElement(interactionMessage);
        return;
    }

    if (state.inVehicle) {
        showElement(interactionMessage);
        interactionMessage.innerHTML =
            '<span class="interaction-key">E</span>' +
            '<span>EXIT VEHICLE</span>';
        return;
    }

    const nearCar = distanceXZ(player.position, car.position) < 5;
    const mission = missions[state.missionIndex];
    const nearMission = distanceXZ(player.position, { x: mission.x, z: mission.z }) < 4;

    if (nearCar) {
        showElement(interactionMessage);
        interactionMessage.innerHTML =
            '<span class="interaction-key">E</span>' +
            '<span>ENTER VEHICLE</span>';
    } else if (nearMission) {
        showElement(interactionMessage);
        interactionMessage.innerHTML =
            '<span class="interaction-key">E</span>' +
            '<span>COMPLETE MISSION</span>';
    } else {
        hideElement(interactionMessage);
    }
}

function interact() {
    if (!state.started || state.paused) return;

    if (state.inVehicle) {
        exitVehicle();
        return;
    }

    const nearCar = distanceXZ(player.position, car.position) < 5;
    const mission = missions[state.missionIndex];
    const nearMission = distanceXZ(player.position, { x: mission.x, z: mission.z }) < 4;

    if (nearCar) {
        enterVehicle();
    } else if (nearMission) {
        completeMission();
    } else {
        showNotification("Nothing to interact with nearby.");
    }
}
/* ============================================================
   NEON CITY - PART 5/7
   26. Camera System | 27. Mobile Joystick | 28. Mobile Camera Drag
   29. Mobile Action Buttons | 30. Vehicle Steering Buttons | 31. Keyboard Controls
============================================================ */

/* ============================================================
   26. CAMERA SYSTEM
============================================================ */

function updateCamera(delta) {
    if (!camera || !player) return;

    const target = state.inVehicle ? car : player;

    const distance = state.inVehicle
        ? CONFIG.cameraDistance + 2
        : CONFIG.cameraDistance;

    const height = state.inVehicle
        ? CONFIG.cameraHeight + 0.3
        : CONFIG.cameraHeight;

    const offsetX = Math.sin(state.cameraYaw) * distance;
    const offsetZ = Math.cos(state.cameraYaw) * distance;

    const targetPosition = new THREE.Vector3(
        target.position.x + offsetX,
        target.position.y + height + state.cameraPitch * 3,
        target.position.z + offsetZ
    );

    const smooth = 1 - Math.pow(0.001, delta);
    camera.position.lerp(targetPosition, smooth);

    const lookTarget = new THREE.Vector3(
        target.position.x,
        target.position.y + (state.inVehicle ? 1.1 : 1.5),
        target.position.z
    );

    camera.lookAt(lookTarget);
}

/* ============================================================
   27. MOBILE JOYSTICK
============================================================ */

let joystickPointerId = null;

function resetJoystick() {
    state.joystickX = 0;
    state.joystickY = 0;

    if (joystickKnob) {
        joystickKnob.style.transform = "translate3d(0px, 0px, 0px)";
    }
}

function handleJoystickMove(event) {
    if (joystickPointerId !== event.pointerId) return;

    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const maxDistance = Math.min(rect.width, rect.height) * 0.29;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
    }

    state.joystickX = dx / maxDistance;
    state.joystickY = -dy / maxDistance;

    if (joystickKnob) {
        joystickKnob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
}

if (joystick) {
    joystick.addEventListener("pointerdown", (event) => {
        if (state.paused || !state.started) return;
        joystickPointerId = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        handleJoystickMove(event);
    });

    joystick.addEventListener("pointermove", handleJoystickMove);

    joystick.addEventListener("pointerup", (event) => {
        if (joystickPointerId !== event.pointerId) return;
        joystickPointerId = null;
        resetJoystick();
    });

    joystick.addEventListener("pointercancel", () => {
        joystickPointerId = null;
        resetJoystick();
    });
}

/* ============================================================
   28. MOBILE CAMERA DRAG
============================================================ */

let cameraPointerId = null;
let lastCameraX = 0;
let lastCameraY = 0;

if (cameraTouchArea) {
    cameraTouchArea.addEventListener("pointerdown", (event) => {
        if (!state.started || state.paused) return;

        cameraPointerId = event.pointerId;
        lastCameraX = event.clientX;
        lastCameraY = event.clientY;

        cameraTouchArea.setPointerCapture(event.pointerId);
    });

    cameraTouchArea.addEventListener("pointermove", (event) => {
        if (cameraPointerId !== event.pointerId) return;

        const dx = event.clientX - lastCameraX;
        const dy = event.clientY - lastCameraY;

        lastCameraX = event.clientX;
        lastCameraY = event.clientY;

        state.cameraYaw -= dx * CONFIG.cameraSensitivity;
        state.cameraPitch = clamp(
            state.cameraPitch + dy * 0.003,
            -0.25,
            0.8
        );
    });

    cameraTouchArea.addEventListener("pointerup", (event) => {
        if (cameraPointerId === event.pointerId) {
            cameraPointerId = null;
        }
    });

    cameraTouchArea.addEventListener("pointercancel", () => {
        cameraPointerId = null;
    });
}

/* ============================================================
   29. MOBILE ACTION BUTTONS
============================================================ */

function setupActionButtons() {
    document.querySelectorAll("[data-action]").forEach((button) => {
        const action = button.dataset.action;

        const press = (event) => {
            event.preventDefault();
            if (!state.started || state.paused) return;

            button.classList.add("pressed");

            switch (action) {
                case "jump":
                    jump();
                    break;
                case "interact":
                    interact();
                    break;
                case "vehicle":
                    if (state.inVehicle) {
                        exitVehicle();
                    } else {
                        enterVehicle();
                    }
                    break;
                case "run":
                    input.run = true;
                    break;
                case "accelerate":
                    input.accelerate = true;
                    break;
                case "brake":
                    input.brake = true;
                    break;
            }
        };

        const release = (event) => {
            event.preventDefault();
            button.classList.remove("pressed");

            switch (action) {
                case "run":
                    input.run = false;
                    break;
                case "accelerate":
                    input.accelerate = false;
                    break;
                case "brake":
                    input.brake = false;
                    break;
            }
        };

        button.addEventListener("pointerdown", press);
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
    });
}

/* ============================================================
   30. VEHICLE STEERING BUTTONS
============================================================ */

function setupVehicleButtons() {
    document.querySelectorAll(".drive-btn[data-key]").forEach((button) => {
        const key = button.dataset.key;

        const press = (event) => {
            event.preventDefault();
            if (!state.inVehicle) return;

            button.classList.add("pressed");

            if (key === "a") input.vehicleLeft = true;
            if (key === "d") input.vehicleRight = true;
        };

        const release = (event) => {
            event.preventDefault();
            button.classList.remove("pressed");

            if (key === "a") input.vehicleLeft = false;
            if (key === "d") input.vehicleRight = false;
        };

        button.addEventListener("pointerdown", press);
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("lostpointercapture", release);
    });
}

/* ============================================================
   31. KEYBOARD CONTROLS
============================================================ */

function setKey(key, pressed) {
    switch (key.toLowerCase()) {
        case "w":
        case "arrowup":
            input.forward = pressed;
            break;
        case "s":
        case "arrowdown":
            input.backward = pressed;
            break;
        case "a":
        case "arrowleft":
            if (state.inVehicle) {
                input.vehicleLeft = pressed;
            } else {
                input.left = pressed;
            }
            break;
        case "d":
        case "arrowright":
            if (state.inVehicle) {
                input.vehicleRight = pressed;
            } else {
                input.right = pressed;
            }
            break;
        case "shift":
            input.run = pressed;
            break;
        case " ":
            if (pressed) jump();
            break;
        case "e":
            if (pressed) interact();
            break;
        case "escape":
            if (pressed) togglePause();
            break;
        case "enter":
            if (pressed && !state.started) startGame();
            break;
        case "f":
            if (pressed) {
                if (state.inVehicle) {
                    exitVehicle();
                } else {
                    enterVehicle();
                }
            }
            break;
    }
}

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === " " || key.startsWith("arrow")) {
        event.preventDefault();
    }
    if (!event.repeat) {
        setKey(key, true);
    }
});

window.addEventListener("keyup", (event) => {
    setKey(event.key, false);
});

window.addEventListener("blur", () => {
    resetAllInputs();
});

function resetAllInputs() {
    Object.keys(input).forEach((key) => {
        input[key] = false;
    });
    resetJoystick();
}
/* ============================================================
   NEON CITY - PART 6/7
   32. Pause System | 33. Menu System | 34. Menu Button Events
   35. Health, Stamina & Money | 36. Game Clock | 37. Location System
   38. Minimap
============================================================ */

/* ============================================================
   32. PAUSE SYSTEM
============================================================ */

function togglePause() {
    if (!state.started || state.gameOver) return;

    state.paused = !state.paused;

    if (state.paused) {
        showElement(pauseMenu);
        resetAllInputs();
    } else {
        hideElement(pauseMenu);
        clock.getDelta();
    }
}

function pauseGame() {
    if (!state.started || state.paused) return;
    togglePause();
}

function resumeGame() {
    state.paused = false;
    hideElement(pauseMenu);
    if (clock) clock.getDelta();
}

/* ============================================================
   33. MENU SYSTEM
============================================================ */

function startGame() {
    if (state.started && !state.paused) return;

    state.started = true;
    state.running = true;
    state.paused = false;
    state.gameOver = false;

    hideElement(mainMenu);
    hideElement(pauseMenu);
    hideElement(controlsPanel);
    hideElement(aboutPanel);
    hideElement(gameOverPanel);

    showElement(mobileControls);

    if (pauseBtn) {
        pauseBtn.style.display = "grid";
    }

    if (clock) {
        clock.getDelta();
    }

    showNotification("Welcome to NEON CITY. Explore freely!");
    updateInteraction();
}

function restartGame() {
    state.inVehicle = false;
    state.playerHealth = 100;
    state.stamina = 100;
    state.money = 2500;
    state.missionIndex = 0;
    state.missionCompleted = false;
    state.gameMinutes = 20 * 60;
    state.cameraYaw = 0;
    state.cameraPitch = 0.22;
    state.jumpHeight = 0;
    state.jumping = false;

    player.position.set(0, 0, 0);
    player.visible = true;

    car.position.set(4, 0, 7);
    car.rotation.set(0, 0, 0);
    car.userData.speed = 0;

    state.started = true;
    state.paused = false;
    state.gameOver = false;

    hideElement(pauseMenu);
    hideElement(gameOverPanel);
    hideElement(mainMenu);

    showElement(actionControls);
    hideElement(vehicleControls);
    hideElement(vehicleHUD);

    resetAllInputs();

    updateMission();
    updateMoney();
    updateHealth();
    updateStamina();
    updateClock();

    showNotification("Game restarted!");
}

function returnToMainMenu() {
    state.started = false;
    state.paused = false;
    state.inVehicle = false;

    player.visible = true;

    hideElement(pauseMenu);
    hideElement(gameOverPanel);
    hideElement(vehicleControls);
    hideElement(vehicleHUD);

    showElement(actionControls);
    showElement(mainMenu);

    resetAllInputs();
}

/* ============================================================
   34. MENU BUTTON EVENTS
============================================================ */

if (startGameBtn) startGameBtn.addEventListener("click", startGame);
if (pauseBtn) pauseBtn.addEventListener("click", pauseGame);
if (resumeBtn) resumeBtn.addEventListener("click", resumeGame);
if (restartBtn) restartBtn.addEventListener("click", restartGame);
if (mainMenuBtn) mainMenuBtn.addEventListener("click", returnToMainMenu);

if (controlsBtn) {
    controlsBtn.addEventListener("click", () => showElement(controlsPanel));
}

if (aboutBtn) {
    aboutBtn.addEventListener("click", () => showElement(aboutPanel));
}

document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
        const target = $(button.dataset.close);
        hideElement(target);
    });
});

if (playAgainBtn) playAgainBtn.addEventListener("click", restartGame);

/* ============================================================
   35. HEALTH, STAMINA AND MONEY
============================================================ */

function updateHealth() {
    state.playerHealth = clamp(state.playerHealth, 0, 100);

    if (healthBar) healthBar.style.width = state.playerHealth + "%";
    if (healthValue) healthValue.textContent = Math.round(state.playerHealth) + "%";
}

function updateStamina() {
    state.stamina = clamp(state.stamina, 0, 100);

    if (staminaBar) staminaBar.style.width = state.stamina + "%";
    if (staminaValue) staminaValue.textContent = Math.round(state.stamina) + "%";
}

function updateMoney() {
    if (playerMoney) {
        playerMoney.textContent = "$" + state.money.toLocaleString("en-US");
    }
}

/* ============================================================
   36. GAME CLOCK
============================================================ */

function updateClock() {
    const hours = Math.floor(state.gameMinutes / 60) % 24;
    const minutes = Math.floor(state.gameMinutes % 60);

    const period = hours >= 12 ? "PM" : "AM";
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    const timeString =
        String(displayHours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        " " +
        period;

    if (gameTime) gameTime.textContent = timeString;
}

/* ============================================================
   37. LOCATION SYSTEM
============================================================ */

function updateLocation() {
    const x = player.position.x;
    const z = player.position.z;

    let location = "NEON DISTRICT";

    if (x > 100 && z < -50) {
        location = "CYBER PLAZA";
    } else if (x < -80 && z < -80) {
        location = "NIGHT MARKET";
    } else if (x > 100 && z > 80) {
        location = "DOWNTOWN";
    } else if (x < -100 && z > 80) {
        location = "INDUSTRIAL ZONE";
    } else if (Math.abs(x) < 30 && Math.abs(z) < 30) {
        location = "CITY CENTER";
    }

    state.currentLocation = location;

    if (locationName) locationName.textContent = location;
}

/* ============================================================
   38. MINIMAP
============================================================ */

function drawMinimap() {
    if (!minimapContext || !minimap) return;

    const ctx = minimapContext;
    const width = minimap.width;
    const height = minimap.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#091226";
    ctx.fillRect(0, 0, width, height);

    const scale = 0.30;
    const centerX = width / 2;
    const centerY = height / 2;

    // Grid roads
    ctx.strokeStyle = "rgba(90, 132, 175, 0.42)";
    ctx.lineWidth = 5;

    for (let i = -4; i <= 4; i++) {
        const offset = i * CONFIG.roadSpacing * scale;

        ctx.beginPath();
        ctx.moveTo(centerX + offset, 0);
        ctx.lineTo(centerX + offset, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, centerY + offset);
        ctx.lineTo(width, centerY + offset);
        ctx.stroke();
    }

    // Player-relative building markers
    ctx.fillStyle = "rgba(44, 70, 112, 0.75)";

    for (const building of cityBuildings) {
        const x = centerX + (building.position.x - player.position.x) * scale;
        const y = centerY + (building.position.z - player.position.z) * scale;

        if (x > 0 && x < width && y > 0 && y < height) {
            ctx.fillRect(x - 2, y - 2, 4, 4);
        }
    }

    // Mission marker
    const mission = missions[state.missionIndex];
    const missionX = centerX + (mission.x - player.position.x) * scale;
    const missionY = centerY + (mission.z - player.position.z) * scale;

    if (missionX > 0 && missionX < width && missionY > 0 && missionY < height) {
        ctx.beginPath();
        ctx.arc(missionX, missionY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#00f5ff";
        ctx.shadowColor = "#00f5ff";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Vehicle marker
    if (car) {
        const carX = centerX + (car.position.x - player.position.x) * scale;
        const carY = centerY + (car.position.z - player.position.z) * scale;

        if (carX > 0 && carX < width && carY > 0 && carY < height) {
            ctx.fillStyle = "#ff3cac";
            ctx.fillRect(carX - 3, carY - 3, 6, 6);
        }
    }

    // Player marker
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(player.rotation.y);

    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-6, 6);
    ctx.lineTo(6, 6);
    ctx.closePath();

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00f5ff";
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.restore();
}
/* ============================================================
   NEON CITY - PART 7/7
   39. Mission Animations | 40. Environment Animations | 41. Game Update
   42. Render Loop | 43. Responsive Resizing | 44. Mobile Fullscreen
   45. Visibility | 46. Performance Cleanup | 47. World Init | 48. Boot Engine
============================================================ */

/* ============================================================
   39. MISSION MARKER ANIMATION
============================================================ */

function animateMissionMarker() {
    if (!missionMarker) return;

    missionMarker.rotation.y += 0.006;
    const pulse = 1 + Math.sin(state.elapsedTime * 3) * 0.08;

    missionRing.scale.set(pulse, pulse, pulse);

    if (missionMarker.userData.top) {
        missionMarker.userData.top.rotation.y += 0.025;
        missionMarker.userData.top.rotation.x += 0.008;
    }
}

/* ============================================================
   40. ENVIRONMENT ANIMATION
============================================================ */

function animateEnvironment(delta) {
    const pulse = 1 + Math.sin(state.elapsedTime * 2) * 0.05;

    if (missionMarker) {
        missionMarker.scale.setScalar(pulse);
    }
}

/* ============================================================
   41. GAME UPDATE
============================================================ */

function updateGame(delta) {
    if (!state.started || state.paused || state.gameOver) return;

    state.elapsedTime += delta;
    state.gameMinutes += delta * 3;

    updateClock();

    if (state.inVehicle) {
        updateVehicle(delta);
    } else {
        movePlayer(delta);
    }

    updateCamera(delta);
    updateInteraction();
    updateLocation();
    animateMissionMarker();
    animateEnvironment(delta);
    updateStamina();
    updateHealth();
    drawMinimap();
}

/* ============================================================
   42. RENDER LOOP
============================================================ */

function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop);

    if (!renderer || !scene || !camera) return;

    const rawDelta = clock.getDelta();
    const delta = Math.min(rawDelta, 0.04);

    state.deltaTime = delta;

    if (state.started && !state.paused) {
        updateGame(delta);
    } else if (player) {
        updateCamera(delta);
    }

    renderer.render(scene, camera);
}

/* ============================================================
   43. RESPONSIVE RESIZING
============================================================ */

function handleResize() {
    if (!camera || !renderer) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);

    const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        isMobileDevice()
            ? CONFIG.mobilePixelRatio
            : CONFIG.maxPixelRatio
    );

    renderer.setPixelRatio(pixelRatio);
}

window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", () => {
    setTimeout(handleResize, 250);
});

/* ============================================================
   44. MOBILE FULLSCREEN SUPPORT
============================================================ */

async function requestGameFullscreen() {
    try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        }
    } catch (error) {
        console.log("Fullscreen request unavailable:", error);
    }

    try {
        if (screen.orientation?.lock) {
            await screen.orientation.lock("landscape");
        }
    } catch (error) {
        console.log("Landscape lock unavailable:", error);
    }
}

/* ============================================================
   45. VISIBILITY HANDLING
============================================================ */

document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.started && !state.paused) {
        pauseGame();
    }
});

/* ============================================================
   46. PERFORMANCE CLEANUP
============================================================ */

function cleanupGame() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
    }

    if (renderer) {
        renderer.dispose();
    }

    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((mat) => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

window.addEventListener("beforeunload", cleanupGame);

/* ============================================================
   47. INITIALIZE WORLD
============================================================ */

async function initializeGame() {
    try {
        updateLoading(5, "INITIALIZING GAME ENGINE...");
        initializeEngine();

        updateLoading(15, "CREATING CITY ENVIRONMENT...");
        createGround();
        createRoads();

        updateLoading(30, "GENERATING BUILDINGS...");
        createCity();

        updateLoading(50, "INSTALLING STREET LIGHTS...");
        createStreetLightNetwork();

        updateLoading(65, "CREATING PLAYER...");
        createPlayer();

        updateLoading(75, "PREPARING VEHICLES...");
        createVehicle();

        updateLoading(85, "SETTING UP MISSIONS...");
        createMissionMarker();

        updateLoading(90, "CONFIGURING MOBILE CONTROLS...");
        setupActionButtons();
        setupVehicleButtons();

        updateLoading(95, "FINALIZING GAME...");
        updateMoney();
        updateHealth();
        updateStamina();
        updateClock();

        handleResize();
        clock.getDelta();
        gameLoop();

        updateLoading(100, "WELCOME TO NEON CITY");
        finishLoading();
    } catch (error) {
        console.error("NEON CITY initialization error:", error);
        updateLoading(100, "GAME INITIALIZATION FAILED");
        showNotification("Game failed to initialize. Check the browser console.", 6000);
    }
}

/* ============================================================
   48. START THE GAME ENGINE
============================================================ */

initializeGame();

/* ============================================================
   END OF NEON CITY GAME ENGINE
============================================================ */
