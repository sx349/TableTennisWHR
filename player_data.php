<?php
// Set headers to allow cross-origin requests and specify JSON content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Define the path to your SQLite database
$dbPath = "DATA.DB";

// Get player ID from the query string
$playerId = isset($_GET['id']) ? intval($_GET['id']) : 0;


// Get language preference (default to English if not specified)
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'en';


// Initialize response array
$response = [
    'success' => false,
    'message' => '',
    'player' => null,
    'ratings' => []
];


// Define error messages in both languages
$errorMessages = [
    'en' => [
        'invalid_id' => 'Invalid player ID',
        'player_not_found' => 'Player not found',
        'db_error' => 'Database error: '
    ],
    'zh' => [
        'invalid_id' => '无效的球员ID',
        'player_not_found' => '未找到球员',
        'db_error' => '数据库错误：'
    ]
];

// Get appropriate error message based on language
function getErrorMessage($key, $lang) {
    global $errorMessages;
    return isset($errorMessages[$lang][$key]) ? $errorMessages[$lang][$key] : $errorMessages['en'][$key];
}

// Check if player ID is provided
if ($playerId <= 0) {
    $response['message'] = getErrorMessage('invalid_id', $lang);
    echo json_encode($response);
    exit;
}

try {
    // Connect to the SQLite database
    $db = new SQLite3($dbPath);
    
    // Get player information
    $stmt = $db->prepare('SELECT p.id, p.name, p.gender, p.yob, p.assoc, p.ma, 
                         pc.name_zh, ac.assoc_zh 
                         FROM players p 
                         LEFT JOIN players_chinese pc ON p.id = pc.id 
                         LEFT JOIN associations_chinese ac ON p.assoc = ac.assoc 
                         WHERE p.id = :id');
    $stmt->bindValue(':id', $playerId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $player = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$player) {
        $response['message'] = getErrorMessage('player_not_found', $lang);
        echo json_encode($response);
        exit;
    }
    
    // Determine which ratings table to use based on gender
    $ratingsTable = $player['gender'] === 'M' ? 'men_ratings' : 'women_ratings';
    
    // Get player's rating history
    $stmt = $db->prepare('SELECT date, rating, error FROM ' . $ratingsTable . ' WHERE name = :id ORDER BY date');
    $stmt->bindValue(':id', $playerId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    
    $ratings = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        // Format the rating values to 2 decimal places
        $row['rating'] = number_format((float)$row['rating'], 2, '.', '');
        $row['error'] = number_format((float)$row['error'], 2, '.', '');
        $ratings[] = $row;
    }
    
    // Close the database connection
    $db->close();
    
    // Return the player data and ratings
    $response['success'] = true;
    $response['player'] = $player;
    $response['ratings'] = $ratings;
    
} catch (Exception $e) {
    $response['message'] =getErrorMessage('db_error', $lang) . $e->getMessage();
}

// Output the response as JSON
echo json_encode($response);
?>