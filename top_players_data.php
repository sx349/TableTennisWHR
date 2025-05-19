<?php
// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Define constants
define('DB_PATH', 'DATA.DB');
define('MIN_DATE', '1988-10-01');

// Get request parameters
$gender = isset($_GET['gender']) ? $_GET['gender'] : 'men';
$ids = isset($_GET['ids']) ? $_GET['ids'] : '';
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'en';

// Validate input
if (empty($ids)) {
    echo json_encode(['error' => true, 'message' => 'No player IDs provided']);
    exit;
}

// Determine ratings table based on gender
$ratingsTable = $gender === 'men' ? 'men_ratings' : 'women_ratings';

try {
    // Connect to database
    $db = new SQLite3(DB_PATH);
    
    // Split player IDs into array
    $playerIds = explode(',', $ids);
    
    // Get player information from players and players_chinese tables
    $players = [];
    foreach ($playerIds as $id) {
        // Get basic player info
        $stmt = $db->prepare('SELECT id, name, gender, yob, assoc, ma FROM players WHERE id = :id');
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $player = $result->fetchArray(SQLITE3_ASSOC);
        
        if (!$player) {
            continue; // Skip if player not found
        }
        
        // Get Chinese name if available
        $stmt = $db->prepare('SELECT name_zh FROM players_chinese WHERE id = :id');
        $stmt->bindValue(':id', $id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $chineseName = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($chineseName) {
            $player['name_zh'] = $chineseName['name_zh'];
        }
        
        // Get player ratings
        $stmt = $db->prepare("SELECT date, rating FROM $ratingsTable WHERE name = :id ORDER BY date");
        $stmt->bindValue(':id', (string)$id, SQLITE3_TEXT);
        $result = $stmt->execute();
        
        $ratings = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $ratings[] = [
                'date' => $row['date'],
                'rating' => (float)$row['rating']
            ];
        }
        
        if (!empty($ratings)) {
            $players[] = [
                'id' => (int)$player['id'],
                'name' => $player['name'],
                'name_zh' => isset($player['name_zh']) ? $player['name_zh'] : null,
                'gender' => $player['gender'],
                'ratings' => $ratings
            ];
        }
    }
    
    // Close database connection
    $db->close();
    
    // Return response
    echo json_encode([
        'success' => true,
        'players' => $players,
        'min_date' => MIN_DATE
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => true,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}