import {Server} from './server';

// Default is production
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = "production"
}

const isDev: boolean = process.env.NODE_ENV === "development";
const mockJIRA: boolean = process.argv.find((arg: string) => arg ==="--mockJIRA") ? true : false;

// Get port
const idx = process.argv.indexOf("--port");
const port = idx > 0 ? parseInt(process.argv[idx+1]) : 8080;

const server = new Server(
	port, isDev, mockJIRA
);
server.start();
