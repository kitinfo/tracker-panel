<?php
    # open db
$db = new PDO("sqlite:backing.db3");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
        
$retVal["status"]="ok";

$tables = getTables($db);
foreach ($tables as $table) {
    $retVal = request($db, $table, $retVal);
}

$tag = 'torrentcategories';
$view = $_GET[$tag];

if (isset($view)) {

	$retVal[$tag] = getView($db, $view, $tag);
}

header("Content-Type: application/javascript");
header("Access-Control-Allow-Origin: *");
# Rückmeldung senden

if (isset($_GET["callback"]) && !empty($_GET["callback"])) {
    $callback = $_GET["callback"];
    echo $callback . "('" . json_encode($retVal, JSON_NUMERIC_CHECK) . "')";
} else {
    echo json_encode($retVal, JSON_NUMERIC_CHECK);
}

function getView($db, $view, $tag) {

    if (empty($view)) {
	$stm = $db->prepare("SELECT * FROM [". $tag ."]");
	$stm->execute();
    } else {
	$stm = $db->prepare("SELECT * FROM [" . $tag . "] WHERE id = :view");
	$stm->execute(array(
	    ':view' => $view
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

function request($db, $tag, $retVal) {

    $tagObject = $_GET[$tag];

    if (isset($tagObject)) {

	// options
	if (!empty($tagObject)) {
	    //query('settings', $retVal);
	    $STMT = $db->query("SELECT * FROM " . $tag . " WHERE id = " . $tagObject);
	} else {
	    //query('settings', $retVal);
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
