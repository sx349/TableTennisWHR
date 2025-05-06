<?php
// Set headers to allow cross-origin requests and specify JSON content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Define the path to your SQLite database
$dbPath = "DATA.DB";

// Get gender from the query string
$gender = isset($_GET['gender']) ? $_GET['gender'] : 'men';
$lang = isset($_GET['lang']) ? $_GET['lang'] : 'en';

// Determine which table to use based on gender
$histTable = $gender === 'men' ? 'men_hist_rank' : 'women_hist_rank';

try {
    // Connect to the SQLite database
    $db = new SQLite3($dbPath);
    
    // Highly optimized query with subquery to filter rank <= 10 BEFORE joining
    $stmt = $db->prepare('
        SELECT hr.eval_date, hr.rank, hr.id, hr.rating, 
               p.name, pc.name_zh
        FROM (
            SELECT eval_date, rank, id, rating
            FROM ' . $histTable . '
            WHERE rank <= 5
        ) hr
        JOIN players p ON hr.id = p.id
        LEFT JOIN players_chinese pc ON hr.id = pc.id
        ORDER BY hr.eval_date DESC, hr.rank
    ');
    
    $result = $stmt->execute();
    
    // Process the results to create the required structure
    $historyData = [];
    $currentDate = null;
    $currentPlayers = [];
    
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        // If we've moved to a new date
        if ($currentDate !== $row['eval_date']) {
            // If this isn't the first date, add the previous date's data
            if ($currentDate !== null) {
                $historyData[] = [
                    'date' => $currentDate,
                    'players' => $currentPlayers
                ];
            }
            
            // Start a new date
            $currentDate = $row['eval_date'];
            $currentPlayers = [];
        }
        
        // Format the rating value to 2 decimal places
        $row['rating'] = number_format((float)$row['rating'], 2, '.', '');
        
        // Add this player to the current date's players
        $currentPlayers[] = [
            'id' => $row['id'],
            'rank' => $row['rank'],
            'name' => $row['name'],
            'name_zh' => $row['name_zh'],
            'rating' => $row['rating']
        ];
    }
    
    // Add the last date's data if it exists
    if ($currentDate !== null) {
        $historyData[] = [
            'date' => $currentDate,
            'players' => $currentPlayers
        ];
    }
    
    // Close the database connection
    $db->close();
    
    // Output the data as JSON
    echo json_encode($historyData);
    
} catch (Exception $e) {
    // Return error message
    echo json_encode([
        'error' => true,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>