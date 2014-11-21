<?php

$db=new PDO("sqlite:backing.db3");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_SILENT);
$db->query("PRAGMA foreign_keys = ON");

$http_raw=file_get_contents("php://input");
$http_dec=json_decode($http_raw, true);
$retVal=array("status"=>"ok");

$endpoints=array(
	"catfor",
	"torrents",
	"categories",
	"category-add",
	"category-del",
	"torrent-del",
	"torrent-rename",
	"torrent-add"
);

foreach($endpoints as $endpoint){
	if(isset($_GET[$endpoint])){
		handleEndpoint($endpoint);
		break;
	}
}

function handleEndpoint($endpoint){
	global $retVal;
	global $http_dec;
	global $db;

	switch($endpoint){
		case "torrent-add":
			if (!isset($http_dec["hash"]) && empty($http_dec["hash"])) {
				break;
			}
			if (!isset($http_dec["name"]) && empty($http_dec["name"])) {
				break;
			}
			if (!isset($http_dec["size"]) && empty($http_dec["size"])) {
				break;
			}

			$stmt=$db->prepare("INSERT INTO torrents(hash, name, size) VALUES(:hash, :name, :size)");

			$done = $stmt->execute(array(
				":hash" => $http_dec["hash"],
				":name" => $http_dec["name"],
				":size" => $http_dec["size"]
			));

			if ($done) {

				$retVal["torrent-add"] = $db->lastInsertId();
			} else {
				$retVal["torrent-add"] = -1;
			}
			
			break;
		case "torrents":
			if(isset($http_dec["category"])&&!empty($http_dec["category"])){
				if($http_dec["category"]=="new"){
					//fetch new torrents
					$stmt=$db->query("SELECT * FROM newtorrents");
					$retVal["torrents"]=$stmt->fetchAll(PDO::FETCH_ASSOC);
				}
				else{
					//fetch category
					$stmt=$db->prepare("SELECT * FROM torrentcategories WHERE category=:cat");
					$stmt->execute(array(":cat"=>$http_dec["category"]));
					$retVal["torrents"]=$stmt->fetchAll(PDO::FETCH_ASSOC);
				}
			}
			else{
				//fetch all
				$stmt=$db->query("SELECT * FROM torrents JOIN peerstats ON peerstats.torrent=torrents.id");
				$retVal["torrents"]=$stmt->fetchAll(PDO::FETCH_ASSOC);
			}
			break;
		case "categories":
			if(isset($http_dec["torrent"])&&!empty($http_dec["torrent"])){
				$stmt=$db->prepare("SELECT * FROM torrentcategories WHERE id=:torrent");
				$stmt->execute(array(":torrent"=>$http_dec["torrent"]));
				$retVal["categories"]=$stmt->fetchAll(PDO::FETCH_ASSOC);
			}
			else{
				$stmt=$db->query("SELECT * FROM categories");
				$retVal["categories"]=$stmt->fetchAll(PDO::FETCH_ASSOC);
			}
			break;

		case "category-add":
			if(!isset($http_dec["torrent"])||empty($http_dec["torrent"])){
				break;
			}
			if(!isset($http_dec["category"])||empty($http_dec["category"])){
				break;
			}
			$stmt=$db->prepare("INSERT INTO categorymap (torrent, category) VALUES (:torrent, :cat)");
			$stmt->execute(array(":torrent"=>$http_dec["torrent"], ":cat"=>$http_dec["category"]));
			break;
		case "category-del":
			if(!isset($http_dec["torrent"])||empty($http_dec["torrent"])){
				break;
			}
			if(!isset($http_dec["category"])||empty($http_dec["category"])){
				break;
			}
			$stmt=$db->prepare("DELETE FROM categorymap WHERE torrent=:torrent AND category=:cat");
			$stmt->execute(array(":torrent"=>$http_dec["torrent"], ":cat"=>$http_dec["category"]));
			break;
		case "torrent-del":
			if(!isset($http_dec["torrent"])||empty($http_dec["torrent"])){
				break;
			}
			$stmt=$db->prepare("DELETE FROM torrents WHERE id=:torrent");
			$stmt->execute(array(":torrent"=>$http_dec["torrent"]));
			break;
		case "torrent-rename":
			if(!isset($http_dec["torrent"])||empty($http_dec["torrent"])){
				break;
			}
			if(!isset($http_dec["name"])||empty($http_dec["name"])){
				break;
			}
			$stmt=$db->prepare("UPDATE torrents SET name=:name WHERE id=:torrent");
			$stmt->execute(array(":torrent"=>$http_dec["torrent"], ":name"=>$http_dec["name"]));
			break;
		default:
			$retVal["status"][2]="Unknown endpoint";
			break;
	}
}

$retVal["status"]=$db->errorInfo();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
print(json_encode($retVal));

?>
