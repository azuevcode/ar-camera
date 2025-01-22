import * as THREE from 'three';
// import { degToRad } from 'three/src/math/MathUtils.js';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('start');
const debug = document.getElementById('debug');

let camera, scene, renderer, point, sphere, cameraWrapper, orientationController;

startButton.addEventListener('click', async () => {
    /** 1. Запрос на получение данных об ориентации устройства (обязательно должен идти первым) */
    await startOrientation();

    /** 2. Запрос на доступ к камере устройства */
    await startCamera();

    /** 3. Создание 3Д-сцены */
    initScene();
    startOrientationTracking();
    
    renderer.setAnimationLoop(animate); 
});

async function startCamera() {
    try {
        // 1. Запуск задней камеры
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' } // Задняя камера
        });

        video.srcObject = stream;
    } catch (e) {
        alert('Ошибка запуска камеры');
    }
}


async function startOrientation () {
    try {
        if (typeof DeviceOrientationEvent === 'undefined') {
            throw new Error('DeviceOrientationEvent не поддерживается')
        }
    
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            const permission = await DeviceOrientationEvent.requestPermission();
    
            if (permission !== 'granted') {
                throw new Error('Нет доступа к DeviceOrientationEvent')
            }
        }
    } catch (e) {
        alert(e.message);
    }
}

function initScene () {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );

    cameraWrapper = new THREE.Group();
    cameraWrapper.add(camera);
    scene.add(cameraWrapper);

    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({ alpha: true, canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    addFixedPoints();
}



function addFixedPoints() {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
    const numPoints = 50;
    const spaceSize = 10;
  
    for (let i = 0; i < numPoints; i++) {
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        Math.random() * spaceSize - spaceSize / 2,
        Math.random() * spaceSize - spaceSize / 2,
        Math.random() * spaceSize - spaceSize / 2
      );
      scene.add(sphere);
    }
}

class OrientationController {
    constructor(cameraWrapper) {
      this.cameraWrapper = cameraWrapper;
      this.quaternion = new THREE.Quaternion();
      this.screenOrientation = window.screen.orientation.angle || 0; // Ориентация экрана в градусах
  
      this._bindOrientationEvent();
      this._bindScreenOrientationEvent();
    }
  
    _bindOrientationEvent() {
      window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
    }
  
    _bindScreenOrientationEvent() {
      window.addEventListener('orientationchange', () => {
        this.screenOrientation = window.screen.orientation.angle || 0;
      });
    }
  
    handleOrientation(event) {
      if (event.absolute && event.alpha !== null) {
        const alpha = THREE.MathUtils.degToRad(event.alpha); // Вокруг оси Z
        const beta = THREE.MathUtils.degToRad(event.beta);   // Вокруг оси X
        const gamma = THREE.MathUtils.degToRad(event.gamma); // Вокруг оси Y
  
        // Ориентация экрана
        const orient = THREE.MathUtils.degToRad(this.screenOrientation);
  
        // Формируем кватернион на основе углов
        const euler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
        this.quaternion.setFromEuler(euler);
  
        // Применяем корректировку для ориентации экрана
        this.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orient));
  
        // Применяем кватернион к группе камеры
        this.cameraWrapper.quaternion.copy(this.quaternion);
      }
    }
  }
  
  function startOrientationTracking() {
    orientationController = new OrientationController(cameraWrapper);
  }

  function animate() {
    renderer.render(scene, camera);
  }

