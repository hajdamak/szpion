import {Server} from './server';

// Default is production
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = "production"
}

const isDev: boolean = process.env.NODE_ENV === "development";
const mockJIRA: boolean = process.argv.find((arg: string) => arg ==="--mockJIRA") ? true : false;

const server = new Server(
	isDev, mockJIRA
);
server.start();
