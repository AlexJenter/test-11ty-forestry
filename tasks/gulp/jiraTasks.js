module.exports = function (done) {
	const https = require('https')
	const fs = require('fs')

	const user = 'buildBot'
	const pass = 'regeBoge2'

	const jiraTickets = []
	getTickets()

	function getTickets(startIndex) {
		if (!startIndex) {
			startIndex = 0
		}
		const options = {
			host: 'myswitzerland.atlassian.net',
			port: 443,
			path:
				'/rest/api/latest/search?jql=issuetype%20%3D%20Story%20AND%20component%20%3D%20%22Frontend%20Entwicklung%22&fields=status,labels,summary,issuelinks&maxResults=1000&startAt=' +
				startIndex,
			headers: {
				// authentication headers
				Authorization:
					'Basic ' +
					Buffer.from(user + ':' + pass).toString('base64'),
			},
		}
		console.log('👾  Getting issues from JIRA ... (' + startIndex + ')')

		const request = https.get(options, function (res) {
			let body = ''
			res.on('data', function (data) {
				body += data
			})
			res.on('end', function () {
				try {
					var data = JSON.parse(body)
				} catch (erro) {
					console.log('🚨  Error reading atlassian issues', body)
					processTickets() // to produce an empty jira.json file
					done()
					return
				}
				data.issues.forEach(function (issue) {
					jiraTickets.push(issue)
				})
				if (data.total > data.startAt + data.maxResults) {
					getTickets(data.startAt + data.maxResults)
				} else {
					processTickets()
				}
			})
			res.on('error', function (e) {
				console.log('Got error fetching JIRA tickets: ', e.message)
				processTickets() // to produce an empty jira.json file
			})
		})
	}

	function processTickets() {
		const result = {},
			frontendKeys = jiraTickets.map(function (issue) {
				return issue.key
			})

		jiraTickets.forEach(function (issue) {
			const summary = issue.fields.summary
			const status = issue.fields.status.name
			const key = issue.key
			const id = summary.match(/^\w+\-[\d\.]+/m)
			let backendlink
			try {
				const issuelinks = issue.fields.issuelinks.filter(function (
					issuelink
				) {
					return (
						issuelink.type.outward === 'causes' &&
						issuelink.outwardIssue &&
						issuelink.outwardIssue.fields.issuetype.name === 'Story'
					)
				})
				if (issuelinks.length > 0) {
					backendlink = issuelinks[0].outwardIssue
					backendlink = {
						id: backendlink.key,
						css: backendlink.fields.status.name
							.toLowerCase()
							.replace(/\W/g, '_'),
						status: backendlink.fields.status.name,
						summary: backendlink.fields.summary,
					}
					if (frontendKeys.indexOf(backendlink.id) >= 0) {
						// if linked issue is a frontend issue, ignore it (we'd otherwise have to check for components)
						backendlink = undefined
					}
				}
			} catch (e) {
				console.log(
					'Problem filtering for backend issue link: ' + key,
					e
				)
			}
			result[id ? id[0] : key] = {
				summary: summary,
				status: status,
				labels: issue.fields.labels,
				css: status.toLowerCase().replace(/\W/g, '_'),
				backendlink: backendlink,
				id: key,
				// 'detail': issue
			}
		})

		console.log('👾  Got ' + jiraTickets.length + ' issues from JIRA.')

		body = JSON.stringify(result, null, 2) // pretty format
		fs.writeFileSync('source/_data/jira.json', body)
		done()
	}
}
