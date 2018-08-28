import os from 'os';
import fs from 'fs';
import process from 'process';

export interface Config {
    jiraHost: string;
    jiraBasicAuthToken: string;
    jiraURL: string
}

const defaultConfig : Config = {
    jiraHost: 'localhost',
    jiraBasicAuthToken: 'empty',
    jiraURL: `http://${this.jiraHost}`
}

let configStore : Config | null = null;

export const config = () : Config => {

    if (configStore != null) {
        return configStore;
    }

    const encoding = 'UTF-8';
    const fileName = `config.json`;
    const localFile = `${os.homedir}/.szpion/${fileName}`;
    const mainFile = `${process.cwd()}/${fileName}`;

    const parse = (json: string) : Config => {
        return JSON.parse(json);
    }

    if (fs.existsSync(localFile)) {
        console.log(`Using local config : ${localFile}`);
        configStore = parse(fs.readFileSync(localFile, encoding));
    } else if (fs.existsSync(mainFile)) {
        console.log(`Using main config : ${mainFile}`);
        configStore = parse(fs.readFileSync(mainFile, encoding));
    } else {
        console.log(`No config file found. Using default.`);
        configStore = defaultConfig;
    }

    return configStore;
}


