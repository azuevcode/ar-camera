import * as THREE from 'three';
// import { degToRad } from 'three/src/math/MathUtils.js';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('start');
const debug = document.getElementById('debug');

let camera, scene, renderer, point, sphere;
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
            const { alpha, beta, gamma } = event;

            const betaRad = THREE.MathUtils.degToRad(beta || 0);

            deviceOrientation = {
                alpha: THREE.MathUtils.degToRad(alpha || 0),
                beta: betaRad,   // Наклон вверх/вниз
                gamma: Math.abs(betaRad - Math.PI / 2) < 0.1 ? 0 : THREE.MathUtils.degToRad(gamma || 0), // Наклон влево/вправо
            }

            debug.innerHTML = `
                <p>alfa = ${alpha?.toFixed(2)}</p>
                <p>beta = ${beta?.toFixed(2)}</p>
                <p>gamma = ${gamma?.toFixed(2)}</p>
            `
        });
    } catch (e) {
        alert(e.message);
    }
}

function initScene () {
    createScene();
    createPerspectiveCamera();
    createRenderer();

    createSphere();
    createPoint();
}

function createScene() {
    scene = new THREE.Scene();
}

function createPerspectiveCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0); 
}

function createSphere() {
    const geometry = new THREE.SphereGeometry(10, 20, 20); 
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true, // Границы
    });
    sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, 0);

    scene.add(sphere);
}

function createPoint() {
    // --- 2. Параметры точки ---
    const radius = 10; // Радиус сферы
    const phi = Math.PI / 4; // Угол широты (45 градусов)
    const theta = Math.PI / 3; // Угол долготы (60 градусов)

    // Преобразование сферических координат в декартовые:
    const x = radius * Math.sin(phi) * Math.cos(theta); // X-координата точки
    const y = radius * Math.cos(phi);                  // Y-координата точки
    const z = radius * Math.sin(phi) * Math.sin(theta); // Z-координата точки

    // --- 3. Создание точки ---
    const pointGeometry = new THREE.SphereGeometry(0.5, 16, 16); // Маленькая сфера
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Красная точка
    const point = new THREE.Mesh(pointGeometry, pointMaterial);

    // Устанавливаем позицию точки относительно сферы
    point.position.set(x, y, z);

    // Добавляем точку на сферу
    sphere.add(point);
}

function createRenderer() {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setAnimationLoop(animate); 
}

function animate() {
    const { alpha, beta, gamma } = deviceOrientation;
     
   // Обновляем ориентацию камеры с правильным порядком вращений
   camera.setRotationFromEuler(new THREE.Euler(
    beta + THREE.MathUtils.degToRad(90),   // Вверх-вниз (по X)
    -gamma, // Влево-вправо (по Y)
    alpha,                                     // Не используем Z
    'YXZ'                                  // Порядок вращений
));

    renderer.render( scene, camera );
}
