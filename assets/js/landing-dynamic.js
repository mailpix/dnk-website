// --- Sticky Video Scroll Logic (Advanced with YouTube API) ---

// 1. Load YouTube IFrame Player API (Async)
// Only load if not already present
if (!window.YT) {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Global Players
var players = {};
var apiReady = false;

// 2. API Callback (Must be Global)
window.onYouTubeIframeAPIReady = function () {
    console.log("YouTube API Ready");
    apiReady = true;

    // Init players based on hardcoded IDs
    ['player-1', 'player-2', 'player-3'].forEach(id => {
        const frame = document.getElementById(id);
        if (frame) {
            players[id] = new YT.Player(id, {
                events: {
                    'onReady': onPlayerReady
                }
            });
        }
    });

    initScrollObserver();
};

function onPlayerReady(event) {
    event.target.mute(); // Force mute
}

function initScrollObserver() {
    const videoCards = document.querySelectorAll('.video-card');
    const titleEl = document.getElementById('sticky-video-title');
    const btnEl = document.getElementById('sticky-video-btn');

    if (!videoCards.length || !titleEl) return;

    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -40% 0px', // Center 20%
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const card = entry.target;
            const iframe = card.querySelector('iframe');

            // Get player instance by ID
            // Safe check: if API not ready or player not mapped, just skip
            const player = (iframe && players[iframe.id]) ? players[iframe.id] : null;

            if (entry.isIntersecting) {
                // ACTIVE STATE
                videoCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Update Info
                const newTitle = card.dataset.title;
                const newLink = card.dataset.link;

                // Animate Text
                if (titleEl.innerText !== newTitle) {
                    titleEl.classList.add('changing');
                    // Wait for fade out (500ms)
                    setTimeout(() => {
                        titleEl.innerText = newTitle;
                        titleEl.classList.remove('changing');
                    }, 500);
                }

                if (btnEl) btnEl.href = newLink;

                // PLAY VIDEO
                if (player && typeof player.playVideo === 'function') {
                    player.mute(); // Ensure mute
                    player.playVideo();
                }

            } else {
                // INACTIVE STATE
                // PAUSE VIDEO
                if (player && typeof player.pauseVideo === 'function') {
                    player.pauseVideo();
                }
            }
        });
    }, observerOptions);

    videoCards.forEach(card => observer.observe(card));
}

// --- Portfolio Logic (Appwrite Integration) ---
async function initPortfolio() {
    const grid = document.querySelector('.bento-grid');
    if (!grid) return;

    // Check if Appwrite is ready
    if (!window.databases || !window.storage) {
        console.warn("Appwrite not initialized yet. Retrying in 500ms...");
        setTimeout(initPortfolio, 500);
        return;
    }

    try {
        console.log("Fetching projects...");
        const response = await window.databases.listDocuments(
            window.DATABASE_ID,
            window.COLLECTION_ID,
            [
                // Order by newest
                Appwrite.Query.orderDesc('project_date'),
                Appwrite.Query.limit(9)
            ]
        );

        if (response.documents.length === 0) {
            grid.innerHTML = '<p style="color:white; text-align:center; grid-column:1/-1;">No projects found.</p>';
            return;
        }

        grid.innerHTML = ''; // Clear loading indicator

        // Map index to bento class
        const classes = ['bento-large', 'bento-wide', 'bento-small-1', 'bento-tall', 'bento-small-2', 'bento-wide-bottom', 'bento-large1', 'bento-wide1', 'bento-small-3'];

        response.documents.forEach((doc, index) => {
            const sizeClass = classes[index % classes.length];

            // Construct Image URL
            let imgUrl = 'assets/images/placeholder.jpg';
            if (doc.thumbnail_id) {
                try {
                    imgUrl = window.storage.getFileView(window.BUCKET_ID, doc.thumbnail_id).href;
                } catch (e) {
                    console.error("Image URL Error", e);
                }
            }

            // Create Card
            const card = document.createElement('div');
            card.className = `project-card ${sizeClass}`;
            card.onclick = () => {
                // Navigate to detail page (create listener or direct link)
                // Assuming we have a detail page, if not, standard link
                window.location.href = `project-detail.html?id=${doc.$id}`;
            };

            // Format Date to Year
            const projectYear = doc.project_date ? new Date(doc.project_date).getFullYear() : 'DNK';

            card.innerHTML = `
                <div class="project-image">
                    <img src="${imgUrl}" alt="${doc.title}" loading="lazy">
                </div>
                <div class="project-overlay">
                    <div class="client-logo-overlay">${projectYear}</div>
                    <div class="project-info">
                        <h3>${doc.title}</h3>
                        <p>${doc.subtitle || doc.client}</p>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Portfolio Load Error:", err);
        grid.innerHTML = '<p style="color:#d4af37; text-align:center; grid-column:1/-1;">Failed to load projects. Ensure Appwrite is running.</p>';
    }
}


// --- Latest Articles Logic ---
async function initLatestArticles() {
    const grid = document.getElementById('latest-articles-grid');
    if (!grid) return;

    // Check Appwrite
    if (!window.databases || !window.storage) {
        setTimeout(initLatestArticles, 500);
        return;
    }

    try {
        const response = await window.databases.listDocuments(
            window.DATABASE_ID,
            'articles', // Collection ID
            [
                Appwrite.Query.orderDesc('published_date'),
                Appwrite.Query.limit(3)
            ]
        );

        if (response.documents.length === 0) {
            grid.innerHTML = '<p style="text-align:center; color:#666; grid-column:1/-1;">No articles yet.</p>';
            return;
        }

        grid.innerHTML = ''; // Clear loading

        response.documents.forEach(doc => {
            // Image
            let imgUrl = 'assets/images/placeholder-project.jpg';
            if (doc.cover_image) {
                try {
                    imgUrl = window.storage.getFileView(window.BUCKET_ID, doc.cover_image).href;
                } catch (e) { }
            }

            // Date
            const date = new Date(doc.published_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const card = document.createElement('article');
            card.className = 'blog-card';
            card.innerHTML = `
                <div class="blog-card-image">
                    <a href="article.html?slug=${doc.slug}">
                        <img src="${imgUrl}" alt="${doc.title}" loading="lazy">
                    </a>
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta">
                        <span>${date}</span>
                        <span>•</span>
                        <span class="blog-category">${doc.category || 'Journal'}</span>
                    </div>
                    <h3 class="blog-title">
                        <a href="article.html?slug=${doc.slug}">${doc.title}</a>
                    </h3>
                    <p class="blog-excerpt">
                        ${doc.excerpt || doc.meta_description || 'No excerpt available.'}
                    </p>
                    <a href="article.html?slug=${doc.slug}" class="read-more">Read Article <i class="fas fa-arrow-right"></i></a>
                </div>
             `;
            grid.appendChild(card);
        });

    } catch (e) {
        console.error("Latest Articles Error:", e);
        grid.innerHTML = '<p style="text-align:center; color:#666; grid-column:1/-1;">Error loading articles.</p>';
    }
}

// Init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initPortfolio();
    initLatestArticles();
});


// Backup init if already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initPortfolio();
}
