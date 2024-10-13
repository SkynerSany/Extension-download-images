document.getElementById('download').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        // Сначала получаем все URL изображений
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: gatherImageUrls
        }, (results) => {
            const imageUrls = results[0].result;
            // Отображаем индикатор прогресса
            document.getElementById('progress-container').style.display = 'block';
            updateProgress(0, imageUrls.length);
            // Отправляем их фоновому скрипту для обработки
            chrome.runtime.sendMessage({ action: 'downloadImages', imageUrls });
        });
    });
});

// Функция для сбора URL всех изображений на странице
function gatherImageUrls() {
    const images = document.querySelectorAll('.page-break.no-gaps img');
    return Array.from(images).map(img => img.dataset['src'].slice(7));
}

// Функция для обновления прогресса
function updateProgress(completed, total) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const percentage = Math.round((completed / total) * 100);
    
    progressBar.style.width = percentage + '%';
    progressText.innerText = percentage + '%';
}

// Добавляем обработчик сообщений для обновления прогресса
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'updateProgress') {
        const { completed, total } = request;
        updateProgress(completed, total);
    }
});








// document.getElementById('download').addEventListener('click', () => {
//     // Запускаем content script на активной странице
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//         chrome.scripting.executeScript({
//             target: { tabId: tabs[0].id },
//             function: downloadImages
//         });
//     });
// });

// function downloadImages() {
//     const images = document.querySelectorAll('.page-break.no-gaps img');
    
//     images.forEach((image, index) => {
//         const url = image.dataset['src'].slice(7);
//         const filename = `image-${index + 1}.jpg`;
        
//         fetch(url)
//             .then(response => response.blob())
//             .then(blob => {
//                 setTimeout(() => {
//                     const blobUrl = window.URL.createObjectURL(blob);
//                     const a = document.createElement('a');
//                     a.href = blobUrl;
//                     a.download = filename;
//                     document.body.appendChild(a);
//                     a.click();
//                     console.log(index);
//                 }, index * 200);
//             })
//             .catch(console.error);
//     });
// }