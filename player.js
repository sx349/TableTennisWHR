document.addEventListener('DOMContentLoaded', function () {
    // Get the player ID from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('id');

    if (!playerId) {
        showError('No player ID provided');
        return;
    }

    // Fetch player data from the API
    fetchPlayerData(playerId);
});

function fetchPlayerData(playerId) {
    fetch(`player_data.php?id=${playerId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                showError(data.message || 'Failed to load player data');
                return;
            }

            // Display player information
            displayPlayerInfo(data.player);

            // Display rating history
            displayRatingHistory(data.ratings, data.player.gender);

            // Create rating chart
            createRatingChart(data.ratings);

            // Update page title
            document.title = `${data.player.name} | Table Tennis WHR`;
        })
        .catch(error => {
            console.error('Error fetching player data:', error);
            showError('Error loading player data. Please try again later.');
        });
}

function displayPlayerInfo(player) {
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-id').textContent = player.id;
    document.getElementById('player-yob').textContent = player.yob;
    document.getElementById('player-assoc').textContent = player.assoc || player.ma;
    document.getElementById('player-gender').textContent = player.gender === 'M' ? 'Male' : 'Female';

    // Get the latest rating if available
    const latestRatingElement = document.getElementById('player-rating');
    latestRatingElement.textContent = 'Not available';
}

function displayRatingHistory(ratings, gender) {
    const tableBody = document.getElementById('rating-history');

    if (!ratings || ratings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="loading">No rating history available</td></tr>';
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
                <td data-label="Date">${date}</td>
                <td data-label="Rating">${rating.rating}</td>
                <td data-label="Error">${rating.error}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function createRatingChart(ratings) {
    if (!ratings || ratings.length === 0) {
        return;
    }

    // Convert dates from the database format to something chart.js can use
    const dates = ratings.map(r => formatDate(r.date));
    const ratingValues = ratings.map(r => parseFloat(r.rating).toFixed(2));
    const errorValues = ratings.map(r => parseFloat(r.error).toFixed(2));

    // Calculate upper and lower bounds for error bars
    const upperBound = ratings.map(r => (parseFloat(r.rating) + 1.96 * parseFloat(r.error)).toFixed(2));
    const lowerBound = ratings.map(r => (parseFloat(r.rating) - 1.96 * parseFloat(r.error)).toFixed(2));

    const ctx = document.getElementById('rating-chart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Rating',
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
                        text: 'Rating'
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
    document.getElementById('player-name').textContent = 'Error';
    document.getElementById('player-data').innerHTML = `<p class="error">${message}</p>`;
    document.getElementById('rating-history').innerHTML = '<tr><td colspan="3" class="loading">No data available</td></tr>';
}