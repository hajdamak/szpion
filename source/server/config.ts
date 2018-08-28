import os from 'os';
import fs from 'fs';
import process from 'process';

export interface Config {
    jiraHost: string;
    jiraBasicAuthToken: string;
    jiraURL: string
}

export const loadConfig = (): Config => {

    const encoding = 'UTF-8';
    const fileName = `config.json`;
    const localFile = `${os.homedir}/.szpion/${fileName}`;
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
    jiraHost: 'localhost',
    jiraBasicAuthToken: 'empty',
    jiraURL: `http://${this.jiraHost}`
}
