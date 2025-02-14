export function manageAttachment(attachment) {
	console.log('Content');
	Object.entries(attachment).forEach(([key, value]) => {
		console.log('   Service: ', key, '\n      Content\n', value, '\n');
	});
}
