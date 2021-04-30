import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from '../node_modules/three/examples/jsm/controls/DragControls.js';
import { TransformControls } from '../node_modules/three/examples/jsm/controls/TransformControls.js'
import { CSS3DRenderer, CSS3DObject } from '/node_modules/three/examples/jsm/renderers/CSS3DRenderer.js'
import { Picker, PickPosition, intersectionPosition } from './picker.js';
import Stats from '../node_modules/three/examples/jsm/libs/stats.module.js';
import { CSS2DRenderer, CSS2DObject } from '/node_modules/three/examples/jsm/renderers/CSS2DRenderer.js'
import { FIGURES } from './figure.js';


// ----------------------------------------------------------------------------
//  global variables 
// ----------------------------------------------------------------------------


let scene, camera, renderer, light, controls;
let labelRenderer;

const objects = [];
const storyboards = [];

let board, board_child, board_wall, storyboard;

const LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40;
let ADD;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

let string = '<div>' + '<h1>Scene</h1>' + '</div>';
let cssScene;

let transform;
let dragControls;


window.requestAnimationFrame(render);

const container = document.getElementById('container');   
  
const picker = new Picker();
const pickPosition = new PickPosition();

const dropPosition = new PickPosition();

// --- added the stats panel --- //
let stats = new Stats();
document.body.appendChild(stats.domElement);


// ----------------------------------------------------------------------------
// end of global variables
// ----------------------------------------------------------------------------


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
    //light = new THREE.DirectionalLight(0xffffff, 2);
    //light.position.set(1,1,1);
    scene.add(light);
    

    // --- create the renderer --- //
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding; //configure textures referenced from .glb
    container.appendChild(renderer.domElement); // to be able to locate on the browser

    /*labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'fixed';
    labelRenderer.domElement.style.top = '0px';
    //document.body.appendChild(labelRenderer.domElement);
    container.appendChild(labelRenderer.domElement);*/

    /*labelRenderer = new CSS3DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    //renderer.domElement.appendChild(labelRenderer.domElement);
    //document.body.appendChild(labelRenderer.domElement);
    container.appendChild(labelRenderer.domElement);*/
   
    /*const floorGometry = new THREE.PlaneGeometry( 400, 80 );
    const floorMaterial = new THREE.MeshBasicMaterial( {color: 0xaaaaaa} );
    const floor = new THREE.Mesh( floorGometry, floorMaterial );
    floor.rotation.x = - Math.PI / 2;
    scene.add( floor );*/

    // --- create the floor --- // 
    const grid = new THREE.GridHelper(1000, 200);
    grid.material.opacity = 0.2;
    grid.color = 0xeeeeee;
    grid.material.depthWrite = false; // avoid z-fighting
    grid.material.transparent = true;
    scene.add( grid );

    //create Storyboard
    createStoryboard();

    // -------------------------------------- tried something with CCS2D or CCS3D Renderer   
    /*let boardDiv = new THREE.Object3D();
    //boardDiv = document.getElementById("info");
    boardDiv.appendChild(document.createTextNode('Scene'));
    board_wall.add(boardDiv);*/

    //const boardDiv = createCSS3DObject(string);
    //boardDiv.position.set(1,1,1);
    //scene.add(boardDiv);
    //console.log(boardDiv);

    /*cssScene = new THREE.Scene();
    let element = document.createElement('div');
    element.innerHTML = 'Scene';
    element.style.background = "#0094ff";
    element.style.color = "white";
    element.style.padding = "2px";
    element.style.border = "0px";
    element.style.margin = "0px";
    let div = new CSS3DObject(element);
   //div.position.x = 0;
    //div.position.y = 0;
   // div.position.z = 0;
    board_wall.add(div);
    const fontLoader = new THREE.FontLoader();
    const font = loader.load('fonts/helvetiker_bold.typeface.json', function(font){
        scene.add(font);
    })

    var textScene = document.createElement('div');
    container.appendChild(textScene);
    textScene.className = 'infoText';
    textScene.textContent = "Scene";
    console.log(textScene);
    
    scene.add(textScene);*/

    /*const boardDiv = document.createElement('div');
    boardDiv.className = 'label';
    boardDiv.textContent = 'Scene';
    boardDiv.style.marginTop = '-1em';
    const boardLabel = new CSS2DObject(boardDiv);
    board_wall.add(boardLabel);*/

    /*var textGeo = new THREE.TextGeometry();
    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    var material = new THREE.MeshFaceMaterial([
        new THREE.MeshPhongMaterial({color: 0xff22cc, shading: THREE.FlatShading}), // front
        new THREE.MeshPhongMaterial({color: 0xff22cc, shading: THREE.SmoothShading}) // side
    ]);

    var textMesh = new THREE.Mesh(textGeo, material);
    textMesh.position.x = -textGeo.boundingBox.max.x / 2;
    textMesh.position.y = -200;
    textMesh.name = 'text';
    scene.add(textMesh);*/    

    // -------------------------------------- end of creating the storyboard
                   
    // --- add the Orbit Control, it rotates the camera and enforces the camera up direction--- // 
    controls = new OrbitControls(camera, renderer.domElement);
    //controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.target.set(0,1.6, 0);
    controls.update();
    //controls.addEventListener('change', render);

    // -------------------------------------- end of orbit control

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

    /*if(picker > 0){
        transform.attach(objects);
        scene.add(transform);
    }else{
        transform.detach();
        scene.remove(transform);
    }*/
    // -------------------------------------- end of transform control

    // --- generates a prefiltered, midmapped radiance environment MAP --- //
    //let pmremGenerator = new THREE.PMREMGenerator( renderer );
    //pmremGenerator.compileEquirectangularShader();


    // -------------------------------------- add event listener
    document.addEventListener("keydown", onKeyDown, false);

    /*let valueName = document.getElementById("name");
    let valueX = document.getElementById("x");
    let valueY = document.getElementById("y");
    valueX.value = event.clientX.toFixed(3);
    valueY.value = event.clientY.toFixed(3);
    valueX.addEventListener('change', changeValueX);
    function changeValueX(event){
       // objects = parseFloat(event.target.value)
    };*/

    window.addEventListener('click', (event) => pickPosition.setPosition(event, renderer.domElement));
    window.addEventListener('mouseout', () => pickPosition.reset());
    window.addEventListener('mouseleave', () => pickPosition.reset());

    //drag background to the wall of the board
    //setupDragDrop();

    // --- Drag function --- //
    //dragControl();

};
// ----------------------------------------------------------------------------
//  End of Init Function
// ----------------------------------------------------------------------------





// ----------------------------------------------------------------------------
//  create the Storyboard Function
// ----------------------------------------------------------------------------
function createStoryboard(){
    // --- create the first storyboard--- //
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

    // --- add the label of the scene --- // 
    //possible idea on https://threejsfundamentals.org/threejs/lessons/threejs-billboards.html
    // another idea https://threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
    /*const map = new THREE.TextureLoader().load('sprite.png');
    const material = new THREE.SpriteMaterial({map: map});
    const sprite = new THREE.Sprite(material);
    scene.add(sprite);*/


}
// ----------------------------------------------------------------------------
//  End of the Storyboard Function
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// CSS3D Renderer - most probably delete it ;-) 
// ----------------------------------------------------------------------------
/*function createCSS3DObject(s){
    let element = document.createElement('div');
    element.innerHTML = s;
    let div = element.firstChild;
  
    let objectText = new CSS3DObject(div);
    return objectText;

}*/


function createFigures(){
    for (const fig of FIGURES) {
        const element = document.getElementById(fig.domElement);
        function spawnFigure(event){
            dropPosition.setPosition(event, renderer.domElement);
            const pos = intersectionPosition(dropPosition, camera, storyboards);
            const loader = new GLTFLoader();
            loader.load(fig.imagePath, (gltf) => {
                const figure = gltf.scene;
                figure.scale.set(fig.scale.x, fig.scale.y, fig.scale.z);
                figure.position.set(pos.x, pos.y, pos.z);
                scene.add(figure);
                objects.push(figure);
            })
        }

        element.addEventListener("dragend", spawnFigure, false);
    
    }
}

createFigures();


// ----------------------------------------------------------------------------
//  DragControl Function - drag and drop the gltf-objects around the scene
// ----------------------------------------------------------------------------
function dragControl(){
    dragControls = new DragControls(objects, camera, renderer.domElement);
    
    dragControls.addEventListener('dragstart', function(event){
        controls.enabled = false;
       //event.object.material.emissive.set( 0x666666 );
    });
    dragControls.addEventListener('dragend', function(event){
        controls.enabled = true;
        event.object.material.emissive.set( 0x000000 );
        //event.object.position.y = 0.2; 
    });
    dragControls.addEventListener('drag', function(event){
        event.object.material.emissive.set( 0x666666 );
        //event.object.position.y = 0;
    });

}
// ----------------------------------------------------------------------------
//  End of DragControl Function
// ----------------------------------------------------------------------------

function setupDragDrop(){
    let holder = document.getElementById('holder');


    if (typeof window.FileReader === 'undefined') {
        console.error("Filereader not supported");
    }

    holder.ondragover = function () {
        this.className = 'hover';
        return false;
    };
    holder.ondragend = function () {
        this.className = '';
        return false;
    };

    holder.ondrop = function (e) {
        this.className = '';
        e.preventDefault();

        var file = e.dataTransfer.files[0],
                reader = new FileReader();
        reader.onload = function (event) {
            console.log(event.target);
            console.log(event);
            holder.style.background = 'url(' + event.target.result + ') no-repeat center';

            var image = document.createElement('img');
            image.src = event.target.result;
            //var texture = new THREE.Texture(image);
            //texture.needsUpdate = true;

            //scene.getObjectByName('cube').material.map = texture;
        };
        reader.readAsDataURL(file);

        return false;
    }
}

// ----------------------------------------------------------------------------
//  Resize Function - reports the window size each time it is resized
// ----------------------------------------------------------------------------
window.addEventListener('resize', onWindowResize, false);


function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    //labelRenderer.setSize(window.innerWidth, window.innerHeight);
}
// ----------------------------------------------------------------------------
//  End of Resize Function
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
//  onKeyDown Function - to move around the scene
// ----------------------------------------------------------------------------
function onKeyDown(e){
    if(e.keyCode == LEFT)
        scene.position.x += 2;
    else if(e.keyCode == RIGHT)
        scene.position.x -= 2;
    else if(e.keyCode == UP)
        scene.position.z += 2;
    else if(e.keyCode == DOWN)
        scene.position.z -= 2;
    else
        return;
}
// ----------------------------------------------------------------------------
//  End of onKeyDown Function
// ----------------------------------------------------------------------------


let pickedObject,attachedTransform;

// ----------------------------------------------------------------------------
//  Render Function
// ----------------------------------------------------------------------------
function render() {
    controls.update();
    stats.update();
    renderer.render(scene, camera);
    //labelRenderer.render(scene, camera);
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
    requestAnimationFrame(render);
}
// ----------------------------------------------------------------------------
//  End of Render Function
// ----------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------

// -------------------- calls the init function when the window is done loading
init();
render();