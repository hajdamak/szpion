import fs from "fs";
import proxy from 'koa-better-http-proxy';
import Koa from 'koa';
import Router from 'koa-router';

import {loadConfig} from './config';
import {Jira} from './jira';


console.log("Szpion server starts... ");

// In mock mode do not access JIRA and instead return mocked data.
const mock = false;

const config = loadConfig();
const issueSource = new Jira(config.jiraURL, config.jiraBasicAuthToken, true);

console.log("Using JIRA : " + config.jiraURL)

const app = new Koa();
const router = new Router();


router.get('/config', (ctx, next) => {
    console.log("Accessing config API.");
    ctx.type = "json";
    ctx.body = config.clientConfig;
});

router.get('/boards', async (ctx, next) => {
    if (mock) {
        ctx.type = "json";
        ctx.body=fs.readFileSync("test/data/boards.json", "UTF-8");
        return;
    }
    console.log("Accessing boards API");
    const boards = await issueSource.fetchBoards();
    ctx.type = "json";
    ctx.body = boards;
});

router.get('/boards/:boardId/sprints', async (ctx, next) => {
    console.log(`Aceessing sprints API for board ${ctx.params.boardId}`);
    if (mock) {
        ctx.type = "json";
        ctx.body=fs.readFileSync("test/data/sprints.json", "UTF-8");
        return;
    }
    const sprints = await issueSource.fetchSprintsFromBoard(ctx.params.boardId);
    ctx.type = "json";
    ctx.body = sprints;
});

router.get('/boards/:boardId/sprints/:sprintId', async (ctx, next) => {
    console.log("Accessing sprint API.");
    if (mock) {
        ctx.type = "json";
        ctx.body=fs.readFileSync("test/data/sprintdetails.json", "UTF-8");
        return;
    }
    const sprint = await issueSource.fetchSprint(
        parseInt(ctx.params.boardId),
        parseInt(ctx.params.sprintId)
    );
    ctx.type = "json";
    ctx.body = sprint;
});

app.use(router.routes());

// Parcel proxy
app.use(
    proxy(
        'http://localhost:1234', {}
    )
);

app.listen(1212);
