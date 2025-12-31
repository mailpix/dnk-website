const transformationData = [
    {
        id: 1,
        title: "Booth PLN Mobile | GIIAS Bandung",
        before: "https://lh3.googleusercontent.com/d/1kEeDRDBAmkXErXlLVih-gftZnxgBZ5oU", // User provided
        after: "https://lh3.googleusercontent.com/d/1cSCTzu1lM2tZpJOpe_7BpxKwaGRVexxM" // User provided
    },
    {
        id: 2,
        title: "Booth PLN Mobile | GIIAS Semarang",
        before: "https://lh3.googleusercontent.com/d/1OaNoFI7ifHYT2x_PkFiVgp7w3Tu-mltw", // User provided
        after: "https://lh3.googleusercontent.com/d/1bD2K22NYfvtbdkCwRoaiFcMFEBD09xAB" // User provided
    },
    {
        id: 3,
        title: "Booth PLN Mobile | GIIAS Tangerang",
        before: "https://lh3.googleusercontent.com/d/1nmmvWkwSUfE7LEJFVq9uH8pyAfeE3ICb", // User provided
        after: "https://lh3.googleusercontent.com/d/1V98G1O_TMDqRpDjTLp61Fxq9p3gbLAR0" // User provided
    },
    {
        id: 4,
        title: "Booth PLN | IIMS",
        before: "https://lh3.googleusercontent.com/d/1ZHz7af3ZFO0VDWdQJpYQuvHMK-wukaWP", // User provided
        after: "https://lh3.googleusercontent.com/d/1MuutAp1DGk029fFoPP0ju56q8BYhGh3q" // User provided
    },
    {
        id: 5,
        title: "Booth PLN Mobile | Ardan Senja Syahdu",
        before: "https://lh3.googleusercontent.com/d/18uoanmKRe2GykCKwhXsk5lUVewVwd_gi", // User provided
        after: "https://lh3.googleusercontent.com/d/1u8WqsW9Ar0HE9_RukXqHm9kXrmAilcxE" // User provided
    },
    {
        id: 6,
        title: "Booth PLN Mobile | Gelegar Musik Prambanan",
        before: "https://lh3.googleusercontent.com/d/1DsarSwaVjjTUNNheqdHnEoRcVnXtXdJP", // User provided
        after: "https://lh3.googleusercontent.com/d/1S60L3DMoUGdZ-jIEZyvmBH6FsIxBCptb" // User provided
    },
    {
        id: 7,
        title: "Booth PLN Mobile | Ardan Senja Syahdu",
        before: "https://lh3.googleusercontent.com/d/1RU9rWEzz6_txfj1MEDndbPJN0jWEQTwl", // User provided
        after: "https://lh3.googleusercontent.com/d/17H-o5ZSqL5iec0fEc2ZChEXAVEtIIDo2" // User provided
    },
    {
        id: 8,
        title: "Landmark Gelegar Musik Prambanan",
        before: "https://lh3.googleusercontent.com/d/1dM-UlNTePeZA4cJiqgTQJMe9xvzVJ3v7", // User provided
        after: "https://lh3.googleusercontent.com/d/1c9eKy04ties_gIgXuIAf6XW75XyG0LER" // User provided
    }
];

// DOM Elements
const sliderContainer = document.querySelector('.comparison-slider');
const beforeImage = document.querySelector('.before-image');
const beforeImgTag = document.querySelector('.before-image img');
const afterImgTag = document.querySelector('.after-image img');
const sliderHandle = document.querySelector('.slider-handle');
const projectTitle = document.querySelector('.active-project-title');

// Thumbnail Carousel Elements
const thumbsTrack = document.getElementById('thumbs-track');
const btnPrev = document.getElementById('thumb-prev');
const btnNext = document.getElementById('thumb-next');

// Initialize
function initTransformationGallery() {
    if (!sliderContainer) return;

    renderThumbnails();
    loadProject(0); // Load first project

    // HOVER INTERACTION (No Click Required)
    sliderContainer.addEventListener('mousemove', handleMove);
    sliderContainer.addEventListener('touchmove', handleMove);

    // Initial Center
    updateSliderPosition(50);

    // Carousel Events
    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => scrollThumbs(-200));
        btnNext.addEventListener('click', () => scrollThumbs(200));
    }
}

function loadProject(index) {
    const data = transformationData[index];

    // Update Content
    projectTitle.textContent = data.title;
    beforeImgTag.src = data.before;
    afterImgTag.src = data.after;

    // Update Thumbs Active State
    document.querySelectorAll('.thumb-item').forEach((thumb, i) => {
        if (i === index) thumb.classList.add('active');
        else thumb.classList.remove('active');
    });
}

function renderThumbnails() {
    if (!thumbsTrack) return;
    thumbsTrack.innerHTML = '';
    transformationData.forEach((item, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb-item';
        thumb.innerHTML = `<img src="${item.after}" alt="${item.title}">`;
        thumb.addEventListener('click', () => loadProject(index));
        thumbsTrack.appendChild(thumb);
    });
}

// Handle Mouse Move over Slider
function handleMove(e) {
    let clientX;
    if (e.type === 'touchmove') {
        // Prevent scrolling while sliding
        // e.preventDefault(); 
        clientX = e.touches[0].clientX;
    } else {
        clientX = e.clientX;
    }

    const rect = sliderContainer.getBoundingClientRect();
    let x = clientX - rect.left;

    // Constraints
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;

    const percentage = (x / rect.width) * 100;
    updateSliderPosition(percentage);
}

// Update via Clip Path (Solves Ratio Issue)
function updateSliderPosition(percent) {
    // Reveal Before Image (Top) by clipping it from right to left
    // inset(top right bottom left)
    // We want to hide the RIGHT side based on percent
    // ex: 50% slider -> Clip right side by 50%
    const clipVal = 100 - percent;
    beforeImage.style.clipPath = `inset(0 ${clipVal}% 0 0)`;

    // Move handle
    sliderHandle.style.left = `${percent}%`;
}

// Scroll Thumbnails
function scrollThumbs(amount) {
    if (!thumbsTrack) return;
    thumbsTrack.scrollBy({
        left: amount,
        behavior: 'smooth'
    });
}

// Run
document.addEventListener('DOMContentLoaded', initTransformationGallery);
