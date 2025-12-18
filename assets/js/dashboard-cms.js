// Dashboard CMS Logic (Appwrite)
// Features: Create/Update/Delete, Date Picker, Smart Compression, Validation, Stats

// DOM Elements
const projectList = document.getElementById('project-list');
const modal = document.getElementById('project-modal');
const projectForm = document.getElementById('project-form');
const btnAddProject = document.getElementById('btn-add-project');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const modalTitle = document.getElementById('modal-title'); // To change "Add" to "Edit"

// Image Elements
const thumbInput = document.getElementById('p-thumbnail-file');
const thumbPreview = document.getElementById('thumb-preview');
const thumbInfo = document.getElementById('thumb-size-info');
const btnRemoveThumb = document.getElementById('btn-remove-thumb');

const galleryInput = document.getElementById('p-gallery-files');
const galleryPreview = document.getElementById('gallery-preview');
const btnRemoveGallery = document.getElementById('btn-remove-gallery');

// Config
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB Final Limit
const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB Safety Limit

// EDIT STATE
let isEditing = false;
let editingDocId = null;
let existingThumbnailId = null;
let existingGalleryIds = [];

// --- Helper: Get Image URL ---
function getImgUrl(fileId) {
    if (!fileId) return 'assets/images/placeholder-project.jpg';
    let localStorage = window.storage;
    if (!localStorage && window.client) localStorage = new Appwrite.Storage(window.client);
    if (!localStorage) return 'assets/images/placeholder-project.jpg';
    const bucketId = window.BUCKET_ID || '694131c000079f447b4f';
    try {
        return localStorage.getFileView(bucketId, fileId).href;
    } catch (e) {
        return 'assets/images/placeholder-project.jpg';
    }
}

function toIsoDate(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toISOString();
}

// --- Helper: Smart Compression (Client Side) ---
async function compressImage(file) {
    if (file.size > MAX_INPUT_SIZE) throw new Error(`File ${file.name} terlalu besar (>10MB). Harap kecilkan manual.`);
    if (file.size <= MAX_FILE_SIZE) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1920;
                if (width > MAX_WIDTH) {
                    height = Math.round(height * (MAX_WIDTH / width));
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error("Compression failed"));
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(newFile);
                }, 'image/jpeg', 0.85);
            };
            img.onerror = (err) => reject(new Error("Image load failed"));
        };
        reader.onerror = (err) => reject(new Error("File read failed"));
    });
}

// --- Form Validation ---
function checkFormValidity() {
    if (!projectForm) return;

    const title = document.getElementById('p-title').value.trim();
    const client = document.getElementById('p-client').value.trim();
    const date = document.getElementById('p-date').value;

    // Thumbnail Valid if: New File OR Existing ID
    const hasThumb = (thumbInput.files.length > 0) || (existingThumbnailId !== null);

    const isValid = title && client && date && hasThumb;

    if (btnSave) {
        btnSave.disabled = !isValid;
        btnSave.style.opacity = isValid ? '1' : '0.5';
        btnSave.style.cursor = isValid ? 'pointer' : 'not-allowed';
    }
}

// --- 1. Load Projects ---
async function loadProjects() {
    if (!projectList) return;
    try {
        projectList.innerHTML = '<div class="loading-state"><p>Loading projects...</p></div>';
        if (!window.databases) throw new Error("Appwrite Databases not initialized");

        const { Query } = Appwrite;
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.orderDesc('$createdAt')]
        );
        renderProjects(response.documents);
    } catch (error) {
        console.error("Load Projects Failed:", error);
        projectList.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    }
}

function renderProjects(projects) {
    if (projects.length === 0) {
        projectList.innerHTML = '<p class="empty-state">Belum ada project.</p>';
        return;
    }
    projectList.innerHTML = '';
    projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card-admin';
        const thumbUrl = p.thumbnail_id ? getImgUrl(p.thumbnail_id) : null;

        let imgHTML = thumbUrl
            ? `<img src="${thumbUrl}" alt="${p.title}" class="card-img" style="object-fit:cover; width:100%; height:100%;">`
            : `<div class="card-img-placeholder" style="background:#333; height:100%; display:flex; align-items:center; justify-content:center; color:#666;"><i class="fas fa-image" style="font-size: 2rem;"></i></div>`;

        // Pass JSON string to edit
        const pData = encodeURIComponent(JSON.stringify(p));

        card.innerHTML = `
            <div class="card-img-wrapper">${imgHTML}</div>
            <div class="card-body">
                <div class="card-meta">${p.subtitle || 'Category'}</div>
                <h3 class="card-title">${p.title}</h3>
                <span class="card-client">${p.client || 'Client'}</span>
                <div class="card-actions" style="display:flex; gap:10px; margin-top:10px;">
                    <button class="btn-sm btn-edit" style="background:#f0ad4e; color:white; border:none; padding:5px 10px; border-radius:4px; flex:1; cursor:pointer;" 
                        onclick="prepareEdit('${p.$id}')">Edit</button>
                    <button class="btn-sm btn-delete" style="background:#d9534f; color:white; border:none; padding:5px 10px; border-radius:4px; flex:1; cursor:pointer;" 
                        onclick="deleteProject('${p.$id}')">Delete</button>
                </div>
            </div>
        `;
        projectList.appendChild(card);
    });
}

// --- 2. Edit Logic ---
window.prepareEdit = async function (id) {
    try {
        // Fetch fresh data
        const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, id);

        isEditing = true;
        editingDocId = id;
        existingThumbnailId = doc.thumbnail_id;
        existingGalleryIds = doc.gallery_ids || [];

        // UI Setup
        modalTitle.innerText = "Edit Project";
        btnSave.innerText = "Update Project";
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('active'), 10);

        // Fill Inputs
        document.getElementById('p-title').value = doc.title;
        document.getElementById('p-client').value = doc.client;
        document.getElementById('p-subtitle').value = doc.subtitle;
        document.getElementById('p-desc').value = doc.description;

        // Date Fix (ISO to YYYY-MM-DD)
        if (doc.project_date) {
            const d = new Date(doc.project_date);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            document.getElementById('p-date').value = `${yyyy}-${mm}-${dd}`;
        }

        // Render Existing Thumb
        if (existingThumbnailId) {
            const url = getImgUrl(existingThumbnailId);
            thumbPreview.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: contain;">`;
            if (thumbInfo) thumbInfo.innerText = "Existing Image kept.";
            // Only show Remove button if we want to allow clearing without upload? 
            // Better: Show "Remove" to allow clearing intent
            btnRemoveThumb.style.display = 'inline-block';
        } else {
            thumbPreview.innerHTML = '<span style="color:#444;">No image selected</span>';
        }

        // Render Existing Gallery
        renderGalleryPreview();

        checkFormValidity();
    } catch (e) {
        alert("Error prepping edit: " + e.message);
    }
};

function renderGalleryPreview() {
    galleryPreview.innerHTML = '';

    // 1. Existing
    existingGalleryIds.forEach(id => {
        const url = getImgUrl(id);
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.innerHTML = `
            <img src="${url}" style="width:60px; height:60px; object-fit:cover; border-radius:4px; border:1px solid #555;">
            <button onclick="removeExistingGalleryId('${id}')" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:18px; height:18px; border:none; font-size:10px; cursor:pointer;">&times;</button>
        `;
        div.title = "Existing Image";
        galleryPreview.appendChild(div);
    });

    // 2. New Uploads (Showing previews from input is tough if we want to mix them. 
    // Standard approach: Just show the text summary or append new previews if possible, 
    // but file input `files` cannot be easily split physically in UI.
    // simpler: If user selects NEW files, we show previews appended.)
    if (galleryInput.files.length > 0) {
        // ... (We rely on logic below to append new previews) ...
        // We trigger the change event manually or extract render logic?
        // Let's just create a header if needed.
    }
}

window.removeExistingGalleryId = function (id) {
    existingGalleryIds = existingGalleryIds.filter(x => x !== id);
    renderGalleryPreview();
}


// --- 3. Interaction Handlers ---

if (thumbInput) {
    thumbInput.addEventListener('change', async function (e) {
        let file = e.target.files[0];
        if (file) {
            if (file.size > MAX_INPUT_SIZE) { alert("File > 10MB"); this.value = ''; return; }

            if (thumbInfo) thumbInfo.innerText = "Processing...";
            thumbPreview.innerHTML = '<div style="color:#666">...</div>';

            try {
                const compressedFile = await compressImage(file);
                thumbInput._compressedFile = compressedFile;

                // Mark that we are replacing existing
                // existingThumbnailId remains separate, will be ignored if input has file

                const originalSize = (file.size / 1024).toFixed(0) + 'KB';
                const newSize = (compressedFile.size / 1024).toFixed(0) + 'KB';

                if (thumbInfo) thumbInfo.innerHTML = `${originalSize} <i class="fas fa-arrow-right"></i> <span style="color:#00ff00;">${newSize}</span>`;

                const reader = new FileReader();
                reader.onload = (e) => {
                    thumbPreview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
                    btnRemoveThumb.style.display = 'inline-block';
                    checkFormValidity();
                };
                reader.readAsDataURL(compressedFile);

            } catch (err) {
                alert("Error: " + err.message);
                this.value = '';
            }
        }
    });
}

if (btnRemoveThumb) {
    btnRemoveThumb.addEventListener('click', () => {
        thumbInput.value = '';
        thumbInput._compressedFile = null;
        existingThumbnailId = null; // Mark deletion
        thumbPreview.innerHTML = '<span style="color:#444;">No image selected</span>';
        if (thumbInfo) thumbInfo.innerText = '';
        btnRemoveThumb.style.display = 'none';
        checkFormValidity();
    });
}

if (galleryInput) {
    galleryInput.addEventListener('change', async function (e) {
        const files = Array.from(e.target.files);
        // Do not clear existingGalleryIds here! We want to ADD to them.
        renderGalleryPreview(); // Re-render existing first

        galleryInput._compressedFiles = [];

        try {
            for (let f of files) {
                if (f.size > MAX_INPUT_SIZE) { alert(">10MB detected"); galleryInput.value = ''; return; }
            }

            const compressedFiles = await Promise.all(files.map(f => compressImage(f)));
            galleryInput._compressedFiles = compressedFiles;

            // Stats
            let totalOrig = 0; let totalNew = 0;
            files.forEach(f => totalOrig += f.size);
            compressedFiles.forEach(f => totalNew += f.size);

            const savedInfo = document.createElement('div');
            savedInfo.style.width = '100%';
            savedInfo.style.fontSize = '11px';
            savedInfo.style.color = '#fff';
            savedInfo.innerHTML = `New Uploads: ${(totalOrig / 1024 / 1024).toFixed(1)}MB &rarr; <span style="color:#00ff00;">${(totalNew / 1024 / 1024).toFixed(1)}MB</span>`;
            galleryPreview.appendChild(savedInfo);

            compressedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.width = '60px'; img.style.height = '60px';
                    img.style.objectFit = 'cover'; img.style.borderRadius = '4px'; img.style.border = '1px solid #00ff00';
                    galleryPreview.appendChild(img);
                }
                reader.readAsDataURL(file);
            });

            if (files.length > 0) btnRemoveGallery.style.display = 'inline-block';
            checkFormValidity();

        } catch (err) {
            alert(err.message);
            galleryInput.value = '';
        }
    });
}

if (btnRemoveGallery) {
    btnRemoveGallery.addEventListener('click', () => {
        galleryInput.value = '';
        galleryInput._compressedFiles = [];
        // Note: This button clears NEW uploads only? Or All?
        // User expects "Clear All". 
        // Let's clear NEW uploads only in UI behavior, but maybe keep existing?
        // Usually "Clear/Reset" implies form field reset.
        // Let's only clear the input.
        renderGalleryPreview(); // This restores existing
        btnRemoveGallery.style.display = 'none';
        checkFormValidity();
    });
}


// --- 4. Submit Logic (Create & Update) ---
if (projectForm) {
    ['input', 'change'].forEach(evt => {
        projectForm.addEventListener(evt, checkFormValidity);
    });

    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { ID } = Appwrite;

        if (btnSave.disabled) return;
        btnSave.innerText = "Processing...";
        btnSave.disabled = true;

        try {
            const title = document.getElementById('p-title').value;
            const clientName = document.getElementById('p-client').value;
            const subtitle = document.getElementById('p-subtitle').value;
            const dateStr = document.getElementById('p-date').value;
            const desc = document.getElementById('p-desc').value;

            // A. Handle Thumbnail
            let finalThumbId = existingThumbnailId; // Default to existing
            const newThumbFile = thumbInput._compressedFile || thumbInput.files[0];

            console.log("Submit Debug - New Thumb:", newThumbFile ? newThumbFile.name : "None");

            if (newThumbFile) {
                console.log("Uploading New Thumb...");
                const thumbUpload = await storage.createFile(BUCKET_ID, ID.unique(), newThumbFile);
                finalThumbId = thumbUpload.$id;
                // Note: We could delete the old thumbnail here to save space, but safer to keep for now.
            }
            // Check requirement
            if (!finalThumbId) throw new Error("Thumbnail required");

            // B. Handle Gallery
            let finalGalleryIds = [...existingGalleryIds]; // Start with existing
            const newGalleryFiles = galleryInput._compressedFiles || Array.from(galleryInput.files);

            if (newGalleryFiles.length > 0) {
                console.log(`Uploading ${newGalleryFiles.length} new images...`);
                const uploadPromises = newGalleryFiles.map(file => storage.createFile(BUCKET_ID, ID.unique(), file));
                const results = await Promise.all(uploadPromises);
                const newIds = results.map(res => res.$id);
                finalGalleryIds = finalGalleryIds.concat(newIds);
            }

            const payload = {
                title, client: clientName, subtitle,
                project_date: toIsoDate(dateStr),
                description: desc,
                thumbnail_id: finalThumbId,
                gallery_ids: finalGalleryIds
            };

            if (isEditing && editingDocId) {
                // UPDATE
                await databases.updateDocument(DATABASE_ID, COLLECTION_ID, editingDocId, payload);
                alert("Project Updated!");
            } else {
                // CREATE
                await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), payload);
                alert("Project Created!");
            }

            closeModal();
            loadProjects();

        } catch (error) {
            console.error("Save Error:", error);
            alert("Gagal: " + error.message);
        } finally {
            btnSave.innerText = isEditing ? "Update Project" : "Save Project";
        }
    });
}

function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.classList.add('hidden');
        projectForm.reset();

        // Reset State
        isEditing = false;
        editingDocId = null;
        existingThumbnailId = null;
        existingGalleryIds = [];
        modalTitle.innerText = "Add New Project";
        btnSave.innerText = "Save Project";

        // Reset Inputs
        thumbInput._compressedFile = null;
        galleryInput._compressedFiles = [];
        document.getElementById('thumb-preview').innerHTML = '<span style="color:#444;">No image selected</span>';
        galleryPreview.innerHTML = '';
        if (thumbInfo) thumbInfo.innerText = '';
        if (btnRemoveThumb) btnRemoveThumb.style.display = 'none';
        if (btnRemoveGallery) btnRemoveGallery.style.display = 'none';

        checkFormValidity();
    }, 300);
}

window.deleteProject = async function (docId) {
    if (!confirm("Delete project?")) return;
    try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, docId);
        loadProjects();
    } catch (e) { alert("Delete failed: " + e.message); }
};

if (btnAddProject) btnAddProject.addEventListener('click', () => {
    // Ensure clean state
    isEditing = false;
    projectForm.reset();
    existingThumbnailId = null;
    existingGalleryIds = [];
    modalTitle.innerText = "Add New Project";
    btnSave.innerText = "Save Project";
    renderGalleryPreview();

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
    checkFormValidity();
});

if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);

document.addEventListener('DOMContentLoaded', () => { setTimeout(loadProjects, 500); });
