document.addEventListener('DOMContentLoaded', function () {
    // Load rankings when the page loads
    loadRankings('men');
    loadRankings('women');

    // Show update times
    fetchUpdateTimes();
    setTimeout(addColumnToggle, 500); // Slight delay to ensure tables are loaded
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

function loadRankings(gender) {
    const filename = `${gender}_ranking.json`;

    fetch(filename)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayRankings(data, gender);
        })
        .catch(error => {
            console.error('Error loading rankings:', error);
            document.getElementById(`${gender}-rankings`).innerHTML =
                `<tr><td colspan="6" class="loading">Error loading rankings. Please try again later.</td></tr>`;
        });
}

function displayRankings(rankings, gender) {
    const tableBody = document.getElementById(`${gender}-rankings`);

    // Only display top 100 players
    const topPlayers = rankings.slice(0, 100);

    if (topPlayers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="loading">No ranking data available.</td></tr>`;
        return;
    }

    let html = '';

    topPlayers.forEach(player => {
        // Format rating and error to always have 2 decimal places
        const formattedRating = parseFloat(player.rating).toFixed(2);
        const formattedError = parseFloat(player.error).toFixed(2);

        html += `
            <tr>
                <td data-label="Rank">${player.rank}</td>
                <td data-label="Player"><a href="player.html?id=${player.id}" class="player-link">${player.name}</a></td>
                <td data-label="Year of Birth">${player.yob}</td>
                <td data-label="Association">${player.association}</td>
                <td data-label="Rating">${formattedRating}</td>
                <td data-label="Error">${formattedError}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    setTimeout(addDataAttributesToTables, 100);
}

function fetchUpdateTimes() {
    fetch('LAST_INFO.JSON')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Convert times to Beijing time (UTC+8)
            let dataTime = "Unknown";
            let rankingTime = "Unknown";

            if (data.data_time) {
                dataTime = convertToBeijiingTime(data.data_time);
            }

            if (data.ranking_time) {
                rankingTime = convertToBeijiingTime(data.ranking_time);
            }

            document.getElementById('data-update-time').textContent = dataTime;
            document.getElementById('ranking-update-time').textContent = rankingTime;
        })
        .catch(error => {
            console.error('Error loading update times:', error);
            document.getElementById('data-update-time').textContent = 'Unknown';
            document.getElementById('ranking-update-time').textContent = 'Unknown';
        });
}

function convertToBeijiingTime(timeString) {
    try {
        // Parse the input time string
        const date = new Date(timeString);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return timeString; // Return the original if parsing failed
        }

        // Convert to Beijing time (UTC+8)
        // First get UTC time by adding the local timezone offset
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        // Then add the Beijing timezone offset (8 hours)
        const beijingTime = new Date(utcTime + (8 * 3600000));

        // Format the date 
        return beijingTime.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    } catch (error) {
        console.error('Error converting time:', error);
        return timeString; // Return the original if any error occurs
    }
}

// Add column toggling functionality for mobile
function addColumnToggle() {
    // Only add on mobile
    if (window.innerWidth > 767) return;

    // Create toggle buttons container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'column-toggles';
    toggleContainer.innerHTML = `
        <p>Show/hide columns:</p>
        <div class="toggle-buttons">
            <button data-column="3" class="toggle-button active">Birth Year</button>
            <button data-column="4" class="toggle-button active">Association</button>
            <button data-column="6" class="toggle-button active">Error</button>
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

function addDataAttributesToTables() {
    // Add data attributes to men's table
    const menTable = document.getElementById('men-table');
    if (menTable) {
        const headers = ['Rank', 'Player', 'Year of Birth', 'Association', 'Rating', 'Error'];
        const rows = menTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headers.length) {
                    cell.setAttribute('data-label', headers[index]);
                }
            });
        });
    }

    // Add data attributes to women's table
    const womenTable = document.getElementById('women-table');
    if (womenTable) {
        const headers = ['Rank', 'Player', 'Year of Birth', 'Association', 'Rating', 'Error'];
        const rows = womenTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headers.length) {
                    cell.setAttribute('data-label', headers[index]);
                }
            });
        });
    }

    // Add data attributes to history table
    const historyTable = document.getElementById('history-table');
    if (historyTable) {
        const headers = ['Date', 'Rating', 'Error'];
        const rows = historyTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < headers.length) {
                    cell.setAttribute('data-label', headers[index]);
                }
            });
        });
    }
}
