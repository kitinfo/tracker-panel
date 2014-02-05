<?php

$TABLES = array(
    "peers" => "id",
    "categories" => "id",
    "torrents" => "id"
);
$VIEWS = array(
    "torrentcategories" => "torrent",
    "newtorrents" => "id"
);


//TODO: POST delete torrent
//TODO: POST delete catmapping
//TODO: POST add catmapping
# open db
$db = new PDO("sqlite:backing.db3");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
        
$retVal["status"]="ok";

$tables = array_keys($TABLES);
foreach ($tables as $table) {
    $retVal = request($db, $table, $TABLES[$table], $retVal);
}

$viewKeys = array_keys($VIEWS);
foreach ($viewKeys as $view) {
    $viewData = $_GET[$view];

    if (isset($viewData)) {
	$retVal[$view] = getView($db, $viewData, $view, $TABLES[$view]);
    }
}

$cat = $_GET["cat"];
$torrents = $_GET["torrents"];

if (isset($torrents) && isset($cat) && !empty($cat)) {
    if ($cat == "new") {
	$retVal["torrents"] = getView($db, "*", "newtorrents", "category");
    } else {
	$retVal["torrents"] = getView($db, $cat, "torrentcategories", "category");
    }
}

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
# Rückmeldung senden

if (isset($_GET["callback"]) && !empty($_GET["callback"])) {
    $callback = $_GET["callback"];
    echo $callback . "('" . json_encode($retVal, JSON_NUMERIC_CHECK) . "')";
} else {
    echo json_encode($retVal, JSON_NUMERIC_CHECK);
}

function getView($db, $data, $tag, $search) {

    if (empty($data) || $data == "*") {
	$stm = $db->prepare("SELECT * FROM [" . $tag . "]");
	$stm->execute();
    } else {
	$stm = $db->prepare("SELECT * FROM [" . $tag . "] WHERE " . $search . " = :data");
	$stm->execute(array(
	    ':data' => $data
	));
    }
    $retVal = $stm->fetchAll(PDO::FETCH_ASSOC);
    $stm->closeCursor();

    return $retVal;
}

function getTables($db) {

    $tablesquery = $db->query("SELECT name FROM sqlite_master WHERE type='table';");
    $i = 0;
    $tablesRaw = $tablesquery->fetchAll(PDO::FETCH_ASSOC);
    foreach ($tablesRaw as $table) {

	$tables[$i] = $table['name'];
	$i++;
    }

    $tablesquery->closeCursor();

    return $tables;
}

function request($db, $tag, $searchTag, $retVal) {

    $tagObject = $_GET[$tag];

    if (isset($tagObject)) {

	// options
	if (!empty($tagObject)) {
	    $STMT = $db->prepare("SELECT * FROM " . $tag . " WHERE " . $searchTag . " = ?");
	    $STMT->execute(array($tagObject));
	} else {
	    $STMT = $db->query("SELECT * FROM " . $tag);
	}

	if ($STMT !== FALSE) {

	    $retVal[$tag] = $STMT->fetchAll(PDO::FETCH_ASSOC);
	} else {
	    $retVal["status"] = "Failed to create statement";
	}
	$STMT->closeCursor();
    }
    
return $retVal;
}


?>
