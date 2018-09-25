import proxy from 'koa-better-http-proxy';
import Koa from 'koa';
import Router from 'koa-router';
import send from 'koa-send';
import http from 'http';
import path from 'path';

import {loadConfig} from './config';
import {Jira} from './jira';

export class Server {

	public readonly port: number = 8080;
	private readonly parcelDevServerPort: number = 8081;
	private readonly koa: Koa;
	private readonly httpServer: http.Server;
	private readonly router: Router;
	private readonly staticContentDir = path.join(__dirname, '../client');

	constructor(
		private readonly isDevMode: boolean = false,
		// If set do not access JIRA and instead return mocked data.
		private readonly mockJIRA: boolean = false
	) {
		this.koa = new Koa();
		this.router = new Router();
		this.httpServer = this.koa.listen(this.port);
	}

	public readonly start = () => {
		console.log(`Szpion server starts on port ${this.port} ... `);
		console.log(`Development mode : ${this.isDevMode}`);

		const config = loadConfig();
		const jira = new Jira(config.jiraURL, config.jiraBasicAuthToken, this.mockJIRA);
		if (this.mockJIRA) {
			console.log("Using test files as mock JIRA");
		} else {
			console.log(`Using JIRA : ${config.jiraURL}`);
		}

		this.router.get('/config', (ctx, next) => {
			console.log("Accessing config API.");
			ctx.type = "json";
			ctx.body = config.clientConfig;
		});

		this.router.get('/boards', async (ctx, next) => {
			console.log("Accessing boards API");
			const boards = await jira.fetchBoards();
			ctx.type = "json";
			ctx.body = boards;
		});

		this.router.get('/boards/:boardId/sprints', async (ctx, next) => {
			console.log(`Aceessing sprints API for board ${ctx.params.boardId}`);
			const sprints = await jira.fetchSprintsFromBoard(ctx.params.boardId);
			ctx.type = "json";
			ctx.body = sprints;
		});

		this.router.get('/boards/:boardId/sprints/:sprintId', async (ctx, next) => {
			console.log("Accessing sprint API.");
			const sprint = await jira.fetchSprint(
				parseInt(ctx.params.boardId),
				parseInt(ctx.params.sprintId)
			);
			ctx.type = "json";
			ctx.body = sprint;
		});

		this.koa.use(this.router.routes());

		if (this.isDevMode) {
			console.log(`Starting Parcel dev server on port ${this.parcelDevServerPort}`);
			// Parcel proxy
			this.koa.use(
				proxy(`http://localhost:${this.parcelDevServerPort}`, {})
			);
		} else {
			// Serve static content
			this.koa.use(async (ctx) => {
				if ('/' === ctx.path)
					await send(ctx, "/index.html", {root: this.staticContentDir});
				await send(ctx, ctx.path, {root: this.staticContentDir});
			})

		}

	};

	public readonly stop = () => {
		console.log("Stopping Szpion server...");
		this.httpServer.close();
	};

}

