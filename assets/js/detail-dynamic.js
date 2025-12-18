// Detail Page Logic (Appwrite)
console.log("Detail Script Started");

// --- Helper: Get Image URL (Robust) ---
function getImgUrl(fileId) {
    if (!fileId) return 'assets/images/placeholder.jpg';

    // 1. Try Global Storage
    let localStorage = window.storage;

    // 2. Fallback: Create new instance if missing
    if (!localStorage && window.client) {
        console.warn("Detail: Global storage missing, creating new instance.");
        localStorage = new Appwrite.Storage(window.client);
    }

    if (!localStorage) {
        console.error("Detail Critical: Appwrite Storage client not available.");
        return 'assets/images/placeholder.jpg';
    }

    // 3. Get Bucket ID
    const bucketId = window.BUCKET_ID || '694131c000079f447b4f';

    try {
        // Use getFileView to avoid 403 (Transformation Blocked)
        const url = localStorage.getFileView(bucketId, fileId).href;
        return url;
    } catch (e) {
        console.error("Detail URL Gen Error:", e);
        return 'assets/images/placeholder.jpg';
    }
}

// --- Main: Load Project Details ---
async function loadProjectDetail() {
    // 1. Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        console.error("No ID provided URL param");
        // Don't redirect immediately to allow debugging if needed, but in prod maybe redirect
        // window.location.href = 'index.html';
        return;
    }

    // DOM Elements (Mapped to project-detail.html)
    const dom = {
        title: document.getElementById('project-title'),
        subtitle: document.getElementById('project-subtitle'),
        client: document.getElementById('project-client'),
        date: document.getElementById('project-date'),
        desc: document.getElementById('project-description'),
        gallery: document.getElementById('project-gallery'),
        heroBg: document.getElementById('detail-hero')
    };

    try {
        console.log("Fetching Detail for:", projectId);

        // Ensure Database Globals
        const db = window.databases;
        const dbId = window.DATABASE_ID;
        const colId = window.COLLECTION_ID;

        if (!db || !dbId) {
            throw new Error("Appwrite DB globals missing. Check appwrite-config.js");
        }

        // 2. Fetch Document
        const project = await db.getDocument(dbId, colId, projectId);
        console.log("Detail Data Loaded:", project);

        // 3. Populate Text Fields
        // Update Title Tag
        document.title = `${project.title} - DNK Portfolio`;

        if (dom.title) dom.title.innerText = project.title;
        if (dom.subtitle) dom.subtitle.innerText = project.subtitle || 'Selected Work';
        if (dom.client) dom.client.innerText = project.client || '-';

        // Format Date
        if (dom.date && project.project_date) {
            const dateObj = new Date(project.project_date);
            dom.date.innerText = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Handle Description
        if (dom.desc) {
            dom.desc.innerHTML = project.description ? project.description.replace(/\n/g, '<br>') : 'No description available.';
        }

        // 4. Set Hero Background (Thumbnail)
        if (dom.heroBg && project.thumbnail_id) {
            const heroUrl = getImgUrl(project.thumbnail_id);
            // Apply to the specific background of the header
            dom.heroBg.style.backgroundImage = `url('${heroUrl}')`;
        }

        // 5. Render Gallery
        if (dom.gallery && project.gallery_ids && project.gallery_ids.length > 0) {
            dom.gallery.innerHTML = '';
            project.gallery_ids.forEach((fileId, index) => {
                const imgUrl = getImgUrl(fileId);
                const item = document.createElement('div');

                // Add classes for grid variations (simple pattern)
                item.className = 'gallery-item';
                if (index % 5 === 0) item.classList.add('item-big');
                else if (index % 3 === 0) item.classList.add('item-wide');

                // Add Fade In Animation Style
                item.style.animationDelay = `${index * 0.1}s`;

                item.innerHTML = `<img src="${imgUrl}" alt="Gallery Image ${index + 1}" loading="lazy">`;
                dom.gallery.appendChild(item);
            });
        } else if (dom.gallery) {
            dom.gallery.innerHTML = '<p style="color:#666; text-align:center; display:block; width:100%;">No additional gallery images.</p>';
        }

        console.log("Detail Render Complete");
        // Force Page Visibility (Fix for Blank Screen)
        document.body.classList.add('loaded');
        document.body.style.opacity = '1';

    } catch (error) {
        console.error("Load Detail Failed:", error);
        if (dom.desc) {
            dom.desc.innerHTML = `<p style="color:red; font-weight:bold;">Error loading project data.<br>Technical details: ${error.message}</p>`;
        }
        // Force show so user sees error
        document.body.style.opacity = '1';
    }
}

// Init when DOM Ready
document.addEventListener('DOMContentLoaded', loadProjectDetail);
