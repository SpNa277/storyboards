import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from '../node_modules/three/examples/jsm/controls/DragControls.js';
import { TransformControls } from '../node_modules/three/examples/jsm/controls/TransformControls.js'
import { Picker, PickPosition } from './picker.js';


// ----------------------------------------------------------------------------
//  global variables 
// ----------------------------------------------------------------------------
let scene, camera, renderer, light, controls;

let objects = [];

let board, storyboard;

const LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40;
let ADD;

//let raycaster = new THREE.Raycaster();
//let mouse = new THREE.Vector2();

// ----------------------------------------------------------------------------
// end of global variables
// ----------------------------------------------------------------------------


window.requestAnimationFrame(render);

  
const picker = new Picker();
const pickPosition = new PickPosition();


   


// ----------------------------------------------------------------------------
//  Init Function - initialize the project
// ----------------------------------------------------------------------------
let init = function(){

    // --- create the scene --- //
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    

    // --- create and locate the camera --- //
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000);
    camera.position.set(0, 5, 20);

    // --- create the light --- //
    light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    

    // --- create the renderer --- //
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding; //configure textures referenced from .glb
    // --- to be able to locate on the browser --- //
    document.body.appendChild(renderer.domElement);
   
    // --- create the floor --- // 
    const floorGometry = new THREE.PlaneGeometry( 400, 400 );
    const floorMaterial = new THREE.MeshBasicMaterial( {color: 0x567d46} );
    const floor = new THREE.Mesh( floorGometry, floorMaterial );
    floor.rotation.x = - Math.PI / 2;
    scene.add( floor );

    // --- create the storyboard with different squares--- //
    const boardGeometry = new THREE.BoxGeometry(10, 1, 10);
    const boardMaterial = new THREE.MeshBasicMaterial( {color: 0x444444 });
                    
    storyboard = new THREE.Group();

    for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 2; z++) {
            
            board = new THREE.Mesh(boardGeometry, boardMaterial);

            board.position.x = x * 12;
            board.position.z = z * 12;
            //board.position.set(x*10, 0, z*10);
            storyboard.add(board);
        }
    }
    scene.add(storyboard);
    // -------------------------------------- end of creating the storyboard
                   
    // --- add the Orbit Control, it rotates the camera and enforces the camera up direction--- // 
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0,1.6, 0);
    controls.update();

    // --- generates a prefiltered, midmapped radiance environment MAP --- //
    let pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();




    // --- Drag function --- //
    dragControl();

    //
    document.addEventListener("keydown", onKeyDown, false);

    window.addEventListener('mousemove', (event) => pickPosition.setPosition(event, renderer.domElement));
    window.addEventListener('mouseout', (event) => pickPosition.reset());
    window.addEventListener('mouseleave', (event) => pickPosition.reset());


};
// ----------------------------------------------------------------------------
//  End of Init Function
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
//  OnClick Function - adding gltf-objects by clicking on the menu
// ----------------------------------------------------------------------------

    let addingMan = document.getElementById("man");
    addingMan.addEventListener("click", addMan, false);

    function addMan(){
        let loader = new GLTFLoader();
        loader.load("../src/img/man.glb", function(gltf){ 
            let figure = gltf.scene;
            figure.scale.set(2, 2, 2);
            console.log(figure);
            figure.position.set(-20,2,2);
            scene.add(figure);
            objects.push(figure);  
                         
        },
        function(xhr){
            console.log((xhr.loaded / xhr.total*100)+ '% loaded');
        }, 
        function(error){
            console.log('An error happened');
        });
    }

    let addingWoman = document.getElementById("woman");
    addingWoman.addEventListener("click", addWoman, false);
    function addWoman(){
        let loader = new GLTFLoader();        
        loader.load("../src/img/woman.glb", function(gltf){ 
            let figure = gltf.scene;
            figure.scale.set(2, 2, 2);
            console.log(figure);
            figure.position.set(-18,2,2);
            scene.add(figure); 
            objects.push(figure);                               
        },
        function(xhr){
            console.log((xhr.loaded / xhr.total*100)+ '% loaded');
        }, 
        function(error){
            console.log('An error happened');
        });
    }

    let addingTable = document.getElementById("table");
    addingTable.addEventListener("click", addTable, false);
    function addTable(){
        let loader = new GLTFLoader();                   
        loader.load("../src/img/table.glb", function(gltf){ 
            let figure = gltf.scene;                      
            console.log(figure);
            figure.position.set(-15,2,2);
            scene.add(figure); 
            objects.push(figure);                                
        },
        function(xhr){
            console.log((xhr.loaded / xhr.total*100)+ '% loaded');
        }, 
        function(error){
            console.log('An error happened');
        });
    }

    let addingBicycle = document.getElementById("bicycle");
    addingBicycle.addEventListener("click", addBicycle, false);
    function addBicycle(){
        let loader = new GLTFLoader();                   
        loader.load("../src/img/bicycle.glb", function(gltf){ 
            let figure = gltf.scene;  
            figure.scale.set(1.5, 1.5, 1.5);                    
            console.log(figure);
            figure.position.set(-12,2,2);
            scene.add(figure); 
            objects.push(figure);                                
        },
        function(xhr){
            console.log((xhr.loaded / xhr.total*100)+ '% loaded');
        }, 
        function(error){
            console.log('An error happened');
        });
    }

    let addingFactory = document.getElementById("factory");
    addingFactory.addEventListener("click", addFactory, false);
    function addFactory(){
        let loader = new GLTFLoader();                   
        loader.load("../src/img/factory.glb", function(gltf){ 
            let figure = gltf.scene;    
            figure.scale.set(5, 5, 5);                  
            console.log(figure);
            figure.position.set(-10,2,2);
            scene.add(figure);
            objects.push(figure);                                
        },
        function(xhr){
            console.log((xhr.loaded / xhr.total*100)+ '% loaded');
        }, 
        function(error){
            console.log('An error happened');
        });
    }

    let addingMeetingroom = document.getElementById("meetingroom");
    addingMeetingroom.addEventListener("click", addMeetingroom, false);
    function addMeetingroom(){
        let loader = new GLTFLoader();                   
        loader.load("../src/img/meeting_room.glb", function(gltf){ 
            let figure = gltf.scene;   
            figure.scale.set(3,3,3);                     
            console.log(figure);
            figure.position.set(-8,2,2);
            scene.add(figure);  
            objects.push(figure);                                
        },
        function(xhr){
            console.log((xhr.loaded / xhr.total*100)+ '% loaded');
        }, 
        function(error){
            console.log('An error happened');
        });
    }


// ----------------------------------------------------------------------------
// End of OnClick Function
// ----------------------------------------------------------------------------



// ----------------------------------------------------------------------------
//  DragControl Function - drag and drop the gltf-objects around the scene
// ----------------------------------------------------------------------------
function dragControl(){
    let dragControls = new DragControls(objects, camera, renderer.domElement);

    dragControls.addEventListener('dragstart', function(event){
        controls.enabled = false;
        event.object.material.emissive.set( 0xaaaaaa );
    });
    dragControls.addEventListener('dragend', function(event){
        controls.enabled = true;
        event.object.material.emissive.set( 0x000000 );
        //event.object.position.y = 0.2; 
    });
}
// ----------------------------------------------------------------------------
//  End of DragControl Function
// ----------------------------------------------------------------------------


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
//  End of Resize Function
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
//  onKeyDown Function - to move around the scene with defined keys
// ----------------------------------------------------------------------------
function onKeyDown(e){
    if(e.keyCode == LEFT)
        scene.position.x += 0.2;
    else if(e.keyCode == RIGHT)
        scene.position.x -= 0.2;
    else if(e.keyCode == UP)
        scene.position.z += 0.2;
    else if(e.keyCode == DOWN)
        scene.position.z -= 0.2;
    else
        return;
}
// ----------------------------------------------------------------------------
//  End of onKeyDown Function
// ----------------------------------------------------------------------------



// ----------------------------------------------------------------------------
//  Render Function
// ----------------------------------------------------------------------------
function render(time) {
    time *= 0.001;
    controls.update();
    renderer.render( scene, camera );
    picker.pick(pickPosition, scene, camera, time, objects);
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