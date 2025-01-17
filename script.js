const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('start');
const dataField = document.getElementById('data');

startButton.addEventListener('click', async () => {
    subscribeOrientation();

    alert('vvvv')

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