<?php

$TABLES = array(
    "peers" => "id",
    "categories" => "id",
    "torrents" => "id"
);
$VIEWS = array(
    "torrentcategories" => "id",
    "newtorrents" => "id"
);

$http_raw = file_get_contents("php://input");


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


$catfor = $_GET["catfor"];

if (isset($catfor) && !empty($catfor)) {

    $retVal["categories"] = getView($db, $catfor, "torrentcategories", "id");
}

if (isset($torrents) && isset($cat) && !empty($cat)) {
    if ($cat == "new") {
	$retVal["torrents"] = getView($db, "*", "newtorrents", "category");
    } else {
	$retVal["torrents"] = getView($db, $cat, "torrentcategories", "category");
    }
}

$delTorrent = $_POST["torrent-del"];

if (isset($delTorrent) && !empty($delTorrent)) {
    $retVal["status"] = delTorrent($db, $torrent);
}

if (isset($http_raw) && !empty($http_raw)) {

    $obj = json_decode($http_raw, true);

    if (isset($_GET["category-add"])) {

	$retVal["status"] = addCatMapping($db, $obj["torrent"], $obj["category"]);
    }
    if (isset($_GET["category-del"])) {
	$retVal["status"] = delCatMapping($db, $obj["torrent"], $obj["category"]);
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

function delTorrent($db, $torrent) {
    $query = "DELETE FROM torrents WHERE id = :torrent";

    $stm = $db->prepare($query);
    $stm->execute(array(
	":torrent" => $torrent
    ));

    $retVal = $stm->errorInfo();

    $stm->closeCursor();
    return $retVal;
}

function addCatMapping($db, $torrent, $cat) {

    $query = "INSERT INTO categorymap (torrent, category) VALUES(:torrent, :cat)";

    $stm = $db->prepare($query);
    $stm->execute(array(
	":torrent" => $torrent,
	":cat" => $cat
    ));

    $retVal = $stm->errorInfo();

    $stm->closeCursor();
    return $retVal;
}

function delCatMapping($db, $torrent, $cat) {

    $query = "DELETE FROM categorymap WHERE torrent = :torrent AND category = :cat";

    $stm = $db->prepare($query);
    $stm->execute(array(
	":torrent" => $torrent,
	":cat" => $cat
    ));

    $retVal = $stm->errorInfo();

    $stm->closeCursor();
    return $retVal;
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
