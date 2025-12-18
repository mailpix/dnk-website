document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    // 2. Validate and Load Data
    if (projectId && projectData[projectId]) {
        loadProject(projectData[projectId]);
    } else {
        console.error('Project not found');
        document.querySelector('.hero-content').innerHTML = '<h1>Project Not Found</h1>';
    }

    // 3. Header Scroll Effect
    const header = document.getElementById('detail-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 4. Trigger Entry Animation
    // Small delay to ensure DOM is ready for transition
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 50);
});

function loadProject(data) {
    // Populate Header
    document.getElementById('project-title').textContent = data.title;
    document.getElementById('project-subtitle').textContent = data.subtitle;
    document.getElementById('detail-hero').style.backgroundImage = `url('${data.heroImage}')`;

    // Populate Sidebar
    document.getElementById('project-client').textContent = data.client;
    document.getElementById('project-date').textContent = data.date;
    document.getElementById('project-description').textContent = data.description;

    // Populate Gallery with Magazine Logic
    const galleryContainer = document.getElementById('project-gallery');

    if (data.gallery && data.gallery.length > 0) {
        data.gallery.forEach((imgSrc, index) => {
            const imgWrapper = document.createElement('div');

            // Assign magazine classes based on index pattern for variety
            // Pattern: Portrait, Landscape, Square, Big, etc.
            // 6-item repeating pattern
            const pattern = index % 6;

            if (pattern === 0) imgWrapper.className = 'gallery-item item-tall'; // Portrait
            else if (pattern === 1) imgWrapper.className = 'gallery-item item-wide'; // Landscape
            else if (pattern === 2) imgWrapper.className = 'gallery-item item-big'; // Large Square
            else imgWrapper.className = 'gallery-item'; // Standard Square

            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = `${data.title} - Image ${index + 1}`;
            img.loading = "lazy";

            imgWrapper.appendChild(img);
            galleryContainer.appendChild(imgWrapper);
        });
    }
}
