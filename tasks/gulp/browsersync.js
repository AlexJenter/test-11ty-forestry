let browserSync;

const task = function(done) {
	if (!browserSync) {
		browserSync = require('browser-sync').create();
	}
	browserSync.init(
		{
			port: require('./util/serverport') + 1000,
			online: false,
			ghostMode: false,
			open: false,
			notify: false,
			logLevel: 'silent',
			socket: {
				clients: {
					heartbeatTimeout: 60000
				}
			}
		},
		done
	);
};

task.get = function() {
	return browserSync;
};

module.exports = task;
