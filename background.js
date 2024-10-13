// Подключаем JSZip и jsPDF
importScripts('jszip.min.js', 'jspdf.umd.min.js');

const { jsPDF } = self.jspdf; // Используем self вместо window

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'downloadImages') {
        const { imageUrls } = request;
        downloadImagesAsZip(imageUrls);
        downloadImagesAsPDF(imageUrls); // Добавляем создание PDF
    }
});

// Функция для скачивания изображений и создания ZIP-файла
function downloadImagesAsZip(imageUrls) {
    const zip = new JSZip();
    const imgFolder = zip.folder("images");
    let promises = [];

    imageUrls.forEach((url, index) => {
        const filename = `image-${index + 1}.jpg`;

        // Загружаем изображение через fetch и добавляем его в ZIP
        const promise = fetch(url)
            .then(response => response.blob())
            .then(blob => {
                imgFolder.file(filename, blob);
                // Обновляем прогресс в popup
                chrome.runtime.sendMessage({ action: 'updateProgress', completed: index + 1, total: imageUrls.length });
            })
            .catch(console.error);

        promises.push(promise);
    });

    // Когда все изображения загружены, создаем ZIP и преобразуем его в base64
    Promise.all(promises).then(() => {
        zip.generateAsync({ type: 'blob' }).then((content) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const dataUrl = e.target.result;

                // Загружаем файл через Chrome Downloads API
                chrome.downloads.download({
                    url: dataUrl,
                    filename: 'images.zip'
                });
            };
            reader.readAsDataURL(content);
        });
    });
}

// Функция для создания PDF из изображений
function downloadImagesAsPDF(imageUrls) {
    const pdf = new jsPDF();
    
    // Функция для добавления изображения в PDF
    const addImageToPDF = (index) => {
        if (index >= imageUrls.length) {
            // Когда все изображения добавлены, сохраняем PDF
            const pdfData = pdf.output('datauristring'); // Получаем PDF как data URI
            chrome.downloads.download({
                url: pdfData,
                filename: 'images.pdf'
            });
            return;
        }

        const url = imageUrls[index];
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const imgData = reader.result;
                    // Добавляем изображение в PDF
                    if (index > 0) {
                        pdf.addPage(); // Добавляем новую страницу для всех, кроме первой
                    }
                    pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0); // Измените размеры по необходимости
                    addImageToPDF(index + 1); // Добавляем следующее изображение
                };
                reader.readAsDataURL(blob); // Преобразуем blob в Data URL
            })
            .catch(console.error);
    };

    addImageToPDF(0); // Начинаем добавление изображений с первого
}
