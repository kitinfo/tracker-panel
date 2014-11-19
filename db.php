<?php



function main() {

    global $db, $output;
    global $dbpath;
    $dbpath = "backing.db3";

    $db = new DB();
    $db->connect();
    $output = Output::getInstance();
    $torrent = new Torrent();
    $category = new Category();

    $endpoint = getEndPoint();
    $value = $_GET[$endpoint];

    if (!empty($value)) {
	switch ($endpoint) {
	    case "peers":
		$torrent->getPeers($value);
		break;
	    case "torrents":
		$torrent->get($value);
		break;
	    case "categories":
		$category->get($value);
		break;
	    case "catfor":
	    case "torrentcategories":
		$torrent->getCategories($value);
		break;
	}
    } else {
	switch ($endpoint) {
	    case "peers":
		$torrent->getAllPeers();
		break;
	    case "torrents":
		$cat = $_GET["cat"];
		if (isset($cat) && !empty($cat)) {
		    $torrent->getByCategory($cat);
		} else {
		    $torrent->getAll();
		}
		break;
	    case "categories":
		$category->getAll();
		break;
	    case "torrentcategories":
		$torrent->getAllCategories();
		break;
	    case "newtorrents":
		$torrent->getNew();
	}
    }


    $http_raw = file_get_contents("php://input");

    if (isset($http_raw) && !empty($http_raw)) {

	$obj = json_decode($http_raw, true);

	switch ($endpoint) {
	    case "category-add":
		$category->add($obj["torrent"], $obj["category"]);
		break;
	    case "category-del":
		$category->delete($obj["torrent"], $obj["category"]);
		break;
	    case "torrent-rename":
		$torrent->rename($obj["id"], $obj["name"]);
		break;
	    case "torrent-del":
		$torrent->delete($obj["id"]);
		break;
	}
    }

    $output->write();
}

main();

/*
 * search current end point
 */

function getEndPoint() {
    // all end points
    $api_points = array(
	"peers",
	"categories",
	"torrents",
	"torrentcategories",
	"newtorrents",
	"category-add",
	"torrent-del",
	"category-del",
	"torrent-rename",
	"torrent-add"
    );

    foreach ($api_points as $point) {
	if (isset($_GET[$point])) {
	    return $point;
	}
    }
}

class Category {

    function getAll() {
	global $output, $db;

	$query = "SELECT * FROM categories";
	$params = array();

	$stmt = $db->query($query, $params);

	$output->addStatus("categories", $stmt->errorInfo());
	$output->add("categories", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

    function get($id) {
	global $output, $db;

	$query = "SELECT * FROM categories WHERE id = :id";
	$params = array(
	    ":id" => $id
	);

	$stmt = $db->query($query, $params);

	$output->addStatus("categories", $stmt->errorInfo());
	$output->add("categories", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

    function add($torrent, $category) {
	global $db, $output;

	$query = "INSERT INTO categorymap (torrent, category) VALUES(:torrent, :cat)";

	$params = array(
	    ":torrent" => $torrent,
	    ":cat" => $category
	);

	$stmt = $db->execute($query, $params);

	$output->addStatus("add-category", $stmt->errorInfo());

	$stmt->closeCursor();
    }

    function delete($torrent, $category) {
	global $db, $output;
	$query = "DELETE FROM categorymap WHERE torrent = :torrent AND category = :cat";

	$params = array(
	    ":torrent" => $torrent,
	    ":cat" => $category
	);

	$stmt = $db->query($query, $params);

	$output->addStatus("del-category", $stmt->errorInfo());

	$stmt->closeCursor();
    }

}

class Torrent {

    function delete($torrent) {
	global $db, $output;

	$query = "DELETE FROM torrents WHERE id = :torrent";

	$param = array(
	    ":torrent" => $torrent
	);

	$stmt = $db->query($query, $param);

	$output->addStatus("del-torrent", $stm->errorInfo());

	$stmt->closeCursor();
    }

    function rename($id, $name) {

	global $db, $output;

	$query = "UPDATE torrents SET name = :name WHERE id= :id";

	$param = array(
	    ":id" => $id,
	    ":name" => $name
	);

	$stmt = $db->query($query, $param);

	$output->addStatus("rename-torrent", $stmt->errorInfo());

	$stmt->closeCursor();
    }

    function getAll() {
	global $output, $db;

	$query = "SELECT * FROM torrents";
	$params = array();

	$stmt = $db->query($query, $params);

	$output->addStatus("torrents", $stmt->errorInfo());
	$output->add("torrents", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

    function get($id) {
	global $output, $db;

	$query = "SELECT * FROM torrents WHERE id = :id";
	$params = array(
	    ":id" => $id
	);

	$stmt = $db->query($query, $params);

	$output->addStatus("torrents", $stmt->errorInfo());
	$output->add("torrents", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

    function getNew() {
	global $output, $db;

	$query = "SELECT * FROM newtorrents";
	$params = array();

	$stmt = $db->query($query, $params);

	$output->addStatus("torrents", $stmt->errorInfo());
	$output->add("torrents", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

    function getPeers($id) {
	global $output, $db;

	$query = "SELECT * FROM peers WHERE id = :id";
	$params = array(
	    ":id" => $id
	);

	$stmt = $db->query($query, $params);

	$output->addStatus("peers", $stmt->errorInfo());
	$output->add("peers", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

    function getAllPeers() {
	global $output, $db;

	$query = "SELECT * FROM peers";
	$params = array();

	$stmt = $db->query($query, $params);

	$output->addStatus("peers", $stmt->errorInfo());
	$output->add("peers", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

    function getByCategory($category) {
	global $output, $db;

	if ($category === "new") {
	    $query = "SELECT * FROM newtorrents";
	    $params = array();
	} else {


	    $query = "SELECT * FROM torrentcategories WHERE category = :category";
	    $params = array(
		":category" => $category
	    );
	}

	$stmt = $db->query($query, $params);

	$output->addStatus("torrents", $stmt->errorInfo());
	$output->add("torrents", $stmt->fetchAll(PDO::FETCH_ASSOC));

	$stmt->closeCursor();
    }

}

class DB {

    private $db;
    private $order = "";

    function connect() {
	global $dbpath;
	
	try {
	    $this->db = new PDO('sqlite:' . $dbpath);
	    $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);
	} catch (PDOException $e) {

	    header("Status: 500 " . $e->getMessage());
	    echo $e->getMessage();
	    die();
	}

	return true;
    }

    function setOrder($tag, $order) {
	$this->order = " ORDER BY " . $tag . " " . $order;
    }

    function query($sql, $params) {
	global $output, $orderBy;

	if (strpos($sql, "SELECT") !== false) {

	    $sql .= $this->order;

	    if (isset($_GET["limit"]) && !empty($_GET["limit"])) {
		$sql .= " LIMIT :limit";
		$params[":limit"] = $_GET["limit"];
	    }
	}

	$stm = $this->db->prepare($sql);

	if ($this->db->errorCode() > 0) {
	    $output->addStatus("db", $this->db->errorInfo());
	    return null;
	}

	$stm->execute($params);


	return $stm;
    }

    function beginTransaction() {
	global $output;
	if (!$this->db->beginTransaction()) {
	    $output->addStatus("transaction", $this->db->errorInfo());
	}
    }

    function commit() {
	global $output;
	if (!$this->db->commit()) {
	    $output->addStatus("commit", $this->db->errorInfo());
	}
    }

    function rollback() {
	$this->db->rollback();
    }

    function lastInsertID() {
	return $this->db->lastInsertId();
    }

}

/**
 * output functions
 */
class Output {

    private static $instance;
    public $retVal;

    /**
     * constructor
     */
    private function __construct() {
	$this->retVal['status']["db"] = "ok";
    }

    /**
     * Returns the output instance or creates it.
     * @return Output output instance
     */
    public static function getInstance() {
	if (!self::$instance) {
	    self::$instance = new self();
	}

	return self::$instance;
    }

    /**
     * Adds data for use to output.
     * @param type $table
     * @param type $output
     */
    public function add($table, $output) {
	$this->retVal[$table] = $output;
    }

    /**
     * Adds an status for output
     * @param type $table status table
     * @param type $output message (use an array with 3 entries ("id", <code>, <message>))
     */
    public function addStatus($table, $output) {

	if (is_array($output) && $output[1]) {
	    if (is_array($retVal["status"]["debug"])) {
		$this->retVal["status"]["debug"][] = $output;
	    } else {
		$retVal["status"]["debug"] = array($output);
	    }
	    $this->retVal["status"]["db"] = "failed";
	}

	$this->retVal['status'][$table] = $output;
    }

    /**
     * Generates the output for the browser. General you call this only once.
     */
    public function write() {

	header("Content-Type: application/json");
	header("Access-Control-Allow-Origin: *");
	# Rückmeldung senden
	if (isset($_GET["callback"]) && !empty($_GET["callback"])) {
	    $callback = $_GET["callback"];
	    echo $callback . "('" . json_encode($this->retVal, JSON_NUMERIC_CHECK) . "')";
	} else {
	    echo json_encode($this->retVal, JSON_NUMERIC_CHECK);
	}
    }

}

?>
