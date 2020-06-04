'use strict';

const fs = require('fs'); // graceful-fs for better platform compatibility?
const map = require('map-stream');

module.exports = function(options) {
	return map(function(file, cb) {
		if (file.isNull()) {
			return cb(null, file);
		}

		// Update file modification and access time
		return fs.utimesSync(file.path, new Date(), new Date(), cb(null, file));
	});
};
