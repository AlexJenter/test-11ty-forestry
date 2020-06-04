const Path = require('path');
const FS = require('fs');
const recentlyUnlinked = {};

function handleAddEvent(path) {
	const parentDirectory = Path.dirname(path);
	const recent = recentlyUnlinked[parentDirectory];
	if (recent && new Date() - recent.time < 1000) {
		handleRename(path, recent.path);
	}
}
function handleUnlinkEvent(path) {
	recentlyUnlinked[Path.dirname(path)] = {
		time: new Date(),
		path: path
	};
}
function handleRename(newPath, oldPath) {
	const oldName = Path.basename(oldPath);
	const newName = Path.basename(newPath);
	const search = new RegExp('^(_?)' + oldName);
	const files = FS.readdirSync(newPath);
	files.forEach(function(file) {
		if (search.test(file)) {
			const newFile = file.replace(search, '$1' + newName);
			console.log('Renaming at ' + newPath + ' from ' + file + ' to ' + newFile);
			FS.renameSync(Path.join(newPath, file), Path.join(newPath, newFile));
		}
	});
}

module.exports.add = handleAddEvent;
module.exports.unlink = handleUnlinkEvent;
