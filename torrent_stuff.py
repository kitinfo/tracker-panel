#!/usr/bin/python3

import os
import re
import subprocess


#os.system("rm -rf /")
LOG = 1
REJECTED = "../torrents-rejected/"
ACTIVE = "../torrents-active/"
INCOMING = "torrents-incoming/"
ACTUAL_TRACKER = "http://10.42.23.1:6969/announce"
TORRENTINFO = "../torrentinfo"
DATABASE = "/var/www/tracker-panel/backing.db3"

torrents = []
def log(msg):
	if LOG > 0:
		print("INFO: " + msg)


def get_hash(torrent):
	torrent_hash = str(subprocess.check_output([TORRENTINFO, "-H", "-k", "info", torrent]), encoding="utf-8").strip()[0:40]
	log("Hash: " + torrent_hash)
	return torrent_hash
	
def get_size(torrent):
	torrent_size = str(subprocess.check_output([TORRENTINFO, "-v", "-k", "info.length", torrent]), encoding="utf-8").strip()
	if re.match(".*has no key \"length\".*", torrent_size):
		log("Size was not included in dict.")
		torrent_size = "0"
	log("Size: " + torrent_size)
	return torrent_size
	
def get_comment(torrent):
	torrent_comment = str(subprocess.check_output([TORRENTINFO, "-v", "-k", "comment", torrent]), encoding="utf-8").strip()
	if torrent_comment == "" or re.match(".*has no key \"comment\".*", torrent_comment):
		log("Comment was empty")
		torrent_comment = re.sub("\.torrent", "", torrent)
	log("Comment: " + torrent_comment)
	return torrent_comment

def add_torrent(torrent_hash, torrent_comment, torrent_file, torrent_size):
	#sqlite3 -line $SQL_DB "insert into torrents ("hash") values (\"$hash\");"
	os.system("sqlite3 -line " + DATABASE + " \"INSERT INTO torrents (hash, name, file, size) VALUES ('%s','%s','torrents/%s','%s')\"" % (torrent_hash, torrent_comment, torrent_file, torrent_size))

def is_correct(torrent):
	tracker = str(subprocess.check_output([TORRENTINFO, "-v", "-k", "announce", torrent]), encoding="utf-8").strip()
	log(torrent + ": " + tracker)
	if (tracker == ACTUAL_TRACKER):
		return True
	else:
		return False

os.chdir(INCOMING)
files = os.listdir()
os.system("chmod -x *.torrent") # lel faggots marking files as executable

for torrent in files:
	if re.match(".*\.torrent", torrent):
		torrents.append(torrent)
for torrent in torrents:
	if is_correct(torrent):
		log(torrent + " is correct")
		torrent_hash = get_hash(torrent)
		torrent_size = get_size(torrent)
		torrent_comment = get_comment(torrent)
		torrent_file = torrent_hash + ".torrent"
		os.rename(torrent, ACTIVE + torrent_file)
		add_torrent(torrent_hash, torrent_comment, torrent_file, torrent_size)
	else:
		log(torrent + " is incorrect")
		os.rename(torrent, REJECTED + torrent)
