<?php
// Set headers to allow cross-origin requests and specify JSON content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Define the path to your SQLite database
$dbPath = "DATA.DB";

// Get player ID from the query string
$playerId = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Initialize response array
$response = [
    'success' => false,
    'message' => '',
    'player' => null,
    'ratings' => []
];

// Check if player ID is provided
if ($playerId <= 0) {
    $response['message'] = 'Invalid player ID';
    echo json_encode($response);
    exit;
}

try {
    // Connect to the SQLite database
    $db = new SQLite3($dbPath);
    
    // Get player information
    $stmt = $db->prepare('SELECT id, name, gender, yob, assoc, ma FROM players WHERE id = :id');
    $stmt->bindValue(':id', $playerId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $player = $result->fetchArray(SQLITE3_ASSOC);
    
    if (!$player) {
        $response['message'] = 'Player not found';
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
    $response['message'] = 'Database error: ' . $e->getMessage();
}

// Output the response as JSON
echo json_encode($response);
?>