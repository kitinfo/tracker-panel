#!/usr/bin/python3

import os, glob
import re
import subprocess
import sqlite3

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

def add_torrent(db, torrent_hash, torrent_comment, torrent_file, torrent_size):
	#sqlite3 -line $SQL_DB "insert into torrents ("hash") values (\"$hash\");"
#	ret = subprocess.check_output("sqlite3 -line " + DATABASE + " \"INSERT INTO torrents (hash, name, file, size) VALUES ('%s','%s','torrents/%s','%s')\"" % (torrent_hash, torrent_comment, torrent_file, torrent_size))
#	if re.match(".*locked.*", ret):
#		return "locked"
#	if re.match(".*duplicate.*", ret):	# untested, replace match string by actual regex
#		return "rejected"
#	return ""
	db.execute('INSERT INTO torrents (hash, name, file, size) VALUES (?,?,?,?)', (torrent_hash, torrent_comment, "torrents/"+torrent_file, torrent_size))
	return db.lastrowid

def add_categorymap(db, torrent_id, category_id):
	return db.execute('INSERT INTO categorymap (torrent, category) VALUES (?, ?)',
			(torrent_id, category_id))

def is_correct(torrent):
	tracker = str(subprocess.check_output([TORRENTINFO, "-v", "-k", "announce", torrent]), encoding="utf-8").strip()
	log(torrent + ": " + tracker)
	if (tracker == ACTUAL_TRACKER):
		return True
	else:
		return False

dbconn=sqlite3.connect(DATABASE)
os.chdir(INCOMING)

cursor = dbconn.cursor()

# ok, get all possible category ids
category_ids = {}
cursor.execute('SELECT id, name FROM categories')
for id, name in cursor.fetchall():
	category_ids[name.lower()] = id

# now sort torrents according to the incoming subfolder
files = {'untagged': []}
files['untagged'] = glob.glob('*.torrent')
tagged_files = glob.glob('*/*.torrent')
for f in tagged_files:
	category, filename = f.split('/')
	category = category.lower()
	if category in category_ids:
		files.setdefault(category_ids[category], [])
		files[category_ids[category]].append(filename)

os.system("chmod -x *.torrent") # lel faggots marking files as executable

for category_id in files:
	for torrent in files[category_id]:
		if is_correct(torrent):
			log(torrent + " is correct")
			torrent_hash = get_hash(torrent)
			torrent_size = get_size(torrent)
			torrent_comment = get_comment(torrent)
			torrent_file = torrent_hash + ".torrent"
			
			try:
				ret = add_torrent(cursor, torrent_hash, torrent_comment, torrent_file, torrent_size)
				if isinstance(category_id, int):
					add_categorymap(cursor, ret, category_id)
				os.rename(torrent, ACTIVE + torrent_file)
			except sqlite3.IntegrityError:
				log(torrent + " Torrent rejected.")
				os.rename(torrent, REJECTED + torrent_file)
		else:
			log(torrent + " is incorrect")
			os.rename(torrent, REJECTED + torrent)

dbconn.commit()
dbconn.close()
