document.addEventListener('DOMContentLoaded', function () {
    // Get the date from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date');
    const initialGender = urlParams.get('gender') || 'men';
    
    if (!date) {
        showError(getTranslation('no-date-provided'));
        return;
    }
    
    // Display the date
    const formattedDate = formatDate(date);
    document.getElementById('selected-date').textContent = formattedDate;
    
    // Update page title with the date
    document.title = `${formattedDate} | ${getTranslation('snapshot-title')}`;
    
    // Set the initial active tab based on the gender parameter
    showTab(initialGender);
    
    // Load ranking snapshots
    loadSnapshotRankings('men', date);
    loadSnapshotRankings('women', date);

    // Add event listener for language switcher
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.addEventListener('click', function() {
            // Reload rankings after a slight delay to allow language to change
            setTimeout(function() {
                const currentDate = urlParams.get('date');
                loadSnapshotRankings('men', currentDate);
                loadSnapshotRankings('women', currentDate);
                
                // Also update page title with the translated text
                document.title = `${formattedDate} | ${getTranslation('snapshot-title')}`;
                
                // Update other translated elements
                document.getElementById('snapshot-for-text').textContent = getTranslation('snapshot-for');
                document.getElementById('back-to-history-link').textContent = getTranslation('back-to-history');
            }, 100);
        });
    }
});

function showTab(tabName) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    // Deactivate all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Activate selected tab button
    const activeButton = document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`);
    activeButton.classList.add('active');
}

function loadSnapshotRankings(gender, date) {
    const lang = getCurrentLanguage(); // Get current language
    const loader = document.getElementById(`${gender}-loader`);
    
    // Show loader
    if (loader) {
        loader.style.display = 'block';
    }

    fetch(`snapshot_data.php?gender=${gender}&date=${date}&lang=${lang}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(getTranslation('network-error'));
            }
            return response.json();
        })
        .then(data => {
            displaySnapshotRankings(data, gender);
            // Hide loader
            if (loader) {
                loader.style.display = 'none';
            }
            // Add column toggle for mobile view
            setTimeout(addColumnToggle, 500);
        })
        .catch(error => {
            console.error('Error loading snapshot rankings:', error);
            const tableBody = document.getElementById(`${gender}-rankings`);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="6" class="loading">${getTranslation('error-loading-snapshot')}</td></tr>`;
            }
            // Hide loader
            if (loader) {
                loader.style.display = 'none';
            }
        });
}

function displaySnapshotRankings(rankings, gender) {
    const tableBody = document.getElementById(`${gender}-rankings`);

    if (!rankings || rankings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="loading">${getTranslation('no-snapshot-data')}</td></tr>`;
        return;
    }

    let html = '';
    const currentLang = getCurrentLanguage();

    rankings.forEach(player => {
        // Format rating and error to always have 2 decimal places
        const formattedRating = parseFloat(player.rating).toFixed(2);
        const formattedError = parseFloat(player.error).toFixed(2);

        // Use Chinese name if available and language is set to Chinese
        let displayName = player.name;
        if (currentLang === 'zh' && player.name_zh) {
            displayName = player.name_zh;
        }

        // Use Chinese association if available and language is set to Chinese
        let displayAssociation = player.association;
        if (currentLang === 'zh' && player.association_zh) {
            displayAssociation = player.association_zh;
        }

        html += `
            <tr>
                <td data-label="${getTranslation('rank')}">${player.rank}</td>
                <td data-label="${getTranslation('player')}"><a href="player.html?id=${player.id}" class="player-link">${displayName}</a></td>
                <td data-label="${getTranslation('year-of-birth')}">${player.yob || '-'}</td>
                <td data-label="${getTranslation('association')}">${displayAssociation || '-'}</td>
                <td data-label="${getTranslation('rating')}">${formattedRating}</td>
                <td data-label="${getTranslation('error')}">${formattedError}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    setTimeout(addDataAttributesToTables, 100);
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateStr; // Return the original string if there's an error
    }
}

function showError(message) {
    // Display error message
    document.getElementById('selected-date').textContent = message;
    
    // Hide loaders
    document.querySelectorAll('.loader').forEach(loader => {
        loader.style.display = 'none';
    });
    
    // Show error in tables
    document.querySelectorAll('tbody').forEach(tbody => {
        tbody.innerHTML = `<tr><td colspan="6" class="loading">${message}</td></tr>`;
    });
}

function addDataAttributesToTables() {
    const headers = {
        men: [
            getTranslation('rank'),
            getTranslation('player'),
            getTranslation('year-of-birth'),
            getTranslation('association'),
            getTranslation('rating'),
            getTranslation('error')
        ],
        women: [
            getTranslation('rank'),
            getTranslation('player'),
            getTranslation('year-of-birth'),
            getTranslation('association'),
            getTranslation('rating'),
            getTranslation('error')
        ]
    };

    // Add data attributes to men's table
    const menTable = document.getElementById('men-table');
    if (menTable) {
        const rows = menTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headers.men.length) {
                    cell.setAttribute('data-label', headers.men[index]);
                }
            });
        });
    }

    // Add data attributes to women's table
    const womenTable = document.getElementById('women-table');
    if (womenTable) {
        const rows = womenTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headers.women.length) {
                    cell.setAttribute('data-label', headers.women[index]);
                }
            });
        });
    }
}

// Add column toggling functionality for mobile - copied from script.js
function addColumnToggle() {
    // Only add on mobile
    if (window.innerWidth > 767) return;

    // Remove existing toggle containers first to prevent duplicates
    document.querySelectorAll('.column-toggles').forEach(container => {
        container.remove();
    });

    // Create toggle buttons container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'column-toggles';
    toggleContainer.innerHTML = `
        <p>${getTranslation('show-hide-columns')}</p>
        <div class="toggle-buttons">
            <button data-column="3" class="toggle-button active">${getTranslation('birth-year')}</button>
            <button data-column="4" class="toggle-button active">${getTranslation('association')}</button>
            <button data-column="6" class="toggle-button active">${getTranslation('error')}</button>
        </div>
    `;

    // Add toggle container to both tab content sections
    const menTab = document.getElementById('men');
    const womenTab = document.getElementById('women');

    if (menTab) menTab.insertBefore(toggleContainer.cloneNode(true), menTab.querySelector('table'));
    if (womenTab) womenTab.insertBefore(toggleContainer.cloneNode(true), womenTab.querySelector('table'));

    // Add event listeners to toggle buttons
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.addEventListener('click', function () {
            const columnIndex = this.getAttribute('data-column');
            this.classList.toggle('active');

            // Get all cells in the column
            const isActive = this.classList.contains('active');
            const tables = ['#men-table', '#women-table'];

            tables.forEach(tableId => {
                const table = document.querySelector(tableId);
                if (!table) return;

                // Toggle visibility for header
                const header = table.querySelector(`th:nth-child(${columnIndex})`);
                if (header) header.style.display = isActive ? '' : 'none';

                // Toggle visibility for cells
                const cells = table.querySelectorAll(`td:nth-child(${columnIndex})`);
                cells.forEach(cell => cell.style.display = isActive ? '' : 'none');
            });
        });
    });
}