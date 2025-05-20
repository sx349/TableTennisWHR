/**
 * Top Players Chart Implementation
 * This script handles creating interactive rating charts for top players
 */


document.addEventListener('DOMContentLoaded', function () {

    window.inactiveSeries = {
        men: new Set(),
        women: new Set()
    };

    // Initialize charts
    loadTopPlayersData('men');
    loadTopPlayersData('women');

});

// Handle language switch events
document.addEventListener('languageChanged', function () {
    // Remove any existing tooltips before reloading charts
    d3.selectAll('.nvtooltip').remove();

    // Reset inactive series tracking
    window.inactiveSeries = {
        men: new Set(),
        women: new Set()
    };

    loadTopPlayersData('men');
    loadTopPlayersData('women');
});

// Function to show a tab
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

    d3.selectAll('.nvtooltip').remove();

    window.inactiveSeries = {
        men: new Set(),
        women: new Set()
    };

    if (tabName === 'men' && window.menChart) {
        loadTopPlayersData('men');
    } else if (tabName === 'women' && window.womenChart) {
        loadTopPlayersData('women');
    }
}

// Function to load top players data
function loadTopPlayersData(gender) {
    const tabContent = document.getElementById(gender);

    // Add rotation message
    const rotateMessage = document.createElement('div');
    rotateMessage.className = 'rotate-device-message';
    rotateMessage.textContent = getTranslation('rotate-device') || 'Please rotate your device or use a larger screen for better chart viewing.';

    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';

    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.textContent = getTranslation('loading-chart') || 'Loading chart data...';
    chartContainer.appendChild(loadingMessage);

    // Clear tab content and add elements
    tabContent.innerHTML = '';
    tabContent.appendChild(rotateMessage);
    tabContent.appendChild(chartContainer);

    // Fetch player IDs from the JSON file
    fetch(`${gender}_top_players.json`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.error) {
                throw new Error(data.message || 'Error retrieving player data');
            }

            // Now we have the player data, create the chart
            createChart(gender, data, chartContainer);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            chartContainer.innerHTML = `<div class="loading-message">${getTranslation('error-loading') || 'Error loading chart data'}</div>`;
        });
}

// Function to create the chart
function createChart(gender, data, container) {

    // Clear container
    container.innerHTML = '';

    // Create legend with 7 players per row
    const legend = createLegend(gender, data.players);
    container.appendChild(legend);

    // Create chart container
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart-svg-container';
    chartDiv.id = `${gender}-chart-svg-container`;
    chartDiv.innerHTML = '<svg></svg>';
    container.appendChild(chartDiv);

    // Process data for the chart - include predictions
    const chartData = processChartData(data.players, true);

    // Create color palette
    const colorPalette = createColorPalette();

    // Calculate y-axis range
    const yRange = calculateYAxisRange(chartData);

    // Calculate x-axis range
    const xRange = calculateXAxisRange(chartData);

    // Create NVD3 chart
    nv.addGraph(function () {
        const chart = nv.models.lineChart()
            .useInteractiveGuideline(false)
            .margin({ top: 30, right: 60, bottom: 60, left: 80 })
            .duration(300)
            .showLegend(false)
            .forceY([yRange.min, yRange.max])
            .forceX([xRange.min, xRange.max]);

        // Customize tooltips for language support
        chart.tooltip.contentGenerator(function (d) {
            if (!d || !d.point) return '';

            // Check if this series is inactive
            const seriesIndex = d.point.index

            // After generating tooltip content, add a timeout to check and hide if needed
            setTimeout(function () {
                const tooltips = document.querySelectorAll('.nvtooltip');
                tooltips.forEach(tooltip => {
                    if (seriesIndex >= 0 && window.inactiveSeries[gender].has(seriesIndex)) {
                        tooltip.classList.add('inactive-series-tooltip');
                    } else {
                        tooltip.classList.remove('inactive-series-tooltip');
                    }
                });
            }, 0);

            const point = d.point;
            const currentLang = getCurrentLanguage();

            // Try to get name from our data
            let name = '';
            if (point.name) {
                name = currentLang === 'zh' && point.name_zh ? point.name_zh : point.name;
            } else if (d.series && d.series.key) {
                name = d.series.key;
            }

            const color = getPlayerColor(point.index);
            const date = formatDate(point.x);
            const rating = point.y.toFixed(2);

            // Date label based on language
            const dateLabel = currentLang === 'zh' ? '日期' : 'Date';
            const ratingLabel = currentLang === 'zh' ? '等级分' : 'Rating';

            // Create tooltip content with our styling
            return `
                <div class="nvtooltip-content" style="text-align: center;">
                    <h3 style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                        ${name} 
                        <span style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; margin-left: 12px; border-radius: 2px;"></span>
                    </h3>
                    <p style="text-align: left;">${dateLabel}: ${date}</p>
                    <p style="text-align: left;">${ratingLabel}: ${rating}</p>
                </div>
            `;
        });

        chart.xAxis
            .axisLabel(getCurrentLanguage() === 'zh' ? '日期' : 'Date')
            .tickFormat(function (d) {
                // Convert days since MIN_DATE to an actual date
                const date = new Date('1988-10-01');
                date.setDate(date.getDate() + d);
                return d3.time.format('%Y-%m-%d')(date);
            });

        chart.yAxis
            .axisLabel(getCurrentLanguage() === 'zh' ? '等级分' : 'Rating')
            .tickFormat(d3.format('.0f'));

        // Set colors
        chart.color(function (d, i) {
            return colorPalette[d.index % colorPalette.length];
        });

        // Apply chart to SVG
        d3.select(chartDiv).select('svg')
            .datum(chartData)
            .call(chart);

        // After chart is rendered:
        setTimeout(function () {
            // Select all prediction series and make them dashed
            d3.select(chartDiv).selectAll('.nv-groups .nv-group')
                .each(function (d, i) {
                    if (d && d.predicted) {
                        d3.select(this).selectAll('path.nv-line')
                            .attr('stroke-dasharray', '5,5');
                    }
                });
        }, 500);

        // Handle responsive resizing
        nv.utils.windowResize(function () {
            chart.update();
        });

        // Store chart reference
        if (gender === 'men') {
            window.menChart = chart;
        } else {
            window.womenChart = chart;
        }

        return chart;
    });

    // Connect legend to chart
    addLegendInteraction(gender, legend);
}

// Function to create the legend with 7 players per row
function createLegend(gender, players) {
    const legend = document.createElement('div');
    legend.className = 'chart-legend';

    // Create container for title and hide all button
    const titleRow = document.createElement('div');
    titleRow.className = 'legend-title-row';
    titleRow.style.display = 'flex';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.alignItems = 'center';
    titleRow.style.marginBottom = '10px';
    titleRow.style.width = '100%';
    titleRow.style.gridColumn = '1 / -1';  // Make it span all columns

    // Add title
    const title = document.createElement('div');
    title.textContent = gender === 'men' ?
        (getTranslation('mens-top-players') || "Men's Top Players") :
        (getTranslation('womens-top-players') || "Women's Top Players");
    title.style.fontWeight = 'bold';

    // Add hide all button
    const hideAllButton = document.createElement('button');
    hideAllButton.className = 'hide-all-button';
    hideAllButton.textContent = getCurrentLanguage() === 'zh' ? '隐藏全部' : 'Hide All';
    hideAllButton.style.padding = '4px 8px';
    hideAllButton.style.fontSize = '0.8rem';
    hideAllButton.style.backgroundColor = '#f0f0f0';
    hideAllButton.style.border = '1px solid #ccc';
    hideAllButton.style.borderRadius = '3px';
    hideAllButton.style.cursor = 'pointer';

    // Add hover effect to button
    hideAllButton.onmouseover = function () {
        this.style.backgroundColor = '#e0e0e0';
    };
    hideAllButton.onmouseout = function () {
        this.style.backgroundColor = '#f0f0f0';
    };

    // Add click handler to hide all players
    hideAllButton.addEventListener('click', function () {
        // Get all legend items
        const items = legend.querySelectorAll('.legend-item');

        // Add inactive class to all items
        items.forEach(item => {

            if (!item.classList.contains('inactive')) {
                item.classList.add('inactive');

                // Trigger the same behavior as clicking each item
                const index = parseInt(item.getAttribute('data-index'));
                window.inactiveSeries[gender].add(index);
                const chart = gender === 'men' ? window.menChart : window.womenChart;
                if (chart) {
                    // Get all matching series elements and hide them
                    const svg = d3.select(`#${gender} .chart-svg-container svg`);
                    svg.selectAll(`.nv-series-${2 * index}`).style('opacity', 0.05);
                    svg.selectAll(`.nv-series-${2 * index + 1}`).style('opacity', 0.05);
                }
            }
        });

        // Change button text to indicate all are hidden
        this.textContent = getCurrentLanguage() === 'zh' ? '已隐藏全部' : 'All Hidden';
        this.disabled = true;
        this.style.opacity = '0.6';
        this.style.cursor = 'default';
    });

    // Add elements to title row
    titleRow.appendChild(title);
    titleRow.appendChild(hideAllButton);

    // Add title row to legend
    legend.appendChild(titleRow);

    // Current language
    const currentLang = getCurrentLanguage();

    // Add player items
    players.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.setAttribute('data-index', index);

        const color = document.createElement('div');
        color.className = 'legend-color';
        color.style.backgroundColor = getPlayerColor(index);

        const text = document.createElement('div');
        text.className = 'legend-text';
        text.textContent = currentLang === 'zh' && player.name_zh ? player.name_zh : player.name;

        // Add tooltip
        item.title = text.textContent;

        item.appendChild(color);
        item.appendChild(text);
        legend.appendChild(item);
    });

    return legend;
}

// Function to add interaction between legend and chart
function addLegendInteraction(gender, legend) {
    const items = legend.querySelectorAll('.legend-item');
    const hideAllButton = legend.querySelector('.hide-all-button')
    const currentLang = getCurrentLanguage();

    items.forEach(item => {
        item.addEventListener('click', function () {
            // Toggle inactive class
            this.classList.toggle('inactive');

            // Get the series index
            const index = parseInt(this.getAttribute('data-index'));

            // Update the inactiveSeries set
            if (this.classList.contains('inactive')) {
                window.inactiveSeries[gender].add(index);
            } else {
                window.inactiveSeries[gender].delete(index);
            }

            // Get the chart
            const chart = gender === 'men' ? window.menChart : window.womenChart;
            if (!chart) return;

            // Get all matching series elements
            const svg = d3.select(`#${gender} .chart-svg-container svg`);
            const opacity = this.classList.contains('inactive') ? 0.05 : 1;

            // Update opacity
            svg.selectAll(`.nv-series-${index * 2}`).style('opacity', opacity);
            svg.selectAll(`.nv-series-${index * 2 + 1}`).style('opacity', opacity);

            // Check if any items are active and update the button
            const allInactive = Array.from(
                legend.querySelectorAll('.legend-item')
            ).every(item => item.classList.contains('inactive'));

            // If not all items are inactive, re-enable the button
            if (!allInactive && hideAllButton.disabled) {
                hideAllButton.textContent = currentLang === 'zh' ? '隐藏全部' : 'Hide All';
                hideAllButton.disabled = false;
                hideAllButton.style.opacity = '1';
                hideAllButton.style.cursor = 'pointer';
            }
        });
    });
}

// Function to process raw player data into chart format
function processChartData(players, includePredictions = true) {
    const minDate = new Date('1988-10-01');
    const today = Math.floor((new Date() - minDate) / (1000 * 60 * 60 * 24));

    const result = [];

    players.forEach((player, index) => {
        // Create the main series with just the actual data
        const actualValues = player.ratings.map(rating => ({
            x: parseInt(rating.date),
            y: parseFloat(rating.rating),
            name: player.name,
            name_zh: player.name_zh,
            id: player.id,
            index: index,
        }));

        // Sort by date
        actualValues.sort((a, b) => a.x - b.x);

        // Add the main series
        result.push({
            key: player.name,
            values: actualValues,
            id: player.id,
            index: index,
        });

        // If including predictions, add a separate prediction series
        if (includePredictions) {
            const lastRating = player.ratings[player.ratings.length - 1];
            if (lastRating) {
                const lastDate = parseInt(lastRating.date);
                const retireDate = Math.min(today, lastDate + 365); // 1 year or today

                // Create prediction series with just the last point and prediction point
                const predictionValues = [
                    {
                        x: lastDate,
                        y: parseFloat(lastRating.rating),
                        name: player.name,
                        name_zh: player.name_zh,
                        id: player.id,
                        index: index,
                    },
                    {
                        x: retireDate,
                        y: parseFloat(lastRating.rating),
                        name: player.name,
                        name_zh: player.name_zh,
                        id: player.id,
                        index: index,
                        predicted: true,
                    }
                ];

                // Add the prediction series
                result.push({
                    key: player.name + ' (prediction)',
                    values: predictionValues,
                    id: player.id,
                    index: index,
                    predicted: true, // Mark this whole series as prediction
                    showInLegend: false // Don't show in legend
                });

            }
        }
    });

    return result;
}

// Function to calculate y-axis range with padding
function calculateYAxisRange(chartData) {
    let min = Infinity;
    let max = -Infinity;

    chartData.forEach(series => {
        series.values.forEach(point => {
            if (point.y < min) min = point.y;
            if (point.y > max) max = point.y;
        });
    });

    // Add padding (5%)
    const padding = (max - min) * 0.05;
    return {
        min: Math.floor(min - padding),
        max: Math.ceil(max + padding)
    };
}

// Function to calculate x-axis range with padding
function calculateXAxisRange(chartData) {
    let min = Infinity;
    let max = -Infinity;

    chartData.forEach(series => {
        series.values.forEach(point => {
            if (point.x < min) min = point.x;
            if (point.x > max) max = point.x;
        });
    });

    // Add padding (5%)
    const padding = (max - min) * 0.05;
    return {
        min: Math.floor(min - padding),
        max: Math.ceil(max + padding)
    };
}

// Function to format date
function formatDate(daysSinceMinDate) {
    const date = new Date('1988-10-01');
    date.setDate(date.getDate() + parseInt(daysSinceMinDate));
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// Function to create a color palette
function createColorPalette() {
    const count = 50;
    const baseColors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2',
        '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896',
        '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5', '#393b79',
        '#6b6ecf', '#637939', '#b5cf6b', '#8c6d31', '#e6550d', '#843c39', '#ad494a',
        '#7b4173', '#a55194', '#5254a3', '#f781bf', '#a65628', '#ce6dbd', '#3182bd'
    ];

    // Add variations if needed
    const colors = [...baseColors];
    let i = 0;

    while (colors.length < count) {
        const baseColor = d3.rgb(baseColors[i % baseColors.length]);
        const hsl = d3.hsl(baseColor);

        if (i % 2 === 0) {
            hsl.l = Math.max(0.2, Math.min(0.8, hsl.l + 0.2));
        } else {
            hsl.s = Math.max(0.3, Math.min(0.9, hsl.s - 0.2));
        }

        colors.push(hsl.toString());
        i++;
    }

    return colors;
}

// Helper function to get player color
function getPlayerColor(index) {
    const colors = createColorPalette();

    return colors[index % colors.length];
}