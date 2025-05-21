<?php
// Set headers to allow cross-origin requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get player ID from the query string
$playerId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($playerId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid player ID']);
    exit;
}

// Fetch the player profile directly as JSON
$url = "https://results.ittf.link/index.php/player-profile/list/60?resetfilters=1&vw_profiles___player_id_raw={$playerId}&format=json";
$jsonResponse = @file_get_contents($url);

if (!$jsonResponse) {
    echo json_encode(['success' => false, 'error' => 'Failed to fetch player profile']);
    exit;
}

// Parse the JSON response
$data = json_decode($jsonResponse, true);

// Check if we got valid data
if (!$data || !is_array($data) || empty($data[0])) {
    echo json_encode(['success' => false, 'error' => 'Invalid data format from server']);
    exit;
}

// Extract the image URL from the photo field
$photoField = isset($data[0][0]['vw_profiles___photo']) ? $data[0][0]['vw_profiles___photo'] : '';

// Use regex to find the image URL
if (preg_match('/src=\'([^\']+)\'/', $photoField, $matches)) {
    echo json_encode(['success' => true, 'photoUrl' => $matches[1]]);
} else {
    echo json_encode(['success' => false, 'error' => 'No photo found']);
}
?>