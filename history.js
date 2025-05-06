document.addEventListener('DOMContentLoaded', function () {
    // Load historical rankings
    loadHistoricalRankings('men');
    loadHistoricalRankings('women');

    // Add event listener for language switcher
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.addEventListener('click', function() {
            // Reload rankings after a slight delay to allow language to change
            setTimeout(function() {
                loadHistoricalRankings('men');
                loadHistoricalRankings('women');
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

function loadHistoricalRankings(gender) {
    const lang = getCurrentLanguage(); // Get current language
    const loader = document.getElementById(`${gender}-loader`);
    
    // Show loader
    if (loader) {
        loader.style.display = 'block';
    }

    fetch(`history_data.php?gender=${gender}&lang=${lang}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(getTranslation('network-error'));
            }
            return response.json();
        })
        .then(data => {
            displayHistoricalRankings(data, gender);
            // Hide loader
            if (loader) {
                loader.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading historical rankings:', error);
            const tableBody = document.getElementById(`${gender}-history-data`);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="6" class="loading">${getTranslation('error-loading-history')}</td></tr>`;
            }
            // Hide loader
            if (loader) {
                loader.style.display = 'none';
            }
        });
}

function displayHistoricalRankings(historyData, gender) {
    const tableBody = document.getElementById(`${gender}-history-data`);
    
    if (!historyData || historyData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="loading">${getTranslation('no-history-data')}</td></tr>`;
        return;
    }

    let html = '';
    const currentLang = getCurrentLanguage();

    historyData.forEach(dateEntry => {
        html += '<tr>';
        
        // Add date with link to snapshot page
        html += `<td><a href="snapshot.html?date=${dateEntry.date}&gender=${gender}" class="date-link">${formatDate(dateEntry.date)}</a></td>`;
        
        // Add top 5 players (instead of 10)
        for (let i = 0; i < dateEntry.players.length && i < 5; i++) {
            const player = dateEntry.players[i];
            
            // Use Chinese name if available and language is set to Chinese
            let displayName = player.name;
            if (currentLang === 'zh' && player.name_zh) {
                displayName = player.name_zh;
            }
            
            // Format rating without decimal places
            const formattedRating = Math.round(parseFloat(player.rating));
            
            // Create two-row layout for name and rating
            html += `
                <td class="player-cell">
                    <div class="player-name"><a href="player.html?id=${player.id}" class="player-link">${displayName}</a></div>
                    <div class="player-rating">(${formattedRating})</div>
                </td>
            `;
        }
        
        // If we have fewer than 5 players, add empty cells
        for (let i = dateEntry.players.length; i < 5; i++) {
            html += '<td>-</td>';
        }
        
        html += '</tr>';
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

function addDataAttributesToTables() {
    const headers = {
        'men-history': Array.from({ length: 6 }, (_, i) => 
            i === 0 ? getTranslation('eval-date') : getTranslation(`rank-${i}`)),
        'women-history': Array.from({ length: 6 }, (_, i) => 
            i === 0 ? getTranslation('eval-date') : getTranslation(`rank-${i}`))
    };

    // Add data attributes to men's history table
    const menTable = document.getElementById('men-history-table');
    if (menTable) {
        const rows = menTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headers['men-history'].length) {
                    cell.setAttribute('data-label', headers['men-history'][index]);
                }
            });
        });
    }

    // Add data attributes to women's history table
    const womenTable = document.getElementById('women-history-table');
    if (womenTable) {
        const rows = womenTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headers['women-history'].length) {
                    cell.setAttribute('data-label', headers['women-history'][index]);
                }
            });
        });
    }
}