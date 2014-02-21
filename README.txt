This project provides a minimal web panel for the traccoon BitTorrent tracker.
Most of the code was written in just two days.

traccoon (http://dev.cbcdn.com/traccoon) uses an SQLite database as its backend.
This panel extends upon the provided database layout and adds features such as
category tags and a torrent file listing, as well as a fancy upload mechanism.

The latest releases of this project can be found on http://github.com/kitinfo/tracker-panel

Prerequisites
	An httpd (eg. lighttpd)
	Support for PHP5 (eg. php5-fcgi)
	The SQLite PDO driver for PHP5 (eg. php5-sqlite)
	traccoon or a database-compatible tracker
	Read/write permissions on the database file AND the folder containing it
	 for both traccoon AND the user running the httpd

Setup
	Clone the repository into a folder that is served by the httpd
	Adjust the path to the database file (db.php:17) if necessary
	Optionally, disable the upload mechanism
	 Client side: Change the flag tracker.settings.uploadEnabled
	  in static/panel.js to false
	 Server side: Functionality not yet implemented.
	Start the tracker instances (and specify the extended database as backing store)

Performance
	The panel has been tested with just under 500 Torrent files sorted into
	about 10 categories. Issues have mostly been feature-requests.
