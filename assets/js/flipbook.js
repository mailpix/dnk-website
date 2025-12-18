document.addEventListener('DOMContentLoaded', () => {
    // Check if pdfjsLib is loaded
    if (typeof pdfjsLib === 'undefined') {
        console.error("PDF.js library not loaded!");
        return;
    }

    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const modal = document.getElementById('flipbook-modal');
    const bookContainer = document.getElementById('book-wrapper');
    const closeBtn = document.getElementById('flipbook-close');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    let pdfDoc = null;
    let pages = [];
    let currentPageIndex = 0;

    // --- Open Modal & Load ---
    window.openFlipbook = async () => {
        modal.classList.add('active'); // Show modal
        // LOCK SCROLL
        document.body.style.overflow = 'hidden';

        // Setup Download Button Link (Google Drive)
        const driveId = '1fdITZVaY8SDBfqtxIjWAg5JV422nX-RD';
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
        const dlBtn = document.getElementById('flipbook-download');
        if (dlBtn) dlBtn.href = downloadUrl;

        if (!pdfDoc) {
            try {
                // Show loading
                bookContainer.innerHTML = '<div style="color:white; text-align:center; margin-top:50%;">Loading Document...</div>';

                // Load PDF (Use LOCAL file for Viewer to avoid CORS errors)
                const viewerUrl = 'assets/docs/company_profile.pdf';

                const loadingTask = pdfjsLib.getDocument(viewerUrl);
                pdfDoc = await loadingTask.promise;
                console.log("PDF Loaded, pages:", pdfDoc.numPages);

                // Render Pages
                await renderBook();
            } catch (error) {
                console.error("Error loading PDF:", error);

                // Show Error + Fallback Download Link
                bookContainer.innerHTML = `<div style="color:white; text-align:center; padding-top:20%;">
                    <p style="font-size:1.2rem; margin-bottom:10px;">Error loading preview</p>
                    <p style="opacity:0.7; margin-bottom:20px;">${error.message}</p>
                    <a href="${downloadUrl}" target="_blank" class="flip-download-btn" style="display:inline-flex; background:white; color:black;">
                        <i class="fas fa-download" style="margin-right:8px;"></i> Download PDF
                    </a>
                </div>`;
            }
        }
    };

    // --- Close Modal ---
    const closeModal = () => {
        modal.classList.remove('active');
        // UNLOCK SCROLL
        document.body.style.overflow = '';
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // --- Render Book Structure ---
    const renderBook = async () => {
        bookContainer.innerHTML = ''; // Clear loading
        pages = [];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);

            // Create Page Element
            const pageDiv = document.createElement('div');
            pageDiv.classList.add('book-page');
            // Z-Index: Page 1 is highest (on top), Last page lowest.
            pageDiv.style.zIndex = pdfDoc.numPages - i + 1;
            pageDiv.dataset.page = i;

            // Render to Canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 1.5 }); // Good quality

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            pageDiv.appendChild(canvas);
            bookContainer.appendChild(pageDiv);

            // Render
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            pages.push(pageDiv);

            // Click on page to flip
            pageDiv.addEventListener('click', () => {
                if (pageDiv.classList.contains('flipped')) {
                    prevPage();
                } else {
                    nextPage();
                }
            });
        }

        updateControls();
    };

    // --- Navigation Logic ---
    window.nextPage = () => {
        if (currentPageIndex < pages.length) {
            const pageToFlip = pages[currentPageIndex];
            pageToFlip.classList.add('flipped');
            currentPageIndex++;
            updateControls();
        }
    };

    window.prevPage = () => {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            const pageToFlipBack = pages[currentPageIndex];
            pageToFlipBack.classList.remove('flipped');
            updateControls();
        }
    };

    const updateControls = () => {
        if (prevBtn) prevBtn.disabled = currentPageIndex === 0;
        if (nextBtn) nextBtn.disabled = currentPageIndex === pages.length;
    };

    // Bind Buttons
    if (nextBtn) nextBtn.addEventListener('click', window.nextPage);
    if (prevBtn) prevBtn.addEventListener('click', window.prevPage);

    // Key Handling
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'ArrowRight') window.nextPage();
        if (e.key === 'ArrowLeft') window.prevPage();
        if (e.key === 'Escape') closeModal();
    });
});
