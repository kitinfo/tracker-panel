#!/bin/bash
TRACKER=$(./torrentinfo -v -k announce "$*")
HASH=$(./torrentinfo -H -k info "$*")
HASH=${HASH:0:40}
SIZE=$(./torrentinfo -v -k info.length "$*")
COMMENT=$(./torrentinfo -v -k comment "$*")
FILE="$HASH.torrent"

ACTUALTRACKER="http://10.42.23.1:6969/announce"

if [[ "$TRACKER" != "$ACTUALTRACKER" ]]
then
	exit
fi

echo "INSERT INTO torrents (hash, name, file, size) VALUES ('$HASH','$COMMENT','torrents/$FILE','$SIZE')"
