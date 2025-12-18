// article-cms.js - Blog Management Logic (Final & Robust)

let articleQuill;
const BLOG_MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const BLOG_MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB

// Global State
let isEditingArticle = false;
let editingArticleId = null;
let existingCoverId = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("Article CMS Loading...");

    try { setupNavigation(); } catch (e) { console.error("Nav Error:", e); }
    try { initArticleCMS(); } catch (e) { console.error("CMS Init Error:", e); }
    try { initQuill(); } catch (e) { console.error("Quill Init Error:", e); }
});

// --- Navigation ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sections = {
        'projects': document.getElementById('projects-section'),
        'articles': document.getElementById('articles-section')
    };
    const title = document.getElementById('page-title');

    if (!navItems.length) return;

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (item.classList.contains('disabled')) return;
            e.preventDefault();

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const target = item.dataset.target;

            Object.values(sections).forEach(sec => {
                if (sec) {
                    sec.classList.add('hidden');
                    sec.style.display = 'none';
                }
            });

            if (sections[target]) {
                sections[target].classList.remove('hidden');
                sections[target].style.display = 'block';
            }

            if (target === 'projects') {
                if (title) title.innerText = "Portfolio Projects";
            } else if (target === 'articles') {
                if (title) title.innerText = "Blog Articles";
                loadArticles();
            }
        });
    });
}

// --- Editor ---
function initQuill() {
    if (typeof Quill === 'undefined') return;

    articleQuill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean']
                ],
                handlers: { 'image': imageHandler }
            }
        }
    });
}

function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        // User Feedback
        const range = articleQuill.getSelection();
        if (range) articleQuill.insertText(range.index, "Uploading...", 'italic', true);

        try {
            const compressed = await compressImage(file);

            // Compression Stats Alert
            const orig = (file.size / 1024).toFixed(0) + 'KB';
            const newS = (compressed.size / 1024).toFixed(0) + 'KB';
            alert(`Image Compressed! ${orig} -> ${newS}`);

            const { ID } = Appwrite;
            const upload = await window.storage.createFile(window.BUCKET_ID, ID.unique(), compressed);
            const url = window.storage.getFileView(window.BUCKET_ID, upload.$id).href;

            // cleanup loader
            if (range) articleQuill.deleteText(range.index, "Uploading...".length);

            articleQuill.insertEmbed(range?.index || 0, 'image', url);
        } catch (error) {
            console.error(error);
            alert("Image Upload Failed: " + error.message);
            if (range) articleQuill.deleteText(range.index, "Uploading...".length);
        }
    };
}

// --- CMS Core ---
const getEl = (id) => document.getElementById(id);

function initArticleCMS() {
    const btnAdd = getEl('btn-add-article');
    const btnClose = getEl('btn-close-article-modal');
    const btnCancel = getEl('btn-cancel-article');
    const form = getEl('article-form');

    // Inputs
    const inputs = ['a-title', 'a-slug', 'a-category', 'a-date', 'a-excerpt'].map(id => getEl(id));
    const coverInput = getEl('a-cover-file');
    const btnRemoveCover = getEl('btn-remove-cover');
    const titleInput = getEl('a-title');
    const slugInput = getEl('a-slug');

    if (btnAdd) btnAdd.addEventListener('click', openArticleModal);
    if (btnClose) btnClose.addEventListener('click', closeArticleModal);
    if (btnCancel) btnCancel.addEventListener('click', closeArticleModal);

    if (titleInput && slugInput) {
        titleInput.addEventListener('input', () => {
            if (!isEditingArticle) {
                // Unique Slug Logic
                const raw = titleInput.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                const suffix = Math.random().toString(36).substring(2, 6);
                slugInput.value = `${raw}-${suffix}`;
            }
        });
    }

    inputs.forEach(inp => {
        if (inp) {
            inp.addEventListener('input', checkArticleValidity);
            inp.addEventListener('change', checkArticleValidity);
        }
    });

    if (coverInput) coverInput.addEventListener('change', handleCoverChange);
    if (btnRemoveCover) btnRemoveCover.addEventListener('click', removeCover);
    if (form) form.addEventListener('submit', handleArticleSubmit);

    // Preview Logic
    const btnPreview = getEl('btn-preview-article');
    if (btnPreview) {
        btnPreview.addEventListener('click', async () => {
            const title = getEl('a-title').value || "Untitled Article";
            const category = getEl('a-category').value || "Uncategorized";
            const date = getEl('a-date').value || new Date().toISOString();
            const content = articleQuill.root.innerHTML;

            // Handle Cover for Preview
            let coverUrl = 'assets/images/placeholder-project.jpg';
            const coverInp = getEl('a-cover-file');

            if (coverInp._compressedFile) {
                // Read file to Data URL for storage
                coverUrl = await new Promise(r => {
                    const reader = new FileReader();
                    reader.onload = e => r(e.target.result);
                    reader.readAsDataURL(coverInp._compressedFile);
                });
            } else if (existingCoverId) {
                // We can't easily get the full View URL here without storage instance if we didn't save it. 
                // But we can try to reconstruct if we have global access, or just use placeholder if complex.
                // Better: The renderArticleList likely used getFileView.
                try {
                    coverUrl = window.storage.getFileView(window.BUCKET_ID, existingCoverId).href;
                } catch (e) { }
            }

            const previewData = {
                title, category, published_date: date, content,
                coverUrl // Store the DataURL or Link
            };

            try {
                localStorage.setItem('dnk_article_preview', JSON.stringify(previewData));
                window.open('article.html?mode=preview', '_blank');
            } catch (e) {
                alert("Preview failed: Storage limit or error.");
                console.error(e);
            }
        });
    }
}

// --- Logic Helpers ---
async function compressImage(file) {
    if (file.size > BLOG_MAX_INPUT_SIZE) throw new Error("File > 10MB");
    if (file.size <= BLOG_MAX_FILE_SIZE) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                const MAX_W = 1920;
                if (width > MAX_W) { height = Math.round(height * (MAX_W / width)); width = MAX_W; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.85);
            };
        };
    });
}

function checkArticleValidity() {
    const btnSave = getEl('btn-save-article');
    if (!btnSave) return;

    const title = getEl('a-title').value.trim();
    const slug = getEl('a-slug').value.trim();
    const category = getEl('a-category').value;
    const date = getEl('a-date').value;
    const excerpt = getEl('a-excerpt').value.trim();

    const coverInput = getEl('a-cover-file');
    const hasCover = (coverInput.files.length > 0 && coverInput._compressedFile) || (existingCoverId !== null);

    const isValid = title && slug && category && date && excerpt && hasCover;

    btnSave.disabled = !isValid;
    btnSave.style.opacity = isValid ? '1' : '0.5';
    btnSave.style.cursor = isValid ? 'pointer' : 'not-allowed';
}

async function handleCoverChange(e) {
    const file = e.target.files[0];
    const preview = getEl('a-cover-preview');
    const info = getEl('a-cover-size-info');
    const btnRm = getEl('btn-remove-cover');

    if (!file) return;

    preview.innerHTML = 'Compressing...';
    try {
        const compressed = await compressImage(file);
        e.target._compressedFile = compressed;

        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.innerHTML = `<img src="${ev.target.result}" style="height:100%; object-fit:contain;">`;
        };
        reader.readAsDataURL(compressed);

        if (info) {
            const orig = (file.size / 1024).toFixed(0) + 'KB';
            const newS = (compressed.size / 1024).toFixed(0) + 'KB';
            info.innerHTML = `${orig} -> <span style="color:#00ff00">${newS}</span>`;
        }
        if (btnRm) btnRm.style.display = 'inline-block';
    } catch (err) {
        alert(err.message);
        e.target.value = '';
    }
    checkArticleValidity();
}

function removeCover() {
    const input = getEl('a-cover-file');
    input.value = '';
    input._compressedFile = null;
    existingCoverId = null;
    getEl('a-cover-preview').innerText = 'No Cover Selected';
    if (getEl('a-cover-size-info')) getEl('a-cover-size-info').innerText = '';
    getEl('btn-remove-cover').style.display = 'none';
    checkArticleValidity();
}

// --- Server Ops ---
async function loadArticles() {
    const list = getEl('article-list');
    if (!list) return;
    list.innerHTML = 'Loading...';
    try {
        const { documents } = await window.databases.listDocuments(
            window.DATABASE_ID, 'articles', [Appwrite.Query.orderDesc('published_date')]
        );
        renderArticleList(documents);
    } catch (e) {
        list.innerText = "Failed to load.";
        console.error(e);
    }
}

function renderArticleList(docs) {
    const list = getEl('article-list');
    if (!list) return;
    list.innerHTML = '';

    if (docs.length === 0) {
        list.innerHTML = '<p style="text-align:center">No articles.</p>';
        return;
    }

    docs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'project-card-admin';

        let img = 'assets/images/placeholder-project.jpg';
        if (doc.cover_image && window.storage) {
            try { img = window.storage.getFileView(window.BUCKET_ID, doc.cover_image).href; } catch (e) { }
        }
        const date = new Date(doc.published_date).toLocaleDateString('en-GB');

        card.innerHTML = `
            <div class="card-img-wrapper"><img src="${img}" class="card-img"></div>
            <div class="card-body">
                <div class="card-meta">${date} &bull; ${doc.category || '-'}</div>
                <h3 class="card-title">${doc.title}</h3>
                <div class="card-client">${doc.slug}</div>
                <div class="card-actions" style="margin-top:10px; padding-top:10px; display:flex; gap:10px;">
                     <button class="btn-sm btn-edit" onclick="editArticle('${doc.$id}')">Edit</button>
                     <button class="btn-sm btn-delete" onclick="deleteArticle('${doc.$id}')">Delete</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function openArticleModal() {
    const m = getEl('article-modal');
    m.classList.remove('hidden');
    m.classList.add('active');
    checkArticleValidity();
}

function closeArticleModal() {
    const m = getEl('article-modal');
    m.classList.remove('active');
    m.classList.add('hidden');
    getEl('article-form').reset();
    isEditingArticle = false;
    existingCoverId = null;
    getEl('a-cover-file')._compressedFile = null;
    articleQuill.root.innerHTML = '';
    getEl('a-cover-preview').innerHTML = 'No Cover';
    if (getEl('btn-remove-cover')) getEl('btn-remove-cover').style.display = 'none';
    getEl('article-modal-title').innerText = "Write Article";
    getEl('btn-save-article').innerText = "Publish Article";
    if (getEl('a-cover-size-info')) getEl('a-cover-size-info').innerHTML = '';
}

async function handleArticleSubmit(e) {
    e.preventDefault();
    const btn = getEl('btn-save-article');
    if (btn.disabled) return;

    btn.disabled = true; btn.innerText = "Saving...";

    try {
        const payload = {
            title: getEl('a-title').value,
            slug: getEl('a-slug').value,
            category: getEl('a-category').value,
            published_date: new Date(getEl('a-date').value).toISOString(),
            excerpt: getEl('a-excerpt').value,
            tags: getEl('a-tags').value,
            meta_description: getEl('a-meta-desc').value,
            content: articleQuill.root.innerHTML
        };

        const coverInp = getEl('a-cover-file');

        if (coverInp._compressedFile) {
            const up = await window.storage.createFile(window.BUCKET_ID, Appwrite.ID.unique(), coverInp._compressedFile);
            payload.cover_image = up.$id;
        } else if (existingCoverId) {
            payload.cover_image = existingCoverId;
        } else {
            throw new Error("Missing Cover");
        }

        if (isEditingArticle && editingArticleId) {
            await window.databases.updateDocument(window.DATABASE_ID, 'articles', editingArticleId, payload);
            alert("Updated!");
        } else {
            await window.databases.createDocument(window.DATABASE_ID, 'articles', Appwrite.ID.unique(), payload);
            alert("Published!");
        }
        closeArticleModal();
        loadArticles();

    } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.innerText = isEditingArticle ? "Update" : "Publish";
    }
}

// Global Export
window.deleteArticle = async (id) => {
    if (!confirm("Delete?")) return;
    await window.databases.deleteDocument(window.DATABASE_ID, 'articles', id);
    loadArticles();
};

window.editArticle = async (id) => {
    const doc = await window.databases.getDocument(window.DATABASE_ID, 'articles', id);
    openArticleModal();
    isEditingArticle = true;
    editingArticleId = id;
    existingCoverId = doc.cover_image;

    getEl('a-title').value = doc.title;
    getEl('a-slug').value = doc.slug;
    getEl('a-category').value = doc.category;
    getEl('a-excerpt').value = doc.excerpt;
    getEl('a-tags').value = doc.tags || '';
    getEl('a-meta-desc').value = doc.meta_description || '';
    getEl('a-date').value = new Date(new Date(doc.published_date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    articleQuill.root.innerHTML = doc.content;

    if (doc.cover_image) {
        const url = window.storage.getFileView(window.BUCKET_ID, doc.cover_image).href;
        getEl('a-cover-preview').innerHTML = `<img src="${url}" style="height:100%">`;
        if (getEl('btn-remove-cover')) getEl('btn-remove-cover').style.display = 'inline-block';
        if (getEl('a-cover-size-info')) getEl('a-cover-size-info').innerText = "Existing kept";
    }

    checkArticleValidity();
    getEl('article-modal-title').innerText = "Edit Article";
    getEl('btn-save-article').innerText = "Update Article";
};
