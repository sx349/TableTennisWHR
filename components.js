// Component loader for header and footer
document.addEventListener('DOMContentLoaded', function() {
    // Load header
    loadComponent('header-container', 'header.html', function() {
        // After header loads, handle header-specific elements
        initializeHeader();
        
        // Load footer after header is loaded
        loadComponent('footer-container', 'footer.html', function() {
            // After footer loads, apply translations
            applyTranslations();
            
            // Initialize language switcher
            initializeLanguageSwitcher();
            
            // Continue with page-specific initialization
            initializePage();
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
    
    // Add page-specific header content
    const headerContent = document.getElementById('header-content');
    if (headerContent) {
        // For index page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
            // Add update info for index page
            headerContent.innerHTML = `
                <div class="update-info">
                    <p><span data-i18n="last-data">Last data retrieved:</span> <span id="data-update-time"></span> <span
                            data-i18n="beijing-time">(Beijing Time, UTC+8)</span></p>
                    <p><span data-i18n="last-ranking">Last ranking updated:</span> <span id="ranking-update-time"></span> <span
                            data-i18n="beijing-time">(Beijing Time, UTC+8)</span></p>
                </div>
            `;
        } 
        // For player page
        else if (window.location.pathname.includes('player.html')) {
            // Add back button for player page
            headerContent.innerHTML = `
                <nav>
                    <a href="index.html" data-i18n="back-to-rankings">Back to Rankings</a>
                </nav>
            `;
        }
        // For other pages, you can add specific header content here
    }
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
    
    // For index page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
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
    // You can add initialization for other pages here
}
