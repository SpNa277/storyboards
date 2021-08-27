import * as THREE from "../node_modules/three/build/three.module.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "../node_modules/three/examples/jsm/controls/TransformControls.js";
import { Picker, PickPosition, intersectionPosition } from "./picker.js";
import Stats from "../node_modules/three/examples/jsm/libs/stats.module.js";
import { BACKGROUNDS, FIGURES } from "./figure.js";
import { exportFigures } from "./export.js";

// ----------------------------------------------------------------------------
//  global variables
// ----------------------------------------------------------------------------
let scene, camera, renderer, light, controls;

const objects = [];
const storyboards = [];

let transform;

window.requestAnimationFrame(render);

const container = document.getElementById("container");

const picker = new Picker();
const pickPosition = new PickPosition();

const dropPosition = new PickPosition();

// --- added the stats panel --- //
let stats = new Stats();
document.body.appendChild(stats.domElement);

// ----------------------------------------------------------------------------
//  Init Function - initialize the project
// ----------------------------------------------------------------------------
let init = function () {
  // --- create the scene --- //
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x777c8e);

  // --- create and locate the camera --- //
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 7, 20);
  camera.lookAt(scene.position);

  // --- create the light --- //
  light = new THREE.AmbientLight(0xffffff);
  scene.add(light);

  // --- create the renderer --- //
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x000000, 0.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding; //configure textures referenced from .glb
  container.appendChild(renderer.domElement); // to be able to locate on the browser

  // --- create the floor --- //
  const grid = new THREE.GridHelper(1000, 200);
  grid.material.opacity = 0.2;
  grid.color = 0xeeeeee;
  grid.material.depthWrite = false; // avoid z-fighting
  grid.material.transparent = true;
  scene.add(grid);

  // --- create Storyboard --- //
  //create the text label
  const boardWallFontLabel = new THREE.FontLoader();
  boardWallFontLabel.load(
    "/node_modules/three/examples/fonts/gentilis_regular.typeface.json",
    (font) => {
      createStoryboard(font);
    }
  );

  // --- add the Orbit Control, it rotates the camera and enforces the camera up direction--- //
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, 0);
  controls.listenToKeyEvents(window);
  controls.keyPanSpeed = 30;
  controls.update();

  // --- add the transform Controls, it makes it possible to move, rotate and scale the objects --- //
  transform = new TransformControls(camera, renderer.domElement);
  transform.addEventListener("objectChange", updateLabel);
  transform.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  scene.add(transform);

  window.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "g":
        transform.setMode("translate");
        break;
      case "r":
        transform.setMode("rotate");
        break;
      case "s":
        transform.setMode("scale");
        break;
    }
  });

  // --- add event listener --- //
  window.addEventListener("click", (event) =>
    pickPosition.setPosition(event, renderer.domElement)
  );
  window.addEventListener("mouseout", () => pickPosition.reset());
  window.addEventListener("mouseleave", () => pickPosition.reset());
  window.addEventListener("click", (event) => {
    if (document.activeElement !== event.target) {
      document.activeElement.blur();
    }
  });
};

// ----------------------------------------------------------------------------
//  create the Storyboard Function
// ----------------------------------------------------------------------------
function createStoryboard(font) {
  const boardGeometry = new THREE.BoxGeometry(20, 0.9, 20);
  const boardMaterial = new THREE.MeshLambertMaterial({
    color: 0xeeeeee,
    side: THREE.DoubleSide,
  });
  const boardGeometryChild = new THREE.BoxGeometry(19, 1, 18);
  const boardMaterialChild = new THREE.MeshLambertMaterial({
    color: 0xc6c2c2,
    side: THREE.DoubleSide,
  });
  const boardGeometryWall = new THREE.BoxGeometry(20, 15, 0.9);

  const boardWallMaterialLabel = new THREE.MeshNormalMaterial();

  const storyboard = new THREE.Group();

  let pos = 0;
  let posLabel = -5;
  let boardNumber = 0;

  function addStoryboard(bg) {
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    const boardChild = new THREE.Mesh(boardGeometryChild, boardMaterialChild);
    const boardWall = new THREE.Mesh(boardGeometryWall, boardMaterial);

    boardNumber += 1;
    const boardName = "Scene " + boardNumber;
    const fontWallGeometryLabel = new THREE.TextGeometry(boardName, {
      font: font,
      size: 2,
      height: 0.5,
    });
    const boardWallLabel = new THREE.Mesh(
      fontWallGeometryLabel,
      boardWallMaterialLabel
    );
    boardWallLabel.position.set(posLabel, 15, -10);
    posLabel += 50;
    scene.add(boardWallLabel);

    board.position.x = pos;
    pos += 50;
    boardWall.position.y = 7;
    boardWall.position.z = -10;

    if (bg) {
      const loader = new GLTFLoader();
      loader.load(bg.imagePath, (gltf) => {
        const background = gltf.scene;
        background.scale.set(bg.scale.x, bg.scale.y, bg.scale.z);
        background.position.set(
          board.position.x,
          boardWall.position.y + 7 / bg.scale.y,
          boardWall.position.z + 0.5
        );
        scene.add(background);
      });
    }
    storyboard.add(board);
    board.add(boardChild);
    board.add(boardWall);
    storyboards.push(storyboard);
    scene.add(storyboard);
  }

  const element = document.getElementById("bgEmpty");
  element.addEventListener("click", () => addStoryboard(), false);

  for (const bg of BACKGROUNDS) {
    const element = document.getElementById(bg.domElement);
    element.addEventListener("click", () => addStoryboard(bg), false);
  }

  addStoryboard();
}

// ----------------------------------------------------------------------------
//  Create Export Button and Download XML File to import to Scene2Model
// ----------------------------------------------------------------------------
const exportButton = document.getElementById("export");
exportButton.addEventListener("click", exportXML, false);

function exportXML() {
  const figures = objects.map((obj) => ({
    name: obj.label.name,
    class: obj.label.class,
    type: obj.label.type,
    position: obj.position,
    scale: obj.scale,
  }));
  exportFigures(figures);
}

// ----------------------------------------------------------------------------
//  Create Labels and SAP Figures
// ----------------------------------------------------------------------------
const labelContainer = document.getElementById("labels");
const labels = [];

function createLabel(fig, position) {
  const label = {
    name: fig.name,
    class: fig.class,
    type: fig.type,
    position,
    elem: document.createElement("div"),
  };
  label.elem.innerHTML = label.name;
  label.elem.classList.add("label");
  label.elem.setAttribute("contenteditable", true);
  labelContainer.appendChild(label.elem);
  labels.push(label);
  return label;
}

const labelPos = new THREE.Vector3();
function renderLabels() {
  for (const label of labels) {
    // get the normalized screen coordinate of that position
    // x and y will be in the -1 to +1 range with x = -1 being
    // on the left and y = -1 being on the bottom
    labelPos.copy(label.position);
    labelPos.project(camera);

    // convert the normalized position to CSS coordinates
    const x = (labelPos.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = (labelPos.y * -0.5 + 0.5) * renderer.domElement.clientHeight;

    // move the elem to that position
    label.elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;

    // set the zIndex for sorting
    label.elem.style.zIndex = ((-labelPos.z * 0.5 + 0.5) * 100000) | 0;
  }
}

function createFigures() {
  function spawnFigure(event, fig) {
    dropPosition.setPosition(event, renderer.domElement);
    const pos = intersectionPosition(dropPosition, camera, storyboards); //here it depends what you want to intersect with

    // figures can be positioned just on the storyboard. In this case the user didn't drop the figure on the storyboard.
    if (pos === undefined) {
      return;
    }

    const loader = new GLTFLoader();
    loader.load(fig.imagePath, (gltf) => {
      const figure = gltf.scene;
      figure.scale.set(fig.scale.x, fig.scale.y, fig.scale.z);
      figure.position.set(pos.x, pos.y + fig.dropHeight, pos.z);
      let labelPosition = new THREE.Vector3(
        pos.x,
        pos.y + fig.positionLabel,
        pos.z
      );
      figure.label = createLabel(fig, labelPosition); //here the adding of the label to the figure
      figure.label.offsetY = labelPosition.y - figure.position.y;
      scene.add(figure);
      console.log(figure);
      objects.push(figure);
    });
  }

  for (const fig of FIGURES) {
    const element = document.getElementById(fig.domElement);
    element.addEventListener(
      "dragend",
      (event) => spawnFigure(event, fig),
      false
    );
  }
}

createFigures();

// ----------------------------------------------------------------------------
//  Resize Function - reports the window size each time it is resized
// ----------------------------------------------------------------------------
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------------------------------------------
// Function to resize the display size
// ----------------------------------------------------------------------------
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// ----------------------------------------------------------------------------
//  Render Function
// ----------------------------------------------------------------------------
let pickedObject, attachedTransform;

function updateLabel() {
  const posFigure = pickedObject.parent.position;
  const posDelta = pickedObject.position;
  const scale = pickedObject.parent.scale;
  // posFigure stays the same (spawn from figure)
  // posDelta - the delta of the figure from the original point
  // it needs to be scaled
  // label.offsetY is needed that the label is placed above the figure
  pickedObject.parent.label.position = {
    x: posFigure.x + scale.x * posDelta.x,
    y: posFigure.y + scale.y * posDelta.y + pickedObject.parent.label.offsetY,
    z: posFigure.z + scale.z * posDelta.z,
  };
}

//TO DO --- delete/remove pickedObject
/*function removePickedObject(event) {
  if (event.keyCode == d) scene.remove(pickedObject);
}*/

function render() {
  controls.update();
  stats.update();
  renderer.render(scene, camera);

  picker.pick(pickPosition, camera, objects);
  if (pickedObject && pickedObject.uuid != picker.pickedObject?.uuid) {
    attachedTransform = false;
  }
  if (picker.pickedObject && !attachedTransform) {
    pickedObject = picker.pickedObject;
    transform.detach();

    transform.attach(pickedObject);
    attachedTransform = true;

    window.key;
  }
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  renderLabels();
  requestAnimationFrame(render);
}

//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------

// -------------------- calls the init function when the window is done loading
init();
render();
