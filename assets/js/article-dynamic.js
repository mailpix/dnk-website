// article-dynamic.js - Fetch Single Article by Slug

document.addEventListener('DOMContentLoaded', () => {
    initArticle();
});

async function initArticle() {
    const params = new URLSearchParams(window.location.search);

    // Check for Preview Mode
    if (params.get('mode') === 'preview') {
        try {
            const raw = localStorage.getItem('dnk_article_preview');
            if (!raw) throw new Error("No preview data found");
            const data = JSON.parse(raw);
            renderArticle(data, true); // true = isPreview
            document.title = "[PREVIEW] " + data.title;
            // Add Banner
            document.body.insertAdjacentHTML('afterbegin',
                '<div style="background:#ffd700; color:black; padding:10px; text-align:center; font-weight:bold; position:sticky; top:0; z-index:9999;">PREVIEW MODE - Not Published</div>'
            );
            return;
        } catch (e) {
            console.error(e);
            alert("Preview Expired or Invalid");
            window.close();
            return;
        }
    }

    const slug = params.get('slug');

    if (!slug) {
        window.location.href = 'blog.html';
        return;
    }

    try {
        // Find Doc by Slug
        // Note: 'articles' collection must have 'slug' attribute indexed preferably, 
        // but for small scale, simple query works.
        const response = await window.databases.listDocuments(
            window.DATABASE_ID,
            'articles',
            [
                Appwrite.Query.equal('slug', slug),
                Appwrite.Query.limit(1)
            ]
        );

        if (response.documents.length === 0) {
            document.body.innerHTML = '<h1 style="color:white; text-align:center; margin-top:100px;">Article not found (404)</h1>';
            return;
        }

        const doc = response.documents[0];
        renderArticle(doc);

    } catch (error) {
        console.error("Fetch Article Error:", error);
        document.body.innerHTML = '<h1 style="color:white; text-align:center; margin-top:100px;">Error loading article.</h1>';
    }
}

function renderArticle(doc, isPreview = false) {
    // Meta
    document.title = `${doc.title} - DNK Journal`;
    document.getElementById('article-title').innerText = doc.title;
    document.getElementById('article-category').innerText = doc.category || 'Journal';

    if (doc.excerpt) {
        const sumEl = document.getElementById('article-summary');
        sumEl.innerText = doc.excerpt;
        sumEl.style.display = 'block';
    }

    const date = new Date(doc.published_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('article-date').innerText = date;

    // Cover Image
    let imgUrl = null;
    if (isPreview && doc.coverUrl) {
        imgUrl = doc.coverUrl; // Direct Data URL from Preview
    } else if (doc.cover_image) {
        try {
            imgUrl = window.storage.getFileView(window.BUCKET_ID, doc.cover_image).href;
        } catch (e) { }
    }

    if (imgUrl) {
        document.getElementById('article-cover').src = imgUrl;
        document.getElementById('article-cover').style.display = 'block';
    } else {
        document.getElementById('article-cover').style.display = 'none';
    }

    // Content
    const contentBox = document.getElementById('article-content');
    contentBox.innerHTML = doc.content;

    // Share Links
    const currentUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Read ${doc.title} on DNK Creative`);

    document.getElementById('share-wa').href = `https://wa.me/?text=${text}%20${currentUrl}`;
    document.getElementById('share-in').href = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`;
    document.getElementById('share-tw').href = `https://twitter.com/intent/tweet?text=${text}&url=${currentUrl}`;

    // --- SEO & Tags ---

    // 1. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = doc.meta_description || doc.excerpt || "Read this article on DNK Creative.";

    // 2. Tags Display
    if (doc.tags) {
        const tagsArr = doc.tags.split(',').map(t => t.trim());
        if (tagsArr.length > 0) {
            const contentBox = document.getElementById('article-content');

            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'article-tags-container';
            tagsContainer.style.marginTop = '40px';
            tagsContainer.style.paddingTop = '20px';
            tagsContainer.style.borderTop = '1px solid #eee';

            tagsContainer.innerHTML = '<span style="font-weight:bold; margin-right:10px;">Tags:</span>';

            tagsArr.forEach(tag => {
                const badge = document.createElement('a'); // Changed to Link
                badge.href = `blog.html?search=${encodeURIComponent(tag)}`; // Link to Search
                badge.className = 'tag-badge';
                badge.innerText = tag;
                // Inline styles for simplicity
                badge.style.display = 'inline-block';
                badge.style.background = '#f0f0f0';
                badge.style.padding = '5px 12px';
                badge.style.borderRadius = '20px';
                badge.style.fontSize = '0.85rem';
                badge.style.marginRight = '8px';
                badge.style.color = '#555';
                badge.style.textDecoration = 'none'; // No underline
                badge.style.transition = '0.3s';

                // Hover effect logic needed in CSS or inline
                badge.onmouseover = () => { badge.style.background = '#e0e0e0'; badge.style.color = 'black'; };
                badge.onmouseout = () => { badge.style.background = '#f0f0f0'; badge.style.color = '#555'; };

                tagsContainer.appendChild(badge);
            });

            contentBox.appendChild(tagsContainer);
        }
    }
}
