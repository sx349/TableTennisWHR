<?php
// Set headers to allow cross-origin requests and specify JSON content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Define the path to your SQLite database
$dbPath = "DATA.DB";

// Get parameters from the query string
$gender = isset($_GET['gender']) ? $_GET['gender'] : 'men';
$date = isset($_GET['date']) ? $_GET['date'] : null;
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'en';

// Define error messages in both languages
$errorMessages = [
    'en' => [
        'invalid_date' => 'Invalid date format',
        'date_not_found' => 'No data available for this date',
        'db_error' => 'Database error: '
    ],
    'zh' => [
        'invalid_date' => '无效的日期格式',
        'date_not_found' => '没有该日期的数据',
        'db_error' => '数据库错误：'
    ]
];

// Get appropriate error message based on language
function getErrorMessage($key, $lang) {
    global $errorMessages;
    return isset($errorMessages[$lang][$key]) ? $errorMessages[$lang][$key] : $errorMessages['en'][$key];
}

// Check if date is provided
if (!$date) {
    echo json_encode([
        'error' => true,
        'message' => getErrorMessage('invalid_date', $lang)
    ]);
    exit;
}

// Determine which table to use based on gender
$histTable = $gender === 'men' ? 'men_hist_rank' : 'women_hist_rank';

try {
    // Connect to the SQLite database
    $db = new SQLite3($dbPath);
    
    // Check if data exists for the given date
    $stmt = $db->prepare('SELECT COUNT(*) as count FROM ' . $histTable . ' WHERE eval_date = :date');
    $stmt->bindValue(':date', $date, SQLITE3_TEXT);
    $result = $stmt->execute();
    $count = $result->fetchArray(SQLITE3_ASSOC)['count'];
    
    if ($count == 0) {
        echo json_encode([
            'error' => true,
            'message' => getErrorMessage('date_not_found', $lang)
        ]);
        $db->close();
        exit;
    }
    
    // OPTIMIZED QUERY - First filter by eval_date before joining with other tables
    $stmt = $db->prepare('
        SELECT hr.rank, hr.id, hr.rating, hr.error, p.name, p.yob, p.assoc, p.ma, 
               pc.name_zh, ac.assoc_zh
        FROM (
            SELECT * FROM ' . $histTable . ' 
            WHERE eval_date = :date
            ORDER BY rank
        ) hr
        JOIN players p ON hr.id = p.id
        LEFT JOIN players_chinese pc ON hr.id = pc.id
        LEFT JOIN associations_chinese ac ON p.assoc = ac.assoc
        ORDER BY hr.rank
    ');
    $stmt->bindValue(':date', $date, SQLITE3_TEXT);
    $result = $stmt->execute();
    
    $rankings = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        // Format the rating values to 2 decimal places
        $row['rating'] = number_format((float)$row['rating'], 2, '.', '');
        $row['error'] = number_format((float)$row['error'], 2, '.', '');
        
        // For compatibility with the frontend display
        $row['association'] = $row['ma'];
        
        $rankings[] = $row;
    }
    
    // Close the database connection
    $db->close();
    
    // Output the data as JSON
    echo json_encode($rankings);
    
} catch (Exception $e) {
    // Return error message
    echo json_encode([
        'error' => true,
        'message' => getErrorMessage('db_error', $lang) . $e->getMessage()
    ]);
}
?>