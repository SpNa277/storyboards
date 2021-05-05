import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from '../node_modules/three/examples/jsm/controls/TransformControls.js'
import { Picker, PickPosition, intersectionPosition } from './picker.js';
import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js';
import { FIGURES } from './figure.js';
import { exportFigures } from './export.js';


// ----------------------------------------------------------------------------
//  global variables 
// ----------------------------------------------------------------------------
let scene, camera, renderer, light, controls;

const objects = [];
const storyboards = [];

let board, board_child, board_wall, storyboard;

const LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40;

let transform;



window.requestAnimationFrame(render);

const container = document.getElementById('container');   
  
const picker = new Picker();
const pickPosition = new PickPosition();

const dropPosition = new PickPosition();

// --- added the stats panel --- //
let stats = new Stats();
document.body.appendChild(stats.domElement);




// ----------------------------------------------------------------------------
//  Init Function - initialize the project
// ----------------------------------------------------------------------------
let init = function(){

    // --- create the scene --- //
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x777c8e);

    // --- create and locate the camera --- //
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000);
    camera.position.set(0, 7, 20);
    camera.lookAt(scene.position);

    // --- create the light --- //
    light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    let axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);
    

    // --- create the renderer --- //
    renderer = new THREE.WebGLRenderer({antialias: true});
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
    scene.add( grid );

    // --- create Storyboard --- //
    createStoryboard();
                   
    // --- add the Orbit Control, it rotates the camera and enforces the camera up direction--- // 
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0,1.6, 0);
    controls.update();

    // --- add the transform Controls, it makes it possible to move, rotate and scale the objects --- //
    transform = new TransformControls(camera, renderer.domElement);
    transform.addEventListener('dragging-changed', function(event){
        controls.enabled =! event.value;
    });

    scene.add(transform);

    window.addEventListener('keydown', function(event){
        switch(event.key){
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
    })


    // --- add event listener --- //
    document.addEventListener("keydown", onKeyDown, false);
    window.addEventListener('click', (event) => pickPosition.setPosition(event, renderer.domElement));
    window.addEventListener('mouseout', () => pickPosition.reset());
    window.addEventListener('mouseleave', () => pickPosition.reset());  
};

// ----------------------------------------------------------------------------
//  create the Storyboard Function
// ----------------------------------------------------------------------------
function createStoryboard(){
    const boardGeometry = new THREE.BoxGeometry(20, 0.9, 20);
    const boardMaterial = new THREE.MeshLambertMaterial( {color: 0xeeeeee, side:THREE.DoubleSide });
    const boardGeometry_child = new THREE.BoxGeometry(19, 1, 18);
    const boardMaterial_child = new THREE.MeshLambertMaterial( {color: 0xc6c2c2, side:THREE.DoubleSide });
    const boardGeometry_wall = new THREE.BoxGeometry(20, 15, 0.9);

    storyboard = new THREE.Group();

    let addingBoard = document.getElementById("addingStoryboard");
    addingBoard.addEventListener("click", addStoryboard, false);

    let pos = 0;

    function addStoryboard(){
        board = new THREE.Mesh(boardGeometry, boardMaterial);
        board_child = new THREE.Mesh(boardGeometry_child, boardMaterial_child);
        board_wall = new THREE.Mesh(boardGeometry_wall, boardMaterial);
               
        board.position.x = pos;
        pos += 50;

        storyboard.add(board);
        board.add(board_child);

        board_wall.position.y = 7;
        board_wall.position.z = -10;

        board.add(board_wall);
        storyboards.push(storyboard);
        scene.add(storyboard);
    }

    addStoryboard();
}

const exportButton = document.getElementById("export");
exportButton.addEventListener("click", exportXML, false);

function exportXML(){
    exportFigures(FIGURES);
}

// ----------------------------------------------------------------------------
//  Create Labels and SAP Figures
// ----------------------------------------------------------------------------
const labelContainer = document.getElementById("labels");
const labels = [];

function createLabel(text, position){
    const label = {
        text,
        position,
        elem: document.createElement("div"),
    }
    label.elem.innerHTML = label.text;
    labelContainer.appendChild(label.elem);
    labels.push(label);
    return label;
}


const labelPos = new THREE.Vector3();
function updateLabels() {
    for (const label of labels) {
      // get the normalized screen coordinate of that position
      // x and y will be in the -1 to +1 range with x = -1 being
      // on the left and y = -1 being on the bottom
      labelPos.copy(label.position);
      labelPos.project(camera);

      // convert the normalized position to CSS coordinates
      const x = (labelPos.x *  0.5 + 0.5) * renderer.domElement.clientWidth;
      const y = (labelPos.y * -0.5 + 0.5) * renderer.domElement.clientHeight;

      // move the elem to that position
      label.elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;

      // set the zIndex for sorting
      label.elem.style.zIndex = (-labelPos.z * .5 + .5) * 100000 | 0;
    }
  }


function createFigures(){
    for (const fig of FIGURES) {
        const element = document.getElementById(fig.domElement);
        function spawnFigure(event){
            dropPosition.setPosition(event, renderer.domElement);
            const pos = intersectionPosition(dropPosition, camera, storyboards); //here it depends what you want to intersect with
            const loader = new GLTFLoader();
            loader.load(fig.imagePath, (gltf) => {
                const figure = gltf.scene;
                figure.scale.set(fig.scale.x, fig.scale.y, fig.scale.z);
                figure.position.set(pos.x, pos.y + fig.dropHeight, pos.z);
                figure.label = createLabel(fig.name, pos); //here the creation of the label
                scene.add(figure);
                console.log(figure);
                objects.push(figure);
            })
        }

        element.addEventListener("dragend", spawnFigure, false);
    
    }
}

createFigures();


// ----------------------------------------------------------------------------
//  Resize Function - reports the window size each time it is resized
// ----------------------------------------------------------------------------
window.addEventListener('resize', onWindowResize, false);

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ----------------------------------------------------------------------------
//  onKeyDown Function - to move around the scene
// ----------------------------------------------------------------------------
function onKeyDown(event){
    if(event.keyCode == LEFT)
        camera.position.x += 2;
    else if(event.keyCode == RIGHT)
        camera.position.x -= 2;
    else if(event.keyCode == UP)
        camera.position.z += 2;
    else if(event.keyCode == DOWN)
        camera.position.z -= 2;
    else
        return;
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

function render() {
    controls.update();
    stats.update();
    renderer.render(scene, camera);

    picker.pick(pickPosition, camera, objects);
    if (pickedObject && pickedObject.uuid != picker.pickedObject?.uuid ){
        attachedTransform = false;
    }
    if(picker.pickedObject && !attachedTransform){
        pickedObject = picker.pickedObject;
        transform.detach();
     
        transform.attach(pickedObject);
        attachedTransform = true;
        console.log(pickedObject);
    }
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    updateLabels();
    requestAnimationFrame(render);
}

//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------

// -------------------- calls the init function when the window is done loading
init();
render();