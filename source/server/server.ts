import proxy from 'koa-better-http-proxy';
import Koa from 'koa';
import Router from 'koa-router';
import http from 'http';

import {loadConfig} from './config';
import {Jira} from './jira';

export class Server {

    private readonly port: number = 1212;
    private readonly koa: Koa;
    private readonly httpServer: http.Server;
    private readonly router: Router;

    constructor(
        private readonly devMode: boolean = false,
        // In mock mode do not access JIRA and instead return mocked data.
        private readonly mock: boolean = false
    ) {
        this.koa = new Koa();
        this.router = new Router();
        this.httpServer = this.koa.listen(this.port);
    }

    public readonly start = () => {

        console.log(`Szpion server starts on port ${this.port} ... `);

        const config = loadConfig();
        const jira = new Jira(config.jiraURL, config.jiraBasicAuthToken, this.mock);

        console.log("Using JIRA : " + config.jiraURL)

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


        if (this.devMode) {
            // Parcel proxy
            this.koa.use(
                proxy(
                    'http://localhost:1234', {}
                )
            );
        }
    };

    public readonly stop = () => {
        console.log("Stopping Szpion server...");
        this.httpServer.close();
    };

}

