// Main Script for DNK Creative

document.addEventListener('DOMContentLoaded', () => {

    // --- Sticky Header Logic ---
    const header = document.getElementById('main-header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Animation Controller (Hero Section) ---
    const swipeWrapper = document.getElementById('swipe-wrapper');
    const typeWrapper = document.getElementById('type-wrapper');

    let activeIndex = 0;

    // Helper: Set width of wrapper to match the incoming text
    const setContainerWidth = (wrapper, activePairId) => {
        if (!wrapper) return;

        // Find the text element we want to show
        const nextText = wrapper.querySelector(`.rotate-text[data-pair="${activePairId}"]`);
        if (!nextText) return;

        // Measure width by creating a temporary hidden span
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.style.font = getComputedStyle(nextText).font;
        tempSpan.style.fontSize = getComputedStyle(nextText).fontSize;
        tempSpan.style.fontWeight = getComputedStyle(nextText).fontWeight;
        tempSpan.style.letterSpacing = getComputedStyle(nextText).letterSpacing;
        tempSpan.innerText = nextText.innerText;

        document.body.appendChild(tempSpan);
        const newWidth = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);

        // Apply width to wrapper
        wrapper.style.width = `${newWidth}px`;
    };

    const runAnimations = (index) => {
        // 1. Swipe/Slide Animation
        if (swipeWrapper) {
            setContainerWidth(swipeWrapper, index);
            const texts = swipeWrapper.querySelectorAll('.rotate-text');
            texts.forEach(text => {
                const pairId = parseInt(text.dataset.pair);
                if (pairId === index) {
                    text.classList.add('active');
                    text.classList.remove('exit');
                } else {
                    text.classList.remove('active');
                    text.classList.add('exit');
                }
            });
        }

        // 2. Typing/Slide Animation (Sequential)
        setTimeout(() => {
            if (typeWrapper) {
                setContainerWidth(typeWrapper, index); // Animate Width
                const texts = typeWrapper.querySelectorAll('.rotate-text');
                texts.forEach(text => {
                    const pairId = parseInt(text.dataset.pair);
                    if (pairId === index) {
                        text.classList.add('active');
                        text.classList.remove('exit');
                    } else {
                        text.classList.remove('active');
                        text.classList.add('exit');
                    }
                });
            }
        }, 200); // 0.2s Delay for faster sequence
    };

    // Initial Setup - Start Loop
    const startHeroAnimations = () => {
        if (!swipeWrapper || !typeWrapper) return;

        // Initial set
        setContainerWidth(swipeWrapper, 0);
        setContainerWidth(typeWrapper, 0);

        setInterval(() => {
            activeIndex = (activeIndex + 1) % 4; // Cycle 0, 1, 2, 3
            runAnimations(activeIndex);
        }, 4000); // 4s Interval
    };

    startHeroAnimations();


    // --- Mobile Menu Toggle ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.main-nav');

    if (mobileBtn && nav) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');

            // Toggle icon
            const icon = mobileBtn.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // --- Process Section Step Interaction ---
    const stepCards = document.querySelectorAll('.step-card');
    const stepImages = document.querySelectorAll('.step-img');

    if (stepCards.length > 0) {
        stepCards.forEach(card => {
            const handleStepActive = () => {
                // Remove active from all
                stepCards.forEach(c => c.classList.remove('active'));
                stepImages.forEach(img => img.classList.remove('active'));

                // Add active to current
                card.classList.add('active');

                // Activate Image
                const stepNum = card.getAttribute('data-step');
                const targetImg = document.getElementById(`img-${stepNum}`);
                if (targetImg) targetImg.classList.add('active');
            };

            card.addEventListener('mouseenter', handleStepActive);
            card.addEventListener('click', handleStepActive);
        });
    }

    // --- FAQ Accordion Logic ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;

                // Optional: Close others
                document.querySelectorAll('.faq-item').forEach(i => {
                    if (i !== item) i.classList.remove('active');
                });

                // Toggle current
                item.classList.toggle('active');
            });
        });
    }

    // --- Bento Grid Slideshow ---
    const storyCards = document.querySelectorAll('.project-card');
    // Define timing groups (indices 0-based)
    const delays = {
        0: 0, 3: 0,
        1: 2000, 5: 2000,
        2: 4000, 4: 4000
    };

    storyCards.forEach((card, cardIndex) => {
        const slides = card.querySelectorAll('.story-slide');

        if (slides.length > 0) {
            let currentIndex = 0;
            const slideDuration = 5000;
            let slideInterval;

            const showSlide = (index) => {
                currentIndex = index;
                slides.forEach((slide, i) => {
                    slide.classList.toggle('active', i === index);
                });
            };

            const nextSlide = () => {
                const nextIndex = (currentIndex + 1) % slides.length;
                showSlide(nextIndex);
            };

            const startInterval = () => {
                if (slideInterval) clearInterval(slideInterval);
                slideInterval = setInterval(nextSlide, slideDuration);
            };

            // Initial Start
            const initialDelay = delays[cardIndex] || 0;
            showSlide(0);
            setTimeout(() => {
                startInterval();
            }, initialDelay);
        }
    }); // End storyCards.forEach

    // --- Scroll Control (Auto Scroll Down / Back to Top) ---
    const scrollBtn = document.getElementById('scroll-ctrl-btn');
    if (scrollBtn) {
        const icon = scrollBtn.querySelector('i');

        // Update Icon based on position
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY + window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;

            // If near bottom (within 100px)
            if (scrollPos >= docHeight - 100) {
                icon.classList.remove('fa-arrow-down');
                icon.classList.add('fa-arrow-up');
                scrollBtn.title = "Back to Top";
            } else {
                icon.classList.remove('fa-arrow-up');
                icon.classList.add('fa-arrow-down');
                scrollBtn.title = "Scroll Down";
            }
        });

        // Click Action
        scrollBtn.addEventListener('click', () => {
            const isUp = icon.classList.contains('fa-arrow-up');
            if (isUp) {
                // Scroll to Top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Scroll to Bottom (Auto Scroll)
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
            }
        });
    }

});
