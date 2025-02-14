export function manageContent(content) {
	console.log('Attachment\n');
	Object.entries(content).forEach(([key, value]) => {
		console.log('   Service: ', key, '\n      Content\n', value);
	});
}
