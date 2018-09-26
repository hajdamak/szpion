import os from 'os';
import fs from 'fs';
import process from 'process';

import {ClientConfig} from "../common/model";

export interface Config {
	jiraURL: string;
	jiraBasicAuthToken: string;
	clientConfig: ClientConfig|undefined;
}

export const loadConfig = (): Config => {

	const encoding = 'UTF-8';
	const fileName = `szpion.json`;
	const localFile = `${os.homedir()}/.config/szpion/${fileName}`;
	const mainFile = `${process.cwd()}/${fileName}`;

	if (fs.existsSync(localFile)) {
		console.log(`Using local config : ${localFile}`);
		try {
			return JSON.parse(fs.readFileSync(localFile, encoding));
		} catch (e) {
			console.log(`Error loading local config : ${e.message}`)
		}
	}

	if (fs.existsSync(mainFile)) {
		console.log(`Using main config : ${mainFile}`);
		try {
			return JSON.parse(fs.readFileSync(mainFile, encoding));
		} catch (e) {
			console.log(`Error loading main config : ${e.message}`)
		}
	}

	console.log(`Using default config.`);
	return defaultConfig;
}

const defaultConfig: Config = {
	jiraURL: `http://localhost`,
	jiraBasicAuthToken: 'empty',
	clientConfig: {}
}
