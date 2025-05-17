// Component loader for header and footer
document.addEventListener('DOMContentLoaded', function () {
    // Load header
    loadComponent('header-container', 'header.html', function () {
        // After header loads, handle header-specific elements
        initializeHeader();

        // Load footer after header is loaded
        loadComponent('footer-container', 'footer.html', function () {

            // Initialize language switcher
            initializeLanguageSwitcher();

            // Continue with page-specific initialization
            initializePage();

            // Add scroll buttons
            addScrollButtons();

            // After footer loads, apply translations
            applyTranslations();
        });
    });
});

// Function to load a component into a container
function loadComponent(containerId, componentUrl, callback) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found.`);
        if (typeof callback === 'function') callback();
        return;
    }

    fetch(componentUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${componentUrl}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            if (typeof callback === 'function') callback();
        })
        .catch(error => {
            console.error('Error loading component:', error);
            if (typeof callback === 'function') callback();
        });
}

// Initialize header-specific elements
function initializeHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    // Add language switcher
    if (!document.getElementById('language-switcher')) {
        const languageSwitcher = document.createElement('button');
        languageSwitcher.id = 'language-switcher';
        languageSwitcher.className = 'language-button';
        languageSwitcher.textContent = getTranslation('switch-language');
        languageSwitcher.onclick = toggleLanguage;
        header.appendChild(languageSwitcher);
    }

    // We no longer add page-specific header content here
    // The headerContent div is left in the header.html but we don't use it for the player page
}

// Initialize language switcher
function initializeLanguageSwitcher() {
    // Apply current language to switcher button
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.textContent = getTranslation('switch-language');
    }
}

// Initialize page specific content
function initializePage() {
    // Update responsive table headers
    if (typeof updateResponsiveTableHeaders === 'function') {
        updateResponsiveTableHeaders();
    }

    // Highlight the current page in navigation
    highlightCurrentPage();

    // For index page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        // Insert update info above the tabs
        insertUpdateInfo();

        // Load rankings when the page loads
        if (typeof loadRankings === 'function') {
            loadRankings('men');
            loadRankings('women');
        }

        // Show update times
        if (typeof fetchUpdateTimes === 'function') {
            fetchUpdateTimes();
        }

        if (typeof addColumnToggle === 'function') {
            setTimeout(addColumnToggle, 500); // Slight delay to ensure tables are loaded
        }
    }
    // For player page
    else if (window.location.pathname.includes('player.html')) {
        // Get the player ID from the URL query string
        const urlParams = new URLSearchParams(window.location.search);
        const playerId = urlParams.get('id');

        if (!playerId) {
            if (typeof showError === 'function') {
                showError(getTranslation('no-player-id'));
            }
            return;
        }

        // Fetch player data
        if (typeof fetchPlayerData === 'function') {
            fetchPlayerData(playerId);
        }
    }
    // For history page
    else if (window.location.pathname.includes('history.html')) {
        // History page initialization handled by history.js
    }
    // For snapshot page
    else if (window.location.pathname.includes('snapshot.html')) {
        // Snapshot page initialization handled by snapshot.js
    }
    // You can add initialization for other pages here
}

// Function to insert update info above tabs on index page
function insertUpdateInfo() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        // Create update info container
        const updateInfo = document.createElement('div');
        updateInfo.className = 'update-info-container';
        updateInfo.innerHTML = `
            <div class="update-info">
                <p><span data-i18n="last-data">Last data retrieved:</span> <span id="data-update-time"></span> <span
                        data-i18n="beijing-time">(Beijing Time, UTC+8)</span></p>
                <p><span data-i18n="last-ranking">Last ranking updated:</span> <span id="ranking-update-time"></span> <span
                        data-i18n="beijing-time">(Beijing Time, UTC+8)</span></p>
            </div>
        `;

        // Insert before tabs
        const tabs = document.querySelector('.tabs');
        if (tabs && tabs.parentNode) {
            tabs.parentNode.insertBefore(updateInfo, tabs);
        }
    }
}

// Function to highlight the current page in navigation
function highlightCurrentPage() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        // For index page
        if ((path.includes('index.html') || path === '/' || path.endsWith('/')) && href.includes('index.html')) {
            link.classList.add('active-nav');
        }
        // For history page
        else if (path.includes('history.html') && href.includes('history.html')) {
            link.classList.add('active-nav');
        }
        // For snapshot page - consider it part of history
        else if (path.includes('snapshot.html') && href.includes('history.html')) {
            link.classList.add('active-nav');
        }
        // For player page - don't highlight any nav item
    });
}

// Function to add scroll to top/bottom buttons
function addScrollButtons() {
    // Create container for scroll buttons
    const scrollButtonsContainer = document.createElement('div');
    scrollButtonsContainer.className = 'scroll-buttons-container';

    // Create scroll to top button
    const scrollTopButton = document.createElement('button');
    scrollTopButton.className = 'scroll-button scroll-top-button';
    scrollTopButton.title = getTranslation('scroll-to-top') || 'Scroll to top';
    // Empty button - icon is created with CSS
    scrollTopButton.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Create scroll to bottom button
    const scrollBottomButton = document.createElement('button');
    scrollBottomButton.className = 'scroll-button scroll-bottom-button';
    scrollBottomButton.title = getTranslation('scroll-to-bottom') || 'Scroll to bottom';
    // Empty button - icon is created with CSS
    scrollBottomButton.addEventListener('click', function () {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    // Add buttons to container
    scrollButtonsContainer.appendChild(scrollTopButton);
    scrollButtonsContainer.appendChild(scrollBottomButton);

    // Add container to body
    document.body.appendChild(scrollButtonsContainer);

    // Function to update button visibility that handles edge cases better
    function updateButtonVisibility() {
        // Get accurate measurements
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );

        // Content below viewport (amount of scrollable content remaining)
        const contentBelowViewport = documentHeight - (windowHeight + scrollY);

        // Show scroll to top button when scrolled down at least 300px
        if (scrollY > 300) {
            scrollTopButton.classList.add('visible');
        } else {
            scrollTopButton.classList.remove('visible');
        }

        // Always show bottom button if there's at least 100px of content to scroll to
        if (contentBelowViewport > 100) {
            scrollBottomButton.classList.add('visible');
        } else {
            scrollBottomButton.classList.remove('visible');
        }
    }

    // Update button visibility on scroll
    window.addEventListener('scroll', updateButtonVisibility);

    // Update button visibility on resize
    window.addEventListener('resize', updateButtonVisibility);

    // Initial update with a delay to ensure DOM is fully rendered
    setTimeout(updateButtonVisibility, 500);

    // Also update when images or other resources finish loading
    window.addEventListener('load', updateButtonVisibility);
}