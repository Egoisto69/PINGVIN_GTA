import * as THREE from "https://unpkg.com/three@0.170.0/build/three.module.js";

const sceneRoot = document.getElementById("scene-root");
const scoreEl = document.getElementById("score");
const windowsHitEl = document.getElementById("windows-hit");
const eventsJoinedEl = document.getElementById("events-joined");
const friendCountEl = document.getElementById("friend-count");
const appleAmmoEl = document.getElementById("apple-ammo");
const bazookaAmmoEl = document.getElementById("bazooka-ammo");
const statusLineEl = document.getElementById("status-line");
const studyRiskEl = document.getElementById("study-risk");
const drunkMeterEl = document.getElementById("drunk-meter");
const friendListEl = document.getElementById("friend-list");
const taskBoardEl = document.getElementById("task-board");
const discountStatusEl = document.getElementById("discount-status");
const weaponLabelEl = document.getElementById("weapon-label");
const eventPopupEl = document.getElementById("event-popup");
const popupTitleEl = document.getElementById("popup-title");
const popupLocationEl = document.getElementById("popup-location");
const popupVibeEl = document.getElementById("popup-vibe");
const popupDiscountEl = document.getElementById("popup-discount");
const joinEventButton = document.getElementById("join-event");
const closePopupButton = document.getElementById("close-popup");
const inviteFriendButton = document.getElementById("invite-friend");
const studyButton = document.getElementById("study-button");
const studyPopupEl = document.getElementById("study-popup");
const studyTitleEl = document.getElementById("study-title");
const studyQuestionEl = document.getElementById("study-question");
const studyAnswerEl = document.getElementById("study-answer");
const submitStudyAnswerButton = document.getElementById("submit-study-answer");
const closeStudyPopupButton = document.getElementById("close-study-popup");
const toggleHudButton = document.getElementById("toggle-hud");

const state = {
  score: 0,
  windowsBroken: 0,
  eventsJoined: 0,
  friends: ["You"],
  apples: 6,
  bazookas: 2,
  drunk: 0,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  sprint: false,
  currentWeapon: "Apple",
  pendingEvent: null,
  assignmentsDone: 0,
  missedEvents: 0,
  canShootAt: 0,
  aimYaw: 0,
  walkCycle: 0,
  activeStudyTask: null,
  batSwing: 0
};

const events = [
  { city: "Helsinki", uni: "University of Helsinki", title: "Midnight Sauna Mixer", vibe: "Half networking, half steam-powered oversharing.", discount: "15% off the next student brunch" },
  { city: "Espoo", uni: "Aalto University", title: "Prototype Meltdown Night", vibe: "Everyone is stressed, but in a collaborative way.", discount: "20% off hackathon tickets" },
  { city: "Vantaa", uni: "Laurea", title: "Career Karaoke Disaster", vibe: "LinkedIn energy with worse singing.", discount: "10% off event passes" },
  { city: "Helsinki", uni: "Metropolia", title: "Game Jam Pizza Summit", vibe: "Make games, make friends, eat suspiciously free slices.", discount: "25% off future jam entry" },
  { city: "Espoo", uni: "Haaga-Helia Friends Night", title: "Student Meetup Speedrun", vibe: "Meet people before social battery goes offline.", discount: "12% off student merch" }
];

const tasks = [
  {
    title: "Hidden Files",
    question: "Type a Linux command that lists hidden files in the current folder.",
    answers: ["ls -a", "ls -la", "ls -al"],
    reward: "3 apples"
  },
  {
    title: "Where Am I",
    question: "Type the Linux command that prints the current directory.",
    answers: ["pwd"],
    reward: "1 bat hit and 1 apple"
  },
  {
    title: "Go Home",
    question: "Type a Linux command that changes into the home directory.",
    answers: ["cd ~", "cd $home", "cd /home", "cd"],
    reward: "2 apples"
  },
  {
    title: "Show Files",
    question: "Type a Linux command that lists files in the current directory.",
    answers: ["ls"],
    reward: "2 apples"
  }
];

const possibleFriends = ["Aino", "Mikko", "Sara", "Oskari", "Veera", "Linus"];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9edcff);
scene.fog = new THREE.Fog(0x9edcff, 42, 110);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 250);
camera.position.set(0, 12, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneRoot.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdaf4ff, 0x7cc46d, 2.2));

const sun = new THREE.DirectionalLight(0xfff1b0, 3.1);
sun.position.set(18, 26, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
scene.add(sun);

const ambientNeon = new THREE.PointLight(0xffd77a, 8, 45, 2);
ambientNeon.position.set(-18, 12, 16);
scene.add(ambientNeon);

const sunDisc = new THREE.Mesh(
  new THREE.SphereGeometry(4.6, 20, 20),
  new THREE.MeshBasicMaterial({ color: 0xfff2a8 })
);
sunDisc.position.set(34, 38, -48);
scene.add(sunDisc);

const cityGroup = new THREE.Group();
const projectileGroup = new THREE.Group();
const burstGroup = new THREE.Group();
const skylineGroup = new THREE.Group();
scene.add(cityGroup, projectileGroup, burstGroup, skylineGroup);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 28),
  new THREE.MeshStandardMaterial({ color: 0x1f242b, roughness: 0.92, metalness: 0.08 })
);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

for (let i = -5; i <= 5; i += 1) {
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.3), new THREE.MeshBasicMaterial({ color: 0xffd54f }));
  lane.rotation.x = -Math.PI / 2;
  lane.position.set(i * 10, 0.02, 0);
  scene.add(lane);
}

for (const z of [-11.5, 11.5]) {
  const walk = new THREE.Mesh(
    new THREE.BoxGeometry(120, 0.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x5f6c7a, roughness: 1 })
  );
  walk.position.set(0, 0.2, z);
  walk.receiveShadow = true;
  scene.add(walk);
}

const grass = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 80),
  new THREE.MeshStandardMaterial({ color: 0x6fcf63, roughness: 1 })
);
grass.rotation.x = -Math.PI / 2;
grass.position.y = -0.01;
scene.add(grass);

function addFlowers() {
  const petalColors = [0xff6fae, 0xfff06a, 0xffffff, 0x8d7cff];
  for (let i = 0; i < 80; i += 1) {
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x2d8b45, roughness: 1 })
    );
    stem.position.y = 0.25;
    flower.add(stem);

    const petalColor = petalColors[i % petalColors.length];
    for (let p = 0; p < 5; p += 1) {
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.85 })
      );
      const angle = (p / 5) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.12, 0.52, Math.sin(angle) * 0.12);
      flower.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffc93c, roughness: 0.8 })
    );
    center.position.y = 0.52;
    flower.add(center);

    const side = i % 2 === 0 ? -1 : 1;
    flower.position.set(
      -52 + Math.random() * 104,
      0,
      side * (14 + Math.random() * 21)
    );
    flower.rotation.y = Math.random() * Math.PI;
    scene.add(flower);
  }
}

addFlowers();

function buildPenguin() {
  const penguin = new THREE.Group();
  const rig = {};

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.1, 2.2, 10, 20),
    new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.85 })
  );
  body.castShadow = true;
  body.position.y = 2.1;
  penguin.add(body);
  rig.body = body;

  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xece9e2, roughness: 0.95 })
  );
  belly.scale.set(0.8, 1.15, 0.55);
  belly.position.set(0, 1.8, 0.78);
  belly.castShadow = true;
  penguin.add(belly);
  rig.belly = belly;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.85 })
  );
  head.position.set(0, 3.85, 0.08);
  head.castShadow = true;
  penguin.add(head);
  rig.head = head;

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xf6efd7, roughness: 1 })
  );
  face.scale.set(1, 0.9, 0.65);
  face.position.set(0, 3.7, 0.52);
  penguin.add(face);

  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.75, 4),
    new THREE.MeshStandardMaterial({ color: 0xffae42, roughness: 0.9 })
  );
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 3.5, 1.05);
  beak.castShadow = true;
  penguin.add(beak);

  for (const x of [-0.26, 0.26]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eye.position.set(x, 3.95, 0.86);
    penguin.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    pupil.position.set(x, 3.93, 0.93);
    penguin.add(pupil);
  }

  for (const x of [-1.08, 1.08]) {
    const wing = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.25, 1.1, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0x0d1015, roughness: 0.9 })
    );
    wing.position.set(x, 2.2, 0.05);
    wing.rotation.z = x < 0 ? -0.48 : 0.48;
    wing.castShadow = true;
    penguin.add(wing);
    if (x < 0) {
      rig.leftWing = wing;
    } else {
      rig.rightWing = wing;
    }
  }

  rig.feet = [];
  for (const x of [-0.42, 0.42]) {
    const foot = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xff9a1f, roughness: 0.95 })
    );
    foot.scale.set(1.3, 0.45, 2.1);
    foot.position.set(x, 0.2, 0.45);
    foot.castShadow = true;
    penguin.add(foot);
    rig.feet.push(foot);
  }

  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.95, 0.35, 16),
    new THREE.MeshStandardMaterial({ color: 0xff4d6d, roughness: 0.7, metalness: 0.15 })
  );
  hat.position.set(0, 4.78, 0);
  hat.castShadow = true;
  penguin.add(hat);
  rig.hat = hat;

  const batGroup = new THREE.Group();
  batGroup.position.set(0.95, 2.4, 0.3);
  batGroup.rotation.set(0.2, 0.1, -1.1);
  const batHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 1.9, 10),
    new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.9 })
  );
  batHandle.rotation.z = Math.PI / 2;
  batHandle.castShadow = true;
  batGroup.add(batHandle);
  const batHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.14, 0.85, 12),
    new THREE.MeshStandardMaterial({ color: 0xc28d5d, roughness: 0.8 })
  );
  batHead.position.set(0.92, 0, 0);
  batHead.rotation.z = Math.PI / 2;
  batHead.castShadow = true;
  batGroup.add(batHead);
  penguin.add(batGroup);
  rig.bat = batGroup;
  penguin.userData.rig = rig;

  return penguin;
}

const penguin = buildPenguin();
penguin.scale.setScalar(1.25);
penguin.position.set(0, 0, 6);
scene.add(penguin);

const penguinMarker = new THREE.Mesh(
  new THREE.CircleGeometry(1.6, 32),
  new THREE.MeshBasicMaterial({ color: 0x2ef0ff, transparent: true, opacity: 0.4 })
);
penguinMarker.rotation.x = -Math.PI / 2;
penguinMarker.position.set(0, 0.04, 6);
scene.add(penguinMarker);

const followOffset = new THREE.Vector3(0, 11.5, 16);
const lookOffset = new THREE.Vector3(0, 2.8, -1.5);
const backgroundPenguins = [];
const cameraPadding = 1.8;

function createBackgroundPenguins() {
  const configs = [
    { x: -30, z: -20, dir: 1, speed: 2.2 },
    { x: -8, z: -24, dir: -1, speed: 1.6 },
    { x: 18, z: 23, dir: -1, speed: 1.9 },
    { x: 34, z: 20, dir: 1, speed: 2.4 },
    { x: 8, z: -22, dir: 1, speed: 1.4 }
  ];

  configs.forEach((config) => {
    const npc = buildPenguin();
    npc.scale.setScalar(0.72);
    npc.position.set(config.x, 0, config.z);
    scene.add(npc);
    backgroundPenguins.push({
      mesh: npc,
      dir: config.dir,
      speed: config.speed,
      baseZ: config.z,
      phase: Math.random() * Math.PI * 2
    });
  });
}

createBackgroundPenguins();

const buildings = [];
let eventIndex = 0;

function nextEvent() {
  const event = events[eventIndex % events.length];
  eventIndex += 1;
  return event;
}

function makeWindowPanel(building, localPosition) {
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x84dfff,
    emissive: 0x1b5d7a,
    roughness: 0.15,
    metalness: 0.65
  });
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x202733, roughness: 0.82 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.6, 0.18), frameMaterial);
  frame.position.copy(localPosition);
  frame.castShadow = true;
  building.add(frame);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.25, 0.1), glassMaterial);
  glass.position.copy(localPosition).add(new THREE.Vector3(0, 0, 0.08));
  glass.userData.windowState = {
    broken: false,
    originalColor: glassMaterial.color.clone(),
    originalEmissive: glassMaterial.emissive.clone(),
    event: nextEvent()
  };
  building.add(glass);
  return glass;
}

function createBuilding(x, z, width, height, depth, color) {
  const building = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.08 })
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  building.add(body);

  const windows = [];
  const rows = Math.max(2, Math.floor(height / 3.4));
  const cols = Math.max(2, Math.floor(width / 2.6));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const offsetX = -width / 2 + 1.4 + col * 2.3;
      const offsetY = 1.8 + row * 2.9;
      if (offsetX > width / 2 - 1.2 || offsetY > height - 1.2) {
        continue;
      }
      windows.push(makeWindowPanel(building, new THREE.Vector3(offsetX, offsetY, depth / 2 + 0.02)));
    }
  }

  building.position.set(x, 0, z);
  cityGroup.add(building);
  buildings.push({
    windows,
    bounds: {
      minX: x - width / 2 - 0.8,
      maxX: x + width / 2 + 0.8,
      minZ: z - depth / 2 - 0.8,
      maxZ: z + depth / 2 + 0.8
    }
  });
}

function addSkyline() {
  const skylineData = [
    { x: -52, z: -36, w: 10, h: 28, d: 9, color: 0x8fb3d9 },
    { x: -39, z: -40, w: 12, h: 34, d: 10, color: 0xa6bfd8 },
    { x: -24, z: -38, w: 14, h: 30, d: 9, color: 0x93a8c4 },
    { x: -8, z: -42, w: 11, h: 36, d: 10, color: 0x9eb8d4 },
    { x: 8, z: -39, w: 13, h: 32, d: 10, color: 0x89a9cc },
    { x: 24, z: -41, w: 12, h: 38, d: 10, color: 0x9db4d0 },
    { x: 39, z: -37, w: 14, h: 27, d: 9, color: 0x8ba4c5 },
    { x: 55, z: -40, w: 10, h: 33, d: 10, color: 0x9eb8d9 },
    { x: -50, z: 38, w: 10, h: 24, d: 8, color: 0x9fb1c6 },
    { x: -34, z: 41, w: 13, h: 29, d: 9, color: 0xb0bfd4 },
    { x: -16, z: 39, w: 12, h: 31, d: 9, color: 0x99b0c7 },
    { x: 2, z: 42, w: 11, h: 26, d: 8, color: 0xa7b8cf },
    { x: 19, z: 40, w: 14, h: 34, d: 10, color: 0x92aec9 },
    { x: 37, z: 43, w: 13, h: 28, d: 9, color: 0xaebfd6 },
    { x: 54, z: 39, w: 11, h: 30, d: 9, color: 0x95abc3 }
  ];

  skylineData.forEach((item) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(item.w, item.h, item.d),
      new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: 0.96,
        metalness: 0.02,
        transparent: true,
        opacity: 0.95
      })
    );
    mesh.position.set(item.x, item.h / 2, item.z);
    skylineGroup.add(mesh);
  });
}

createBuilding(-22, -14, 7, 14, 7, 0x5e60ce);
createBuilding(-12, -14, 9, 18, 8, 0x394867);
createBuilding(0, -14, 10, 16, 7.2, 0x1d3557);
createBuilding(14, -14, 8, 20, 8, 0x457b9d);
createBuilding(26, -14, 11, 15, 7, 0x7b2cbf);
createBuilding(39, -14, 8, 17, 8, 0x4f86c6);
createBuilding(-36, -14, 9, 15, 7, 0x6d597a);
createBuilding(-24, 14, 8, 16, 8, 0xe76f51);
createBuilding(-10, 14, 10, 21, 9, 0xdd6e42);
createBuilding(5, 14, 7, 14, 7, 0xfb8500);
createBuilding(17, 14, 9, 19, 8, 0xc1121f);
createBuilding(29, 14, 8, 13, 7, 0x9d4edd);
createBuilding(41, 14, 10, 17, 8, 0xff7b54);
createBuilding(-38, 14, 9, 18, 8, 0xf28482);
addSkyline();

const projectiles = [];
const bursts = [];
const shatters = [];
const clock = new THREE.Clock();

function updateHud() {
  scoreEl.textContent = String(state.score);
  windowsHitEl.textContent = String(state.windowsBroken);
  eventsJoinedEl.textContent = String(state.eventsJoined);
  friendCountEl.textContent = `${state.friends.length}/4`;
  appleAmmoEl.textContent = String(state.apples);
  bazookaAmmoEl.textContent = String(state.bazookas);
  studyRiskEl.textContent = state.missedEvents >= 3
    ? "Study risk: terminal judgment incoming."
    : state.missedEvents >= 1
      ? "Study risk: getting academically suspicious."
      : "Study risk: acceptable chaos.";
  drunkMeterEl.textContent = `Drunk meter: ${Math.round(state.drunk)}/100`;
  weaponLabelEl.textContent = `Current weapon: ${state.currentWeapon}`;
}

function renderFriends() {
  friendListEl.innerHTML = "";
  state.friends.forEach((friend, index) => {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `<strong>${friend}</strong><span>${index === 0 ? "driver of the nonsense" : "ready for events"}</span>`;
    friendListEl.appendChild(item);
  });
}

function renderTasks() {
  taskBoardEl.innerHTML = "";
  const currentTask = tasks[state.assignmentsDone % tasks.length];
  const message = state.apples === 0 && state.bazookas === 0
    ? `${currentTask.title}: ${currentTask.question}`
    : "Ammo still exists. Studying is optional but looming.";
  const item = document.createElement("div");
  item.className = "list-item";
  item.innerHTML = `<strong>Assignment Desk</strong><span>${message}</span>`;
  taskBoardEl.appendChild(item);
}

function setStatus(text) {
  statusLineEl.textContent = text;
}

function openEventPopup(event) {
  state.pendingEvent = event;
  popupTitleEl.textContent = event.title;
  popupLocationEl.textContent = `${event.uni} in ${event.city}`;
  popupVibeEl.textContent = event.vibe;
  popupDiscountEl.textContent = event.discount;
  eventPopupEl.classList.remove("hidden");
}

function closeEventPopup() {
  eventPopupEl.classList.add("hidden");
  state.pendingEvent = null;
}

function openStudyPopup() {
  const task = tasks[state.assignmentsDone % tasks.length];
  state.activeStudyTask = task;
  studyTitleEl.textContent = task.title;
  studyQuestionEl.textContent = `${task.question} Reward: ${task.reward}.`;
  studyAnswerEl.value = "";
  studyPopupEl.classList.remove("hidden");
  studyAnswerEl.focus();
}

function closeStudyPopup() {
  studyPopupEl.classList.add("hidden");
  state.activeStudyTask = null;
}

function getWindowWorldPosition(glass) {
  return glass.getWorldPosition(new THREE.Vector3());
}

function createShatter(windowMesh) {
  const origin = getWindowWorldPosition(windowMesh);
  const material = new THREE.MeshBasicMaterial({
    color: 0x9ae8ff,
    transparent: true,
    opacity: 0.92
  });

  for (let i = 0; i < 9; i += 1) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(0.26 + Math.random() * 0.2, 0.22 + Math.random() * 0.18, 0.03),
      material.clone()
    );
    shard.position.copy(origin).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.9,
      (Math.random() - 0.5) * 1.1,
      Math.random() * 0.2
    ));
    shard.rotation.set(Math.random(), Math.random(), Math.random());
    scene.add(shard);
    shatters.push({
      mesh: shard,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        2 + Math.random() * 3,
        1 + Math.random() * 2.4
      ),
      life: 0.9 + Math.random() * 0.35
    });
  }
}

function joinPendingEvent() {
  if (!state.pendingEvent) {
    return;
  }
  state.eventsJoined += 1;
  state.missedEvents = Math.max(0, state.missedEvents - 1);
  const together = state.friends.length > 1 ? ` with ${state.friends.length - 1} friends` : "";
  discountStatusEl.textContent = `${state.pendingEvent.discount}${together} from ${state.pendingEvent.title}.`;
  setStatus(`Squad accepted ${state.pendingEvent.title}. Social life slightly repaired.`);
  closeEventPopup();
  updateHud();
}

function breakWindow(windowMesh, power) {
  const windowState = windowMesh.userData.windowState;
  if (!windowState || windowState.broken) {
    return;
  }

  windowState.broken = true;
  createShatter(windowMesh);
  windowMesh.visible = false;

  state.windowsBroken += 1;
  state.score += power === "bat" ? 50 : 25;
  state.missedEvents += 1;
  openEventPopup(windowState.event);
  setStatus(power === "bat" ? "Bat swing connected. Window absolutely exploded." : "Apple impact successful. Glass diplomacy failed.");
  updateHud();
}

function fireProjectile(kind) {
  const now = performance.now();
  if (now < state.canShootAt) {
    return;
  }

  if (kind === "apple" && state.apples <= 0) {
    setStatus("No apples left. Open a Linux assignment and earn more.");
    return;
  }
  if (kind === "bat" && state.bazookas <= 0) {
    setStatus("No bat charges left. Study before more violent athletics.");
    return;
  }

  if (kind === "apple") {
    state.apples -= 1;
    state.currentWeapon = "Apple";
  } else {
    state.bazookas -= 1;
    state.currentWeapon = "Bat";
  }

  const facing = new THREE.Vector3(Math.sin(state.aimYaw), 0, Math.cos(state.aimYaw)).normalize();
  if (kind === "bat") {
    let bestWindow = null;
    let bestScore = -Infinity;
    for (const block of buildings) {
      for (const glass of block.windows) {
        const windowState = glass.userData.windowState;
        if (windowState.broken) {
          continue;
        }
        const world = getWindowWorldPosition(glass);
        const toWindow = world.clone().sub(penguin.position);
        const distance = toWindow.length();
        if (distance > 9) {
          continue;
        }
        toWindow.y = 0;
        toWindow.normalize();
        const dot = facing.dot(toWindow);
        const score = dot - distance * 0.06;
        if (score > bestScore) {
          bestScore = score;
          bestWindow = glass;
        }
      }
    }

    state.batSwing = 1;
    state.canShootAt = now + 420;
    if (bestWindow && bestScore > 0.15) {
      const target = getWindowWorldPosition(bestWindow).sub(penguin.position);
      state.aimYaw = Math.atan2(target.x, target.z);
      breakWindow(bestWindow, "bat");
      createBurst(getWindowWorldPosition(bestWindow), 0xffd27f);
      setStatus("Bat aim assist locked on. Crunch.");
    } else {
      setStatus("Bat swing missed. Get a little closer to a window.");
    }
    renderTasks();
    updateHud();
    return;
  }

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(kind === "apple" ? 0.24 : 0.38, 16, 16),
    new THREE.MeshStandardMaterial({
      color: kind === "apple" ? 0xff4d2d : 0xffd166,
      emissive: kind === "apple" ? 0x6f1300 : 0x5b2f00,
      roughness: 0.45,
      metalness: 0.12
    })
  );
  mesh.castShadow = true;
  mesh.position.copy(penguin.position).add(new THREE.Vector3(facing.x * 1.3, 3.0, facing.z * 1.3));
  projectileGroup.add(mesh);

  const forward = facing.clone();
  forward.y = 0.18;
  forward.normalize();

  const speed = 18;
  projectiles.push({
    kind,
    mesh,
    velocity: forward.multiplyScalar(speed).add(new THREE.Vector3(0, 3.6, 0)),
    life: 2.7,
    prevPosition: mesh.position.clone()
  });

  state.canShootAt = now + 260;
  renderTasks();
  updateHud();
  setStatus("Apple thrown.");
}

function inviteFriend() {
  if (state.friends.length >= 4) {
    setStatus("Squad is full. Any more people and this becomes a parade.");
    return;
  }
  const candidate = possibleFriends[state.friends.length - 1];
  state.friends.push(candidate);
  renderFriends();
  updateHud();
  setStatus(`${candidate} joined the squad. Event attendance odds increased.`);
}

function submitAssignment() {
  openStudyPopup();
  setStatus("Linux checkpoint opened. Solve it before the ammo fairy helps.");
}

function checkStudyAnswer() {
  if (!state.activeStudyTask) {
    return;
  }

  const answer = studyAnswerEl.value.trim().toLowerCase().replace(/\s+/g, " ");
  const valid = state.activeStudyTask.answers.some((item) => answer === item.toLowerCase());
  if (!valid) {
    setStatus("Wrong Linux answer. Try again like a brave command-line bird.");
    return;
  }

  state.assignmentsDone += 1;
  if (state.activeStudyTask.title === "Where Am I") {
    state.apples += 1;
    state.bazookas += 1;
  } else if (state.activeStudyTask.title === "Go Home" || state.activeStudyTask.title === "Show Files") {
    state.apples += 2;
  } else {
    state.apples += 3;
  }

  state.drunk = Math.max(0, state.drunk - 18);
  document.body.classList.toggle("drunk", state.drunk > 12);
  closeStudyPopup();
  renderTasks();
  updateHud();
  setStatus("Correct. Linux knowledge converted into ammunition.");
}

function drinkSomethingQuestionable() {
  state.drunk = Math.min(100, state.drunk + 28);
  document.body.classList.toggle("drunk", state.drunk > 12);
  setStatus("Pingu drank something. Driving quality has become philosophical.");
  updateHud();
}

function createBurst(position, color) {
  const burst = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 10),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
  );
  burst.position.copy(position);
  burstGroup.add(burst);
  bursts.push({ mesh: burst, life: 0.5 });
}

function updateProjectiles(delta) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    projectile.prevPosition.copy(projectile.mesh.position);
    projectile.life -= delta;
    projectile.velocity.y -= 10 * delta;
    projectile.mesh.position.addScaledVector(projectile.velocity, delta);
    projectile.mesh.rotation.x += 8 * delta;
    projectile.mesh.rotation.z += 5 * delta;

    let destroyed = projectile.life <= 0 || projectile.mesh.position.y < 0.1;
    if (!destroyed) {
      for (const block of buildings) {
        for (const glass of block.windows) {
          if (glass.userData.windowState.broken) {
            continue;
          }
          const windowPos = getWindowWorldPosition(glass);
          const segmentDistance = new THREE.Line3(projectile.prevPosition, projectile.mesh.position).closestPointToPoint(windowPos, true, new THREE.Vector3()).distanceTo(windowPos);
          const distance = projectile.mesh.position.distanceTo(windowPos);
          if (distance < 1.1 || segmentDistance < 1.1) {
            breakWindow(glass, projectile.kind);
            createBurst(windowPos, 0xff7a00);
            destroyed = true;
            break;
          }
        }
        if (destroyed) {
          break;
        }
      }
    }

    if (destroyed) {
      projectileGroup.remove(projectile.mesh);
      projectile.mesh.geometry.dispose();
      projectile.mesh.material.dispose();
      projectiles.splice(i, 1);
    }
  }
}

function updateBursts(delta) {
  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const burst = bursts[i];
    burst.life -= delta;
    burst.mesh.scale.addScalar(delta * 4);
    burst.mesh.material.opacity = Math.max(0, burst.life * 1.6);
    if (burst.life <= 0) {
      burstGroup.remove(burst.mesh);
      burst.mesh.geometry.dispose();
      burst.mesh.material.dispose();
      bursts.splice(i, 1);
    }
  }
}

function updateShatters(delta) {
  for (let i = shatters.length - 1; i >= 0; i -= 1) {
    const shard = shatters[i];
    shard.life -= delta;
    shard.velocity.y -= 9 * delta;
    shard.mesh.position.addScaledVector(shard.velocity, delta);
    shard.mesh.rotation.x += delta * 8;
    shard.mesh.rotation.y += delta * 11;
    shard.mesh.material.opacity = Math.max(0, shard.life);
    if (shard.life <= 0) {
      scene.remove(shard.mesh);
      shard.mesh.geometry.dispose();
      shard.mesh.material.dispose();
      shatters.splice(i, 1);
    }
  }
}

function updateBackgroundPenguins(delta) {
  for (const npc of backgroundPenguins) {
    npc.mesh.position.x += npc.dir * npc.speed * delta;
    if (npc.mesh.position.x > 46) {
      npc.mesh.position.x = -46;
    }
    if (npc.mesh.position.x < -46) {
      npc.mesh.position.x = 46;
    }
    npc.mesh.position.z = npc.baseZ + Math.sin(performance.now() * 0.0008 + npc.phase) * 0.9;
    npc.mesh.rotation.y = npc.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    npc.phase += delta * 3.2;

    const bob = Math.sin(npc.phase * 2) * 0.08;
    npc.mesh.position.y = Math.max(0, bob);
    const rig = npc.mesh.userData.rig;
    if (rig) {
      const footSwing = Math.sin(npc.phase * 2) * 0.35;
      rig.feet[0].position.z = 0.45 + footSwing * 0.55;
      rig.feet[1].position.z = 0.45 - footSwing * 0.55;
      rig.leftWing.rotation.x = Math.sin(npc.phase * 2) * 0.14;
      rig.rightWing.rotation.x = -Math.sin(npc.phase * 2) * 0.14;
    }
  }
}

function applyCameraCollision(targetPosition) {
  const corrected = targetPosition.clone();
  for (const { bounds } of buildings) {
    const insideX = corrected.x > bounds.minX - cameraPadding && corrected.x < bounds.maxX + cameraPadding;
    const insideZ = corrected.z > bounds.minZ - cameraPadding && corrected.z < bounds.maxZ + cameraPadding;
    if (!insideX || !insideZ) {
      continue;
    }

    const distances = [
      { axis: "x", value: Math.abs(corrected.x - (bounds.minX - cameraPadding)), target: bounds.minX - cameraPadding },
      { axis: "x", value: Math.abs(corrected.x - (bounds.maxX + cameraPadding)), target: bounds.maxX + cameraPadding },
      { axis: "z", value: Math.abs(corrected.z - (bounds.minZ - cameraPadding)), target: bounds.minZ - cameraPadding },
      { axis: "z", value: Math.abs(corrected.z - (bounds.maxZ + cameraPadding)), target: bounds.maxZ + cameraPadding }
    ];
    distances.sort((a, b) => a.value - b.value);
    corrected[distances[0].axis] = distances[0].target;
  }
  corrected.x = THREE.MathUtils.clamp(corrected.x, -60, 60);
  corrected.z = THREE.MathUtils.clamp(corrected.z, -52, 52);
  return corrected;
}

function updateMovement(delta) {
  const speed = state.sprint ? 9.5 : 5.5;
  const input = new THREE.Vector3(
    (state.moveRight ? 1 : 0) - (state.moveLeft ? 1 : 0),
    0,
    (state.moveForward ? 1 : 0) - (state.moveBackward ? 1 : 0)
  );
  const move = new THREE.Vector3();

  if (input.lengthSq() > 0) {
    move
      .set(input.x, 0, input.z)
      .normalize()
      .multiplyScalar(speed * delta);

    if (state.drunk > 0) {
      move.x += Math.sin(performance.now() * 0.004) * 0.015 * (state.drunk / 50);
      move.z += Math.cos(performance.now() * 0.0035) * 0.015 * (state.drunk / 50);
    }

    const nextX = THREE.MathUtils.clamp(penguin.position.x + move.x, -40, 40);
    const nextZ = THREE.MathUtils.clamp(penguin.position.z + move.z, -18, 18);
    const blocked = buildings.some(({ bounds }) =>
      nextX > bounds.minX && nextX < bounds.maxX && nextZ > bounds.minZ && nextZ < bounds.maxZ
    );

    if (!blocked) {
      penguin.position.x = nextX;
      penguin.position.z = nextZ;
    }

    state.aimYaw = Math.atan2(move.x, move.z);
    const yawDelta = Math.atan2(
      Math.sin(state.aimYaw - penguin.rotation.y),
      Math.cos(state.aimYaw - penguin.rotation.y)
    );
    penguin.rotation.y += yawDelta * 0.18;
    setStatus(state.drunk > 40 ? "Driving under bird influence." : "Cruising for windows and social growth.");
  }

  const moving = input.lengthSq() > 0;
  if (moving) {
    state.walkCycle += delta * (state.sprint ? 12 : 8);
  }

  const walkBounce = moving ? Math.sin(state.walkCycle) * 0.12 : 0;
  penguin.position.y = Math.max(0, walkBounce);
  penguinMarker.position.set(penguin.position.x, 0.04, penguin.position.z);
  const rig = penguin.userData.rig;
  if (rig) {
    const footSwing = moving ? Math.sin(state.walkCycle) * 0.45 : 0;
    const wingSwing = moving ? Math.sin(state.walkCycle) * 0.18 : 0;
    const batSwing = state.batSwing > 0 ? Math.sin((1 - state.batSwing) * Math.PI) : 0;
    rig.feet[0].position.z = 0.45 + footSwing * 0.6;
    rig.feet[1].position.z = 0.45 - footSwing * 0.6;
    rig.leftWing.rotation.x = wingSwing;
    rig.rightWing.rotation.x = -wingSwing;
    rig.head.rotation.z = moving ? Math.sin(state.walkCycle * 0.5) * 0.04 : 0;
    rig.bat.rotation.z = -1.1 + batSwing * 1.9;
    rig.bat.rotation.y = batSwing * 0.65;
  }
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  state.drunk = Math.max(0, state.drunk - delta * 3.2);
  state.batSwing = Math.max(0, state.batSwing - delta * 3.8);
  document.body.classList.toggle("drunk", state.drunk > 12);

  updateMovement(delta);
  updateProjectiles(delta);
  updateBursts(delta);
  updateShatters(delta);
  updateBackgroundPenguins(delta);
  updateHud();

  const yaw = penguin.rotation.y;
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const desiredCamera = new THREE.Vector3(
    penguin.position.x - forward.x * 7 - 3,
    penguin.position.y + followOffset.y + Math.sin(performance.now() * 0.001) * 0.18 * (state.drunk / 100),
    penguin.position.z - forward.z * 9 - 11
  );
  const correctedCamera = applyCameraCollision(desiredCamera);
  camera.position.lerp(correctedCamera, 0.18);
  camera.lookAt(
    penguin.position.x + forward.x * 3,
    penguin.position.y + lookOffset.y + 1.1,
    penguin.position.z + forward.z * 3
  );
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onKey(event, isDown) {
  const studyOpen = !studyPopupEl.classList.contains("hidden");
  if (studyOpen && isDown && event.code === "Enter") {
    checkStudyAnswer();
    return;
  }
  if (studyOpen && isDown && event.code === "Escape") {
    closeStudyPopup();
    return;
  }
  if (studyOpen) {
    return;
  }
  if (event.repeat && isDown) {
    return;
  }
  if (event.code === "KeyW") {
    state.moveForward = isDown;
  }
  if (event.code === "KeyS") {
    state.moveBackward = isDown;
  }
  if (event.code === "KeyA") {
    state.moveLeft = isDown;
  }
  if (event.code === "KeyD") {
    state.moveRight = isDown;
  }
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
    state.sprint = isDown;
  }

  if (!isDown) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    fireProjectile("apple");
  }
  if (event.code === "KeyB") {
    fireProjectile("bat");
  }
  if (event.code === "KeyR") {
    submitAssignment();
  }
  if (event.code === "KeyF") {
    inviteFriend();
  }
  if (event.code === "KeyV") {
    drinkSomethingQuestionable();
  }
  if (event.code === "KeyH") {
    document.body.classList.toggle("hud-hidden");
    toggleHudButton.textContent = document.body.classList.contains("hud-hidden") ? "Show Menu" : "Hide Menu";
  }
}

joinEventButton.addEventListener("click", joinPendingEvent);
closePopupButton.addEventListener("click", closeEventPopup);
inviteFriendButton.addEventListener("click", inviteFriend);
studyButton.addEventListener("click", submitAssignment);
submitStudyAnswerButton.addEventListener("click", checkStudyAnswer);
closeStudyPopupButton.addEventListener("click", closeStudyPopup);
renderer.domElement.addEventListener("click", () => fireProjectile("apple"));
toggleHudButton.addEventListener("click", () => {
  document.body.classList.toggle("hud-hidden");
  toggleHudButton.textContent = document.body.classList.contains("hud-hidden") ? "Show Menu" : "Hide Menu";
});

window.addEventListener("keydown", (event) => onKey(event, true));
window.addEventListener("keyup", (event) => onKey(event, false));
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderFriends();
renderTasks();
updateHud();
setStatus("Welcome to Pingu Vice. Try Space or B a few times near the buildings.");
animate();
