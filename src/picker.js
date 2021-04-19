import * as THREE from '../node_modules/three/build/three.module.js';


//based on https://threejsfundamentals.org/threejs/lessons/threejs-picking.html
export class Picker {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, camera, objects) {
    // restore the color if there is a picked object
    if (this.pickedObject) {
      this.pickedObject.material.emissive.set(0x000000);
      this.pickedObject = undefined;
    }

    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(objects, true);
    if (intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      // save its color
      //this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
      // set its emissive color 
      this.pickedObject.material.emissive.set(0x901e1e);
    }
  }
}

export class PickPosition {
  constructor() {
    this.x = undefined;
    this.y = undefined;
  }

  reset() {
    this.x = undefined;
    this.y = undefined;
  }

  setPosition(event, domElement) {
    const pos = getCanvasRelativePosition(event, domElement);
    this.x = (pos.x / domElement.width) * 2 - 1;
    this.y = (pos.y / domElement.height) * -2 + 1; // note we flip Y
  }
}

function getCanvasRelativePosition(event, domElement) {
  const rect = domElement.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * domElement.width) / rect.width,
    y: ((event.clientY - rect.top) * domElement.height) / rect.height,
  };  
}
