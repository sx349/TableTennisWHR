document.addEventListener('DOMContentLoaded', function () {
    // Get the player ID from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('id');

    if (!playerId) {
        showError(getTranslation('no-player-id'));
        return;
    }

    // Fetch player data from the API
    fetchPlayerData(playerId);
});

function fetchPlayerData(playerId) {
    fetch(`player_data.php?id=${playerId}&lang=${getCurrentLanguage()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(getTranslation('network-error'));
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                showError(data.message || getTranslation('failed-load'));
                return;
            }

            // Display player information
            displayPlayerInfo(data.player);

            // Display rating history
            displayRatingHistory(data.ratings, data.player.gender);

            // Create rating chart
            createRatingChart(data.ratings);

            // Update page title based on current language
            const currentLang = getCurrentLanguage();
            let displayName = data.player.name;

            // Use Chinese name if available and language is set to Chinese
            if (currentLang === 'zh' && data.player.name_zh) {
                displayName = data.player.name_zh;
            }

            // Update page title
            document.title = `${displayName} | ${getTranslation('player-title')}`;
        })
        .catch(error => {
            console.error('Error fetching player data:', error);
            showError(getTranslation('error-loading'));
        });
}

function displayPlayerInfo(player) {
    const nameElement = document.getElementById('player-name')
    if (getCurrentLanguage() === 'zh' && player.name_zh) {
        nameElement.textContent = player.name_zh || player.name;
    } else {
        nameElement.textContent = player.name;
    }

    document.getElementById('player-id').textContent = player.id;
    document.getElementById('player-yob').textContent = player.yob;

    // Display association name based on current language
    const assocElement = document.getElementById('player-assoc');
    if (getCurrentLanguage() === 'zh' && player.assoc_zh) {
        assocElement.textContent = player.assoc_zh || player.assoc || player.ma;
    } else {
        assocElement.textContent = player.assoc || player.ma;
    }

    // Set gender text based on current language
    const genderText = player.gender === 'M' ? getTranslation('male') : getTranslation('female');
    document.getElementById('player-gender').textContent = genderText;

    // Get the latest rating if available
    const latestRatingElement = document.getElementById('player-rating');
    latestRatingElement.textContent = getTranslation('loading');
}

function displayRatingHistory(ratings, gender) {
    const tableBody = document.getElementById('rating-history');

    if (!ratings || ratings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="loading">${getTranslation('no-data')}</td></tr>`;
        return;
    }

    // Constants for error calculation
    const MIN_DATE = new Date('1988-10-01');
    const TODAY = new Date();
    const TODAY_DAYS = Math.floor((TODAY - MIN_DATE) / (1000 * 60 * 60 * 24));
    const W2 = gender === 'M' ? 17.4 : 14.4;

    // Update the current rating with the latest value
    const latestRating = ratings[ratings.length - 1];
    const latestDate = parseInt(latestRating.date);
    const daysSinceLatest = TODAY_DAYS - latestDate;

    // Calculate new error using the formula: new_error = (error^2 + w2 * days_since)^0.5
    const baseError = parseFloat(latestRating.error);
    const newError = Math.sqrt(Math.pow(baseError, 2) + W2 * daysSinceLatest).toFixed(2);

    document.getElementById('player-rating').textContent = `${latestRating.rating} ± ${newError}`;

    // Sort ratings by date (newest first)
    const sortedRatings = [...ratings].reverse();

    let html = '';

    sortedRatings.forEach(rating => {
        const date = formatDate(rating.date);

        html += `
            <tr>
                <td data-label="${getTranslation('date')}">${date}</td>
                <td data-label="${getTranslation('rating')}">${rating.rating}</td>
                <td data-label="${getTranslation('error')}">${rating.error}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// Global variable to store chart instance
let ratingChart = null;

function createRatingChart(ratings) {
    if (!ratings || ratings.length === 0) {
        return;
    }

    // Destroy existing chart if it exists
    if (ratingChart) {
        ratingChart.destroy();
    }

    // Convert dates from the database format to something chart.js can use
    const dates = ratings.map(r => formatDate(r.date));
    const ratingValues = ratings.map(r => parseFloat(r.rating).toFixed(2));
    const errorValues = ratings.map(r => parseFloat(r.error).toFixed(2));

    // Calculate upper and lower bounds for error bars
    const upperBound = ratings.map(r => (parseFloat(r.rating) + 1.96 * parseFloat(r.error)).toFixed(2));
    const lowerBound = ratings.map(r => (parseFloat(r.rating) - 1.96 * parseFloat(r.error)).toFixed(2));

    const ctx = document.getElementById('rating-chart').getContext('2d');

    ratingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: getTranslation('rating'),
                    data: ratingValues,
                    borderColor: 'rgb(0, 123, 255)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.1,
                    pointRadius: 3,
                    fill: false
                },
                {
                    label: '95% CI UB',
                    data: upperBound,
                    borderColor: 'rgba(200, 200, 200, 0.5)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: '95% CI LB',
                    data: lowerBound,
                    borderColor: 'rgba(200, 200, 200, 0.5)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: '-1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: getTranslation('rating')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function formatDate(dateValue) {
    // The date value is likely the number of days since your MIN_DATE (1988-10-01)
    // Convert it to a readable date
    try {
        const MIN_DATE = new Date('1988-10-01');
        const date = new Date(MIN_DATE);
        date.setDate(MIN_DATE.getDate() + parseInt(dateValue));

        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateValue; // Return the original value if conversion fails
    }
}

function showError(message) {
    document.getElementById('player-name').textContent = getTranslation('loading');
    document.getElementById('player-data').innerHTML = `<p class="error">${message}</p>`;
    document.getElementById('rating-history').innerHTML = `<tr><td colspan="3" class="loading">${getTranslation('no-data')}</td></tr>`;
}