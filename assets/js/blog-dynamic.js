// blog-dynamic.js - Fetch and Display Articles

document.addEventListener('DOMContentLoaded', () => {
    initBlog();
});

async function initBlog() {
    const grid = document.getElementById('blog-grid');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn'); // Restored
    const searchClear = document.getElementById('search-clear'); // Added

    if (!grid) return;

    // Initial Load
    await fetchArticles();

    // Helper: Toggle Clear Button
    const toggleClearBtn = () => {
        if (!searchClear) return;
        searchClear.style.display = searchInput.value.trim().length > 0 ? 'block' : 'none';
    };

    // Check initial state (e.g. from back button)
    if (searchInput) toggleClearBtn();

    // Search Listener (Button)
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            fetchArticles(query);
            toggleClearBtn();
        });
    }

    // Search Input Listeners (Type & Enter)
    if (searchInput) {
        searchInput.addEventListener('input', toggleClearBtn); // Show/Hide X on type

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                fetchArticles(query);
                toggleClearBtn();
            }
        });
    }

    // Clear Listener
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = ''; // Clear input
            toggleClearBtn(); // Hide X
            fetchArticles(''); // Reset Grid (Fetch All)

            // Remove ?search= param from URL without reload
            const url = new URL(window.location);
            url.searchParams.delete('search');
            window.history.pushState({}, '', url);
        });
    }

    async function fetchArticles(searchQuery = '') {
        try {
            grid.innerHTML = '<div class="loading-state">Loading articles...</div>';

            // Check URL Params for initial search (if not manually passed)
            if (!searchQuery) {
                const params = new URLSearchParams(window.location.search);
                const urlSearch = params.get('search');
                if (urlSearch) {
                    searchQuery = urlSearch;
                    if (searchInput) {
                        searchInput.value = searchQuery; // Populate input
                        toggleClearBtn(); // Ensure X shows
                    }
                }
            }

            // Fetch ALL (Limit 100 for now)
            const queries = [
                Appwrite.Query.orderDesc('published_date'),
                Appwrite.Query.limit(100)
            ];

            const response = await window.databases.listDocuments(
                window.DATABASE_ID,
                'articles',
                queries
            );

            let docs = response.documents;

            // Client-Side Filter
            if (searchQuery) {
                const lowQuery = searchQuery.toLowerCase();
                docs = docs.filter(doc => {
                    const titleMatch = doc.title && doc.title.toLowerCase().includes(lowQuery);
                    const tagMatch = doc.tags && doc.tags.toLowerCase().includes(lowQuery);
                    return titleMatch || tagMatch;
                });
            }

            renderArticles(docs, searchQuery); // Pass query for highlighting

        } catch (error) {
            console.error("Blog Fetch Error:", error);
            // Fallback
            if (error.code === 404) {
                grid.innerHTML = '<div class="error-state">Collection "articles" not found.</div>';
            } else {
                grid.innerHTML = '<div class="error-state">Failed to load articles.</div>';
            }
        }
    }

    function renderArticles(docs, highlightQuery = '') {
        if (!docs || docs.length === 0) {
            grid.innerHTML = '<div class="empty-state">No articles found.</div>';
            return;
        }

        grid.innerHTML = '';

        // Helper for Highlighting
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const getHighlightedText = (text, query) => {
            if (!query || !text) return text;
            try {
                // Determine if query is in text (case insensitive)
                const pattern = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                // Replace with <mark> tag for yellow highlight
                return text.replace(pattern, '<mark style="background-color:#fff100; color:black; padding:0 2px; border-radius:2px;">$1</mark>');
            } catch (e) {
                return text;
            }
        };

        docs.forEach(doc => {
            // Get Image URL
            let imgUrl = 'assets/images/placeholder-project.jpg';
            if (doc.cover_image) {
                try {
                    imgUrl = window.storage.getFileView(window.BUCKET_ID, doc.cover_image).href;
                } catch (e) { }
            }

            // Date Format
            const date = new Date(doc.published_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            // Highlight Title and Excerpt
            const displayTitle = getHighlightedText(doc.title, highlightQuery);
            const displayExcerpt = getHighlightedText(doc.excerpt, highlightQuery);

            // Card HTML
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
                        <span class="blog-date">${date}</span>
                        ${doc.category ? `<span class="blog-category">${doc.category}</span>` : ''}
                    </div>
                    <h3 class="blog-title">
                        <a href="article.html?slug=${doc.slug}">${displayTitle}</a>
                    </h3>
                    <p class="blog-excerpt">${displayExcerpt}</p>
                    <a href="article.html?slug=${doc.slug}" class="read-more">Read Article <i class="fas fa-arrow-right"></i></a>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}
