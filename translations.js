// Global translations object
const translations = {
    en: {
        // Page titles
        'main-title': 'Table Tennis Whole-History Rating (WHR)',
        'player-title': 'Player Profile | Table Tennis WHR',

        // Header info
        'last-data': 'Last data retrieved:',
        'last-ranking': 'Last ranking updated:',
        'beijing-time': '(Beijing Time, UTC+8)',

        // Tabs
        'men-singles': 'Men\'s Singles',
        'women-singles': 'Women\'s Singles',

        // Table headers
        'rank': 'Rank',
        'player': 'Player',
        'year-of-birth': 'Year of Birth',
        'association': 'Association',
        'rating': 'Rating',
        'error': 'Error',
        'date': 'Date',

        // Player page
        'back-to-rankings': 'Back to Rankings',
        'loading-player': 'Loading player data...',
        'id': 'ITTF ID:',
        'yob': 'Year of Birth:',
        'assoc': 'Association:',
        'gender': 'Gender:',
        'current-rating': 'Current Rating:',
        'rating-history': 'Rating History',
        'date-intervals': '*Note: date intervals not to scale',
        'loading-history': 'Loading rating history...',

        // Gender values
        'male': 'Male',
        'female': 'Female',

        // Footer
        'match-data': 'Match data from ',
        'match-ittf': 'International Table Tennis Federation (ITTF)',
        'website-maintained': 'Website maintained by',
        'whr-algorithm': 'WHR algorithm credited to',
        'whr-implementation': 'WHR Python implementation by',
        'copyright': '© 2025 Table Tennis Whole-History Rating (WHR)',
        'total-views': 'Total Views:',
        'total-visitors': 'Total Visitors:',

        // Mobile column toggle
        'show-hide-columns': 'Show/hide columns:',
        'birth-year': 'Birth Year',

        // Error messages
        'no-player-id': 'No player ID provided',
        'failed-load': 'Failed to load player data',
        'error-loading': 'Error loading player data. Please try again later.',
        'no-data': 'No data available',
        'no-ranking-data': 'No ranking data available.',
        'loading': 'Loading...',
        'loading-rankings': 'Loading rankings...',
        'network-error': 'Network response was not ok',
        'error-loading-rankings': 'Error loading rankings. Please try again later.',
        'unknown': 'Unknown',

        // Language switcher
        'switch-language': '中文',

        // Historical rankings
        'history-title': 'Historical Rankings | Table Tennis WHR',
        'snapshot-title': 'Historical Snapshot | Table Tennis WHR',
        'men-singles-history': 'Men\'s Singles Historical Rankings',
        'women-singles-history': 'Women\'s Singles Historical Rankings',
        'eval-date': 'Evaluation Date',
        'rank-1': 'Rank 1',
        'rank-2': 'Rank 2',
        'rank-3': 'Rank 3',
        'rank-4': 'Rank 4',
        'rank-5': 'Rank 5',
        'rank-6': 'Rank 6',
        'rank-7': 'Rank 7',
        'rank-8': 'Rank 8',
        'rank-9': 'Rank 9',
        'rank-10': 'Rank 10',
        'loading-history': 'Loading historical rankings...',
        'error-loading-history': 'Error loading historical rankings. Please try again later.',
        'no-history-data': 'No historical ranking data available.',
        'snapshot-for': 'Rankings Snapshot for',
        'back-to-history': 'Back to Historical Rankings',
        'loading-snapshot': 'Loading snapshot data...',
        'error-loading-snapshot': 'Error loading snapshot. Please try again later.',
        'no-snapshot-data': 'No snapshot data available for this date.',
        'no-date-provided': 'No date provided in the URL.',
        'men-singles-snapshot': 'Men\'s Singles Snapshot',
        'women-singles-snapshot': 'Women\'s Singles Snapshot',
        'realtime-rankings': 'Current Rankings',
        'historical-rankings': 'Historical Rankings',
    },
    zh: {
        // Page titles
        'main-title': '乒乓球全历史等级分（WHR）',
        'player-title': '选手档案 | 乒乓球WHR',

        // Header info
        'last-data': '数据获取时间：',
        'last-ranking': '排名更新时间：',
        'beijing-time': '（北京时间，UTC+8）',

        // Tabs
        'men-singles': '男子单打',
        'women-singles': '女子单打',

        // Table headers
        'rank': '排名',
        'player': '姓名',
        'year-of-birth': '出生年份',
        'association': '协会',
        'rating': '等级分',
        'error': '误差',
        'date': '日期',

        // Player page
        'back-to-rankings': '返回排名',
        'loading-player': '正在加载球员数据...',
        'id': 'ITTF编号：',
        'yob': '出生年份：',
        'assoc': '协会：',
        'gender': '性别：',
        'current-rating': '当前等级分：',
        'rating-history': '等级分历史',
        'date-intervals': '*注意：日期间隔未按比例显示',
        'loading-history': '正在加载等级分历史...',

        // Gender values
        'male': '男',
        'female': '女',

        // Footer
        'match-data': '比赛数据来自',
        'match-ittf': '国际乒乓球联合会（ITTF）',
        'website-maintained': '网站维护：',
        'whr-algorithm': 'WHR算法原作者：',
        'whr-implementation': 'WHR算法Python实现：',
        'copyright': '© 2025 乒乓球全历史等级分（WHR）',
        'total-views': '总浏览量：',
        'total-visitors': '总访问者：',

        // Mobile column toggle
        'show-hide-columns': '显示/隐藏列：',
        'birth-year': '出生年份',

        // Error messages
        'no-player-id': '未提供球员ID',
        'failed-load': '加载球员数据失败',
        'error-loading': '加载球员数据时出错。请稍后再试。',
        'no-data': '无可用数据',
        'no-ranking-data': '无可用排名数据。',
        'loading': '加载中...',
        'loading-rankings': '正在加载排名...',
        'network-error': '网络响应异常',
        'error-loading-rankings': '加载排名时出错。请稍后再试。',
        'unknown': '未知错误',

        // Language switcher
        'switch-language': 'English',

        // Historical rankings
        'history-title': '历史排名 | 乒乓球WHR',
        'snapshot-title': '历史快照 | 乒乓球WHR',
        'men-singles-history': '男子单打历史排名',
        'women-singles-history': '女子单打历史排名',
        'eval-date': '评估日期',
        'rank-1': '第1名',
        'rank-2': '第2名',
        'rank-3': '第3名',
        'rank-4': '第4名',
        'rank-5': '第5名',
        'rank-6': '第6名',
        'rank-7': '第7名',
        'rank-8': '第8名',
        'rank-9': '第9名',
        'rank-10': '第10名',
        'loading-history': '正在加载历史排名...',
        'error-loading-history': '加载历史排名时出错。请稍后再试。',
        'no-history-data': '无可用历史排名数据。',
        'snapshot-for': '排名快照：',
        'back-to-history': '返回历史排名',
        'loading-snapshot': '正在加载快照数据...',
        'error-loading-snapshot': '加载快照时出错。请稍后再试。',
        'no-snapshot-data': '该日期没有可用的快照数据。',
        'no-date-provided': '网址中未提供日期。',
        'men-singles-snapshot': '男子单打快照',
        'women-singles-snapshot': '女子单打快照',
        'realtime-rankings': '当前排名',
        'historical-rankings': '历史排名',
    }
};

// Function to get the current language from localStorage or default to English
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'zh';
}

// Function to set the language in localStorage
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    applyTranslations();

    // Update responsive table headers
    updateResponsiveTableHeaders();

    // Update page title
    if (window.location.pathname.includes('player.html')) {
        // For player page, we need to preserve player name but translate the rest
        const playerNameElement = document.getElementById('player-name');
        let playerName = playerNameElement ? playerNameElement.textContent : '';

        // If we're switching to Chinese and there's a Chinese name available, use it
        if (lang === 'zh') {
            const urlParams = new URLSearchParams(window.location.search);
            const playerId = urlParams.get('id');
            if (playerId) {
                // We'll update the player name when the data is fetched
                // The title will be updated in the fetchPlayerData function
                return; // Return early as the title will be updated by fetchPlayerData
            }
        }

        document.title = `${playerName} | ${getTranslation('player-title')}`;
    } else {
        // For main page
        document.title = getTranslation('main-title');
    }
}

// Function to toggle between languages
function toggleLanguage() {
    const currentLang = getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'zh' : 'en';
    setLanguage(newLang);

    // Update the language switcher button text
    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.textContent = getTranslation('switch-language');
    }

    // Reload rankings if on main page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadRankings('men');
        loadRankings('women');
        fetchUpdateTimes();
        setTimeout(addColumnToggle, 500);
        // Update the main page title
        document.title = getTranslation('main-title');
        // Update responsive table headers
        updateResponsiveTableHeaders();
    }

    // Reload player data if on player page
    if (window.location.pathname.includes('player.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const playerId = urlParams.get('id');
        if (playerId) {
            // Add a small delay to ensure any pending operations are completed
            setTimeout(() => {
                fetchPlayerData(playerId);
                // The title will be updated in fetchPlayerData
            }, 50);
        } else {
            // If no player ID for some reason, just update with generic title
            document.title = getTranslation('player-title');
        }
        // Update responsive table headers
        updateResponsiveTableHeaders();
    }
}

// Function to get a translation
function getTranslation(key) {
    const lang = getCurrentLanguage();
    return translations[lang][key] || translations['en'][key] || key;
}

// Function to apply translations to the entire page
function applyTranslations() {
    // Add data-i18n attribute to all elements that need translation
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            element.textContent = getTranslation(key);
        }
    });
}


// Initialize language on page load
document.addEventListener('DOMContentLoaded', function () {
    applyTranslations();

    // Add language switcher button if not already present
    if (!document.getElementById('language-switcher')) {
        const languageSwitcher = document.createElement('button');
        languageSwitcher.id = 'language-switcher';
        languageSwitcher.className = 'language-button';
        languageSwitcher.textContent = getTranslation('switch-language');
        languageSwitcher.onclick = toggleLanguage;

        // Add to header
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(languageSwitcher);
        }
    }

    // Initialize responsive table headers
    updateResponsiveTableHeaders();
});


function updateResponsiveTableHeaders() {
    // Get current language
    const currentLang = getCurrentLanguage();

    // Create or update the stylesheet for responsive table headers
    let styleElement = document.getElementById('responsive-headers-style');

    // If the style element doesn't exist, create it
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'responsive-headers-style';
        document.head.appendChild(styleElement);
    }

    // Get translations for the headers
    const rankText = getTranslation('rank');
    const playerText = getTranslation('player');
    const birthYearText = getTranslation('year-of-birth');
    const associationText = getTranslation('association');
    const ratingText = getTranslation('rating');
    const errorText = getTranslation('error');
    const dateText = getTranslation('date');

    // Define the CSS with the translated headers
    const css = `
        @media (max-width: 767px) {
            /* Define table headers for ranking table cells */
            #men-table td:nth-of-type(1):before,
            #women-table td:nth-of-type(1):before {
                content: "${rankText}";
            }
            
            #men-table td:nth-of-type(2):before,
            #women-table td:nth-of-type(2):before {
                content: "${playerText}";
            }
            
            #men-table td:nth-of-type(3):before,
            #women-table td:nth-of-type(3):before {
                content: "${birthYearText}";
            }
            
            #men-table td:nth-of-type(4):before,
            #women-table td:nth-of-type(4):before {
                content: "${associationText}";
            }
            
            #men-table td:nth-of-type(5):before,
            #women-table td:nth-of-type(5):before {
                content: "${ratingText}";
            }
            
            #men-table td:nth-of-type(6):before,
            #women-table td:nth-of-type(6):before {
                content: "${errorText}";
            }
            
            /* Define table headers for history table cells */
            #history-table td:nth-of-type(1):before {
                content: "${dateText}";
            }
            
            #history-table td:nth-of-type(2):before {
                content: "${ratingText}";
            }
            
            #history-table td:nth-of-type(3):before {
                content: "${errorText}";
            }
        }
    `;

    // Update the stylesheet content
    styleElement.textContent = css;
}