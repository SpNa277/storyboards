import * as THREE from "../node_modules/three/build/three.module.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "../node_modules/three/examples/jsm/controls/TransformControls.js";
import { Picker, PickPosition, intersectionPosition } from "./picker.js";
import Stats from "../node_modules/three/examples/jsm/libs/stats.module.js";
import { BACKGROUNDS, FIGURES } from "./figure.js";
import { exportFigures } from "./export.js";
// server hosts the module with the socket configuration in the global variable `io`
import "/socket.io/socket.io.js";


// ----------------------------------------------------------------------------
//  global variables
// ----------------------------------------------------------------------------
// eslint-disable-next-line no-undef
const socket = io();
let clientId;
socket.on("id", (id) => {
  clientId = id;
});

let scene, camera, renderer, light, controls;

let objects = [];
let storyboards = [];

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

function initControls(){
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.6, 0);
  controls.listenToKeyEvents(window);
  controls.keyPanSpeed = 30;
  controls.update();
}


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
  // configure textures referenced from .glb
  renderer.outputEncoding = THREE.sRGBEncoding;
  // to locate on the browser
  container.appendChild(renderer.domElement);

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

  // --- Orbit Control to rotate the camera --- //
 

  initControls();

  // --- Transform Controls to make it possible to move, rotate and scale the objects --- //
  transform = new TransformControls(camera, renderer.domElement);
  transform.addEventListener("objectChange", () => {
    updateLabel(pickedObject);
  });
  transform.addEventListener("mouseUp", () => {
    const index = objects.indexOf(transform.object.parent);
    const pos = transform.object.position;
    socket.emit("updatePosition", clientId, index, pos);
  });
  transform.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });

  scene.add(transform);

  window.addEventListener("keydown", (event) => {
    if (document.activeElement.isContentEditable) {
      return;
    }
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
      case "Delete":
      case "Backspace": {
        if (pickedObject === undefined) {
          break;
        }
        const index = objects.indexOf(pickedObject.parent);
        deleteFigure(index);
        socket.emit("deleteFigure", clientId, index);
        break;
      }
    }
  });

  // --- addEventListeners --- //
  window.addEventListener("click", (event) =>
    pickPosition.setPosition(event, renderer.domElement)
  );
  window.addEventListener("mouseout", () => pickPosition.reset());
  window.addEventListener("mouseleave", () => pickPosition.reset());
  window.addEventListener("click", (event) => {
    if (document.activeElement !== event.target) {
      document.activeElement.blur();
    }
    controls.enablePan = !event.target.isContentEditable;
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

  let pos = 0;
  let posLabel = -5;
  let boardNumber = 0;

  function addStoryboard(bg) {
    const storyboard = new THREE.Group();
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
    posLabel += 30;
    storyboard.add(boardWallLabel);

    board.position.x = pos;
    pos += 30;
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
          boardWall.position.z + 0.451
        );
        background.label = {
          name: bg.name,
          class: bg.class,
          type: bg.type,
        };
        storyboard.add(background);
      });
    }
    storyboard.add(board);
    board.add(boardChild);
    board.add(boardWall);
    // gives the boundaries from the storyboard
    storyboard.bounds = {
      xStart: board.position.x - 10,
      xEnd: board.position.x + 10,
      yStart: 0,
      yEnd: 15,
      zStart: -10,
      zEnd: 10,
    };
    storyboards.push(storyboard);
    scene.add(storyboard);
  }

  const element = document.getElementById("bgEmpty");
  element.addEventListener(
    "click",
    () => {
      addStoryboard();
      socket.emit("addStoryboard", clientId);
    },
    false
  );

  for (const bg of BACKGROUNDS) {
    const element = document.getElementById(bg.domElement);
    element.addEventListener(
      "click",
      () => {
        addStoryboard(bg);
        socket.emit("addStoryboard", clientId, bg);
      },
      false
    );
  }

  socket.on("addStoryboard", (senderId, bg) => {
    if (clientId === senderId) {
      return;
    }
    addStoryboard(bg);
  });

  socket.on("historyStoryboards", (historyStoryboard) => {
    for (const bg of historyStoryboard) {
      addStoryboard(bg);
    }
  });

  socket.on("deleteAllStoryboards", deleteAllStoryboards);

  const deleteAllStoryboardsButton = document.getElementById("deleteAll");
  deleteAllStoryboardsButton.addEventListener(
    "click",
    () => {
      deleteAllStoryboards();
      socket.emit("deleteHistoryStoryboards");
    },
    false
  );

  function deleteAllStoryboards() {
    for (const storyboard of storyboards) {
      scene.remove(storyboard);
    }
    storyboards = [];
    pos = 0;
    posLabel = -5;
    boardNumber = 0;
    addStoryboard();
  }

  addStoryboard();
  socket.emit("requestHistoryStoryboards");
}

// ----------------------------------------------------------------------------
//  Create Export Button and Download XML-File
// ----------------------------------------------------------------------------
const exportButton = document.getElementById("export");
exportButton.addEventListener("click", exportXML, false);

function exportXML() {
  const figures = objects.map((obj) => {
    // transformControls contains the offset from the original position,
    // it is supposedly always the last child.
    const transformMesh = obj.children[obj.children.length - 1];
    const posFigure = obj.position;
    const posDelta = transformMesh.position;
    return {
      name: obj.label.name,
      class: obj.label.class,
      type: obj.label.type,
      position: {
        x: posFigure.x + obj.scale.x * posDelta.x,
        y: posFigure.y + obj.scale.y * posDelta.y,
        z: posFigure.z + obj.scale.z * posDelta.z,
      },
      scale: obj.scale,
    };
  });
  const normalizedFigures = assignFiguresToStoryboard(figures);
  exportFigures(normalizedFigures);
}

// sorts figures to the corresponding storyboard if there are within the boundaries of the storyboard,
// and normalize coordinates between 0 and 1.
function assignFiguresToStoryboard(figures) {
  return storyboards.map((storyboard) => {
    const figs = figures
      .filter(
        (fig) =>
          fig.position.x >= storyboard.bounds.xStart &&
          fig.position.x <= storyboard.bounds.xEnd &&
          fig.position.y >= storyboard.bounds.yStart &&
          fig.position.y <= storyboard.bounds.yEnd &&
          fig.position.z >= storyboard.bounds.zStart &&
          fig.position.z <= storyboard.bounds.zEnd
      )
      .map((fig) => ({
        ...fig,
        position: {
          x:
            (fig.position.x - storyboard.bounds.xStart) /
            (storyboard.bounds.xEnd - storyboard.bounds.xStart),
          y:
            (fig.position.y - storyboard.bounds.yStart) /
            (storyboard.bounds.yEnd - storyboard.bounds.yStart),
          z:
            (fig.position.z - storyboard.bounds.zStart) /
            (storyboard.bounds.zEnd - storyboard.bounds.zStart),
        },
      }));
    // three children with background and two children without background
    if (storyboard.children.length > 2) {
      const bg = storyboard.children[storyboard.children.length - 1];
      figs.push({
        name: bg.label.name,
        class: bg.label.class,
        type: bg.label.type,
        position: {
          x:
            (bg.position.x - storyboard.bounds.xStart) /
            (storyboard.bounds.xEnd - storyboard.bounds.xStart),
          y:
            (bg.position.y - storyboard.bounds.yStart) /
            (storyboard.bounds.yEnd - storyboard.bounds.yStart),
          z:
            (bg.position.z - storyboard.bounds.zStart) /
            (storyboard.bounds.zEnd - storyboard.bounds.zStart),
        },
        scale: bg.scale,
        zIndex: 0,
      });
    }
    return figs;
  });
}

// ----------------------------------------------------------------------------
//  Create Labels and SAP Figures
// ----------------------------------------------------------------------------
let labelContainer = document.getElementById("labels");
let labels = [];



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
  function spawnFigure(pos, fig) {
    // figures can be positioned just on the storyboard.
    // In this case the user didn't drop the figure on the storyboard.
    if (pos === undefined) {
      return;
    }

    const loader = new GLTFLoader();
    loader.load(fig.imagePath, (gltf) => {
      const figure = gltf.scene;
      figure.scale.set(fig.scale.x, fig.scale.y, fig.scale.z);
      figure.position.set(pos.x, pos.y + fig.dropHeight, pos.z);
      const labelPosition = new THREE.Vector3(
        pos.x,
        pos.y + fig.positionLabel,
        pos.z
      );
      // label gets added to the figure
      figure.label = createLabel(fig, labelPosition);
      figure.label.offsetY = labelPosition.y - figure.position.y;
      scene.add(figure);
      console.log(figure);
      objects.push(figure);

      const mesh = figure.children[figure.children.length - 1];
      if (fig.posOffset) {
        mesh.position.set(fig.posOffset.x, fig.posOffset.y, fig.posOffset.z);
      }
      updateLabel(mesh);
    });
  }

  socket.on("spawnFigure", (senderId, pos, fig) => {
    if (clientId === senderId) {
      return;
    }
    spawnFigure(pos, fig);
  });

  socket.on("historyFigures", (historyFigures) => {
    for (const { pos, fig } of historyFigures) {
      spawnFigure(pos, fig);
    }
  });

  socket.on("deleteFigure", (senderId, index) => {
    if (clientId === senderId) {
      return;
    }
    deleteFigure(index);
  });

  socket.on("updatePosition", (senderId, index, pos) => {
    if (clientId === senderId) {
      return;
    }
    updatePosition(index, pos);
  });

  for (const fig of FIGURES) {
    const element = document.getElementById(fig.domElement);
    element.addEventListener(
      "dragend",
      (event) => {
        dropPosition.setPosition(event, renderer.domElement);
        // depends what you want to intersect with
        const pos = intersectionPosition(dropPosition, camera, storyboards);
        spawnFigure(pos, fig);
        socket.emit("spawnFigure", clientId, pos, fig);
      },
      false
    );
  }
  socket.emit("requestHistoryFigures");
}

function deleteFigure(index) {
  const obj = objects[index];
  objects = objects.filter((_, objIndex) => index !== objIndex);
  scene.remove(obj);
  obj.label.elem.remove();
  if (transform.object.parent === obj) {
    transform.detach();
  }
}

function updatePosition(index, pos) {
  const obj = objects[index];
  const mesh = obj.children[obj.children.length - 1];
  mesh.position.set(pos.x, pos.y, pos.z);
  updateLabel(mesh);
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

function updateLabel(obj) {
  const posFigure = obj.parent.position;
  const posDelta = obj.position;
  const scale = obj.parent.scale;
  // posFigure stays the same (spawn from figure)
  // posDelta - the delta of the figure from the original point
  // it needs to be scaled
  // label.offsetY is needed that the label is placed above the figure
  obj.parent.label.position = {
    x: posFigure.x + scale.x * posDelta.x,
    y: posFigure.y + scale.y * posDelta.y + obj.parent.label.offsetY,
    z: posFigure.z + scale.z * posDelta.z,
  };
}



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

var loader = new THREE.ObjectLoader();
//initEventDrag();
//initEventLabelChange();

//------------------------------------------------------
//section for the update of the labels in all clients
let oldLabelContainer = '';
function initEventLabelChange(){
$('#labels').on('DOMSubtreeModified', async function() {
  let labelInnerHTML = document.querySelector('#labels').innerHTML;

    console.log('changed: ' + labelInnerHTML.toString());
  if (labelInnerHTML.toString() === oldLabelContainer.toString()){
    oldLabelContainer = labelInnerHTML.toString();
    console.log('do nothing')
  }
  else{
        oldLabelContainer = labelInnerHTML;

        setTimeout(() => {
          socket.emit('labelsChanged', labelInnerHTML);
        }, 100);

  }
  
});
}

socket.on("updateLabelElement", (htmlElement) => {
  let labelInnerHTML = document.querySelector('#labels').innerHTML;
  let label = document.querySelector('#labels');

  //console.log('got from server ' + htmlElement)
  //console.log('the local old instance is ' + oldLabelContainer.toString())
  //console.log('the local actual instance is ' +labelInnerHTML)
  
  if (oldLabelContainer.toString() === htmlElement.toString()){
    console.log('already up to date')
    
  }
  else{
    label.innerHTML = htmlElement;
    objects.forEach(group => {
      
      
    });
    //labels.forEach(label => updateLabel(label))
  }

});


//------------------------------------------------------



//------------------------------------------------------
//section for the navigator update in all clients
let oldCamera;
function initEventDrag(){

controls.addEventListener('end',function(){
  if (JSON.stringify(camera) != JSON.stringify(oldCamera)){
  socket.emit('navigatorUpdated', camera, clientId);
  }
});
}





socket.on("updateNavigator", (cont, cliId) => {
  if (cliId != clientId){
    let loaded = loader.parse(cont);

    if (JSON.stringify(loaded) === JSON.stringify(camera)){
      
    }
    else{
      controls.dispose()
      oldCamera = loaded;
      camera.copy(loaded); 
      onWindowResize();
      
      
      initControls();
      initEventDrag();
    }
  }
  
});

//------------------------------------------------------



// setInterval(() => {
//   let labelInnerHTML = document.querySelector('#labels').innerHTML;

//   console.log('label: ' + labelInnerHTML.toString());
// if (labelInnerHTML.toString() === oldLabelContainer.toString()){
//   oldLabelContainer = labelInnerHTML.toString();
//   console.log('do nothing')
// }
// else{
//       oldLabelContainer = labelInnerHTML;
//       console.log(scene.children)

//       setTimeout(() => {
//         socket.emit('labelsChanged', labelInnerHTML);
//       }, 100);

      
  
//         }
      
     

// }, 1000);