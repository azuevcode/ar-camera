const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('start');
const dataField = document.getElementById('data');

startButton.addEventListener('click', async () => {
    await startOrientation();
    subscribeOrientation();

    await startCamera();
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

function subscribeOrientation() {
    window.addEventListener('deviceorientation', (event) => {
        const { alpha, beta, gamma } = event;

        dataField.innerHTML = `
            <p>alpha: ${alpha}</p>
            <p>beta: ${beta}</p>
            <p>gamma: ${gamma}</p>
        `;
    });
}