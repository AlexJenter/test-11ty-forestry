module.exports = (cmd, args, done, description) => {
	const chalk = require('chalk');
	const spawn = require('child_process').spawn;
	const cmdProcess = spawn(cmd, args.split(' '));

	description = description || cmd + ' ' + args;

	cmdProcess.stdout.on('data', data => {
		console.log(chalk.magenta(`${data}`.trim()));
	});

	cmdProcess.stderr.on('data', data => {
		console.log(chalk.red(`${data}`.trim()));
	});

	cmdProcess.on('close', code => {
		if (code == '0') {
			console.log(`✅ `, chalk.green(`${description} successfully completed`));
		} else {
			console.log(`😤 `, chalk.red(`${description} exited with code ${code}`));
		}
		if (done) done();
	});

	return cmdProcess;
};
