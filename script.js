import * as THREE from 'three';
// import { degToRad } from 'three/src/math/MathUtils.js';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('start');
const debug = document.getElementById('debug');

let camera, scene, renderer, cameraWrapper, screenOrientation;
let deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };

startButton.addEventListener('click', async () => {
    /** 1. Запрос на получение данных об ориентации устройства (обязательно должен идти первым) */
    await startOrientation();

    /** 2. Запрос на доступ к камере устройства */
    await startCamera();

    /** 3. Создание 3Д-сцены */
    initScene();    
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

        window.addEventListener('deviceorientation', (event) => {
            deviceOrientation = event;
        });

        window.addEventListener('orientationchange', () => {
            screenOrientation = window.screen.orientation.angle || 0;
        });
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
    camera.position.set(0, 0, 0);

    cameraWrapper = new THREE.Group();
    cameraWrapper.add(camera);
    cameraWrapper.rotation.reorder('YXZ')
    scene.add(cameraWrapper);

    renderer = new THREE.WebGLRenderer({ alpha: true, canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    
    addVideoPlane();
    addFixedPoints();
    
    renderer.setAnimationLoop(animate); 
}

function addFixedPoints() {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
    const numPoints = 50;
    const radius = 10;
  
    for (let i = 0; i < numPoints; i++) {
      // Случайные углы
      const theta = Math.random() * Math.PI * 2; // Угол вокруг оси Y (азимут)
      const phi = Math.acos(2 * Math.random() - 1); // Угол от оси Z (зенит)

      // Преобразование сферических координат в декартовые
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      // Создаём точку
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, y, z);

      scene.add(sphere);
    }
}

function addVideoPlane() {
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    // Вычисляем соотношение сторон видео (или экрана)
    const aspectRatio = window.innerWidth / window.innerHeight;

    // Определяем высоту плоскости на основе угла обзора камеры
    const frustumHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * Math.abs(-11); // fov -> угол обзора
    const frustumWidth = frustumHeight * aspectRatio;

    // Создаём геометрию с учётом высоты и ширины
    const planeGeometry = new THREE.PlaneGeometry(frustumWidth, frustumHeight);
    const planeMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
    const videoPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    videoPlane.position.set(0, 0, -11);
    
    cameraWrapper.add(videoPlane);
}


function animate() {
    update();

    renderer.render(scene, camera);
}

function update() {
    const alphaRad = THREE.MathUtils.degToRad(deviceOrientation.alpha || 0);
    const betaRad = THREE.MathUtils.degToRad(deviceOrientation.beta || 0);
    const gammaRad = THREE.MathUtils.degToRad(deviceOrientation.gamma || 0);
    const orientRad = THREE.MathUtils.degToRad(screenOrientation || 0);

    setObjectQuaternion(cameraWrapper.quaternion, alphaRad, betaRad, gammaRad, orientRad);
}

const finalQuaternion = new THREE.Quaternion();
const zee = new THREE.Vector3(0, 0, 1); // Вектор "вверх".
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // Базовая коррекция.

function setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
  euler.set(beta, alpha, -gamma, 'YXZ'); // Установка углов в порядке YXZ.
  finalQuaternion.setFromEuler(euler);
  finalQuaternion.multiply(q1); // Коррекция.
  finalQuaternion.multiply(q0.setFromAxisAngle(zee, -orient)); // Учет ориентации экрана.
  quaternion.slerp(finalQuaternion, 0.99); // Плавное обновление кватерниона.
};

