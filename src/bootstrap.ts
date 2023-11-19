import { Env } from '.';
import olddata from '../olddata.json';
import bcrypt from 'bcryptjs';

export const bootstrapHandle = async (request: Request, env: Env): Promise<Response> => {
	// remove if necessary
	return new Response('OK');

	env.DB.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
		.bind('simon', await bcrypt.hash('admin', 10))
		.run();

	env.DB.prepare('INSERT INTO sessions (user_id, token) VALUES ((SELECT id FROM users WHERE username = ?), ?)')
		.bind('simon', 'admin')
		.run();

	const entries = olddata.documentChange.document.fields.entries.mapValue.fields;
	const keys = Object.keys(entries).sort();
	for (let i = 0; i < keys.length; i++) {
		const date = keys[i];
		const content = (entries as any)[date].mapValue.fields.text.stringValue;
		const lastEdited = (entries as any)[date].mapValue.fields.lastEdited.timestampValue;
		const wordCount = content.split(' ').length;

		env.DB.prepare(
			'INSERT INTO entries (date, content, last_modified, word_count, user_id) VALUES (?, ?, ?, ?, (SELECT id FROM users WHERE username = ?))'
		)
			.bind(date, content, lastEdited, wordCount, 'simon')
			.run();
	}

	return new Response('OK');
};
