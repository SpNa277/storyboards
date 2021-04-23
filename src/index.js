import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from '../node_modules/three/examples/jsm/controls/DragControls.js';
import { TransformControls } from '../node_modules/three/examples/jsm/controls/TransformControls.js'
import { CSS3DRenderer } from '/node_modules/three/examples/jsm/renderers/CSS3DRenderer.js'
import { Picker, PickPosition } from './picker.js';


// ----------------------------------------------------------------------------
//  global variables 
// ----------------------------------------------------------------------------
let container;

let scene, camera, renderer, light, controls;

let objects = [];

let board, board_child, board_wall, storyboard;

const LEFT = 37, RIGHT = 39, UP = 38, DOWN = 40;
let ADD;

//let raycaster = new THREE.Raycaster();
//let mouse = new THREE.Vector2();

let text = '<div>' + '<h1>Scene 1</h1>' + '</div>';
let cssElement;

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
    
    container = document.getElementById('container');   

    // --- create the scene --- //
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x777c8e);

    // --- create and locate the camera --- //
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000);
    camera.position.set(0, 7, 20);

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
    //document.body.appendChild(renderer.domElement);
    container.appendChild(renderer.domElement);

   
    // --- create the floor --- // 
    /*const floorGometry = new THREE.PlaneGeometry( 400, 80 );
    const floorMaterial = new THREE.MeshBasicMaterial( {color: 0xaaaaaa} );
    const floor = new THREE.Mesh( floorGometry, floorMaterial );
    floor.rotation.x = - Math.PI / 2;
    scene.add( floor );*/

    const grid = new THREE.GridHelper(1000, 200);
    grid.material.opacity = 0.2;
    grid.color = 0xeeeeee;
    grid.material.depthWrite = false; // avoid z-fighting
    grid.material.transparent = true;
    scene.add( grid );

    // --- create the storyboard with different squares--- //
    const boardGeometry = new THREE.BoxGeometry(20, 0.9, 20);
    const boardMaterial = new THREE.MeshLambertMaterial( {color: 0xeeeeee, side:THREE.DoubleSide });
    const boardGeometry_child = new THREE.BoxGeometry(19, 1, 18);
    const boardMaterial_child = new THREE.MeshLambertMaterial( {color: 0xc6c2c2, side:THREE.DoubleSide });
    const boardGeometry_wall = new THREE.BoxGeometry(20, 15, 0.9);

    storyboard = new THREE.Group();

    for (let x = 0; x < 1; x++) {
            
        board = new THREE.Mesh(boardGeometry, boardMaterial);
        board_child = new THREE.Mesh(boardGeometry_child, boardMaterial_child);
        board_wall = new THREE.Mesh(boardGeometry_wall, boardMaterial);

        //board.position.x = x * 50;

        storyboard.add(board);
        board.add(board_child);

        board_wall.position.y = 7;
        board_wall.position.z = -10;

        board.add(board_wall);
        
       /* // --- create the css Element for the Text --//
        cssElement = createCSS3DObject(text);
        cssElement.position.set(5,5,5);
        board_wall.add(cssElement);*/
    
    }

    scene.add(storyboard);

    let addingBoard = document.getElementById("addingStoryboard");
    addingBoard.addEventListener("click", addStoryboard, false);

    let pos = 50;

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

    }
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

    window.addEventListener('click', (event) => pickPosition.setPosition(event, renderer.domElement));
    window.addEventListener('mouseout', () => pickPosition.reset());
    window.addEventListener('mouseleave', () => pickPosition.reset());


    //drag background to the wall of the board
   // setupDragDrop();

};
// ----------------------------------------------------------------------------
//  End of Init Function
// ----------------------------------------------------------------------------

/*function createCSS3DObject(s) {
    // convert the string to dome elements
    var wrapper = document.createElement('div');
    wrapper.innerHTML = s;
    var div = wrapper.firstChild;

    // set some values on the div to style it, standard CSS
    div.style.width = '370px';
    div.style.height = '370px';
    div.style.opacity = 0.7;
    div.style.background = new THREE.Color(Math.random() * 0xffffff).getStyle();

    // create a CSS3Dobject and return it.
    var object = new THREE.CSS3DObject(div);
    return object;
}*/
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
       //event.object.material.emissive.set( 0x666666 );
    });
    dragControls.addEventListener('dragend', function(event){
        controls.enabled = true;
        event.object.material.emissive.set( 0x000000 );
        //event.object.position.y = 0.2; 
    });
    dragControls.addEventListener('drag', function(event){
        event.object.material.emissive.set( 0x666666 );
        event.object.position.y = 0;
    });

}
// ----------------------------------------------------------------------------
//  End of DragControl Function
// ----------------------------------------------------------------------------

/*function setupDragDrop(){
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
            var texture = new THREE.Texture(image);
            texture.needsUpdate = true;

            scene.getObjectByName('cube').material.map = texture;
        };
        reader.readAsDataURL(file);

        return false;
    }
}*/

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
function render() {
    controls.update();
    renderer.render( scene, camera );
    picker.pick(pickPosition, camera, objects);
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