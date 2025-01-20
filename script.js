import * as THREE from 'three';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('start');
const dataField = document.getElementById('data');
const sceneContainer = document.getElementById('scene');
const pointNode = document.getElementById('point');

let camera, scene, renderer, point;
let deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };

startButton.addEventListener('click', async () => {
    /** 1. Запрос на получение данных об ориентации устройства (обязательно должен идти первым) */
    await startOrientation();

    /** 2. Запрос на доступ к камере устройства */
    await startCamera();

    /** 3. Создание 3Д-сцены */
    initScene();
    
    // tintsIn3D);

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

        window.addEventListener('deviceorientation', (event) => {
            const { alpha, beta, gamma } = event;
    
            dataField.innerHTML = `
                <p>alpha: ${alpha}</p>
                <p>beta: ${beta}</p>
                <p>gamma: ${gamma}</p>
            `;

            deviceOrientation = {
                alpha,
                beta,   // Наклон вверх/вниз
                gamma, // Наклон влево/вправо
            }
        });
    } catch (e) {
        alert(e.message);
    }
}

const z = -7;

function initScene () {
     // 1. Создание сцены
     scene = new THREE.Scene();

     // 2. Настройка камеры
     camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    //  camera.position.z = 0; // Камера на расстоянии 10 от центра
 
     // 3. Рендерер
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
 
     // 4. Текстура из видео
     const videoTexture = new THREE.VideoTexture(video);
     const planeGeometry = new THREE.PlaneGeometry(16, 9); // Пропорции плоскости
     const planeMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
     const videoPlane = new THREE.Mesh(planeGeometry, planeMaterial);
     videoPlane.position.set(0, 0, -8);
     scene.add(videoPlane);
 
     // 5. Создание точки
     const pointGeometry = new THREE.SphereGeometry(0.5, 16, 16); // Геометрия сферы
     const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x008000 });
     point = new THREE.Mesh(pointGeometry, pointMaterial);
 
     // Размещаем точку в центре
     point.position.set(0, 0, z); // Позиция точки в сцене (x=2, y=1, z=-5)

     console.log('Точка:', point.position);
     console.log('Камера:', camera.position);
     scene.add(point);

     renderer.setAnimationLoop(animate); // Устанавливаем цикл рендера
}

const initialPoint = new THREE.Vector3(0, 0, z);

function animate() {
    // const { alpha, beta, gamma } = deviceOrientation;
    
    // const x = (Math.sin(alpha) * Math.cos(alpha)) / z; 
    // const correctedBeta = Math.atan(Math.tan(toRad(90) + beta) / Math.cos(gamma));

    // const y = z * Math.tan(correctedBeta);

    rotatePointWithFixedZ();

    // Логируем направление камеры
    pointNode.innerHTML = `Расположение точки: x=${point.x}, y=${point.y}`;


    renderer.render( scene, camera );
}

// Функция для расчёта новых координат с фиксированным z
function rotatePointWithFixedZ() { 
    const { alpha, beta, gamma} =deviceOrientation;
 // Преобразуем углы в радианы
 const alphaRad = THREE.MathUtils.degToRad(alpha);
 const betaRad = THREE.MathUtils.degToRad(beta);
 const gammaRad = THREE.MathUtils.degToRad(gamma);

 // Создаём матрицу вращения
 const rotationMatrix = new THREE.Matrix4();
 rotationMatrix.makeRotationFromEuler(new THREE.Euler(betaRad, alphaRad, gammaRad, 'YXZ'));

 // Преобразуем позицию точки
 const originalPoint = new THREE.Vector3(0, 0, -5);
 const newPoint = originalPoint.clone().applyMatrix4(rotationMatrix);

 // Обновляем координаты точки
 point.position.set(newPoint.x, newPoint.y, newPoint.z);
}


// Функция для расчёта координат
function calculatePointPosition() {
    const { alpha, beta, gamma } = deviceOrientation;

    const z = -7;

    // Промежуточные координаты (учитываем alpha и beta)
    const xPrime = z * Math.cos(beta) * Math.sin(alpha); // Горизонтальное смещение
    const yPrime = z * Math.sin(beta);                     // Вертикальное смещение

    // Корректируем координаты с учётом gamma
    const x = xPrime * Math.cos(gamma) - yPrime * Math.sin(gamma);
    const y = xPrime * Math.sin(gamma) + yPrime * Math.cos(gamma);

    return { x, y };
}

async function getMyLocation() {
    const locationPromise = new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Геолокация не поддерживается вашим браузером.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({ latitude, longitude });
            },
            (error) => {
                reject(new Error(`Ошибка получения координат: ${error.message}`));
            }
        );
    });

    return await locationPromise;
}

function convertPointsTo3D(myLocation, points) {
    return points.map(({ latitude, longitude, id }) => {
        const R = 6371000; // Радиус Земли в метрах
    
        const deltaLat = (latitude - myLocation.latitude) * (Math.PI / 180);
        const deltaLon = (longitude - myLocation.longitude) * (Math.PI / 180);
    
        const x = deltaLon * R * Math.cos(myLocation.latitude * Math.PI / 180); // Долгота → x
        const z = deltaLat * R; // Широта → z
    
        return { x, z, id };
    })
}

async function fetchPoints() {
    const points = await Promise.resolve([
        { id: 1, latitude: 55.806936, longitude: 37.723933 },
        { id: 2, latitude: 55.805419, longitude: 37.723500 }
    ]);

    return points;
}

function appendPointsToScene(points) {
    points.forEach(({ x, z, id }) => {
        // Создаём объект (точка)
        const geometry = new THREE.SphereGeometry(1, 100, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0x008000 });
        const point = new THREE.Mesh(geometry, material);
    
        // Устанавливаем позицию объекта
       point.position.set(22, 0, 77);
    
        // Сохраняем ID объекта для взаимодействия
        point.userData.id = id;
    
        // Добавляем объект в сцену
        scene.add(point);
    });
}

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

function toDeg(rad) {
    return (rad * 180) / Math.PI;
}