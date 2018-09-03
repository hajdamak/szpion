import proxy from 'koa-better-http-proxy';
import Koa from 'koa';
import Router from 'koa-router';

import { loadConfig } from './config';
import { IssueSource } from "./issue-source";
import { JiraIssueSource } from './jira-issue-source';

console.log("Szpion server starts... ");

const config  = loadConfig();
const issueSource : IssueSource = new JiraIssueSource(config.jiraURL, config.jiraBasicAuthToken);

console.log("Using JIRA : " + config.jiraURL)

const app =  new Koa();
const router = new Router();


router.get('/config', (ctx, next) => {
    console.log("Accessing config API.");
    ctx.type = "json";
    ctx.body = config.clientConfig;
});

router.get('/sprint', async (ctx, next) => {
    console.log("Getting sprint.");
    const sprint = await issueSource.fetchLatestSprint();
    ctx.type = "json";
    ctx.body = sprint;
});

router.get('/boards', async (ctx, next) => {
    console.log("Getting boards");
    const boards = await issueSource.fetchBoards();
    ctx.type = "json";
    ctx.body = boards;
});

router.get('/boards/:boardId/sprints', async (ctx, next) => {
    console.log(`Getting sprint for board ${ctx.params.boardId}`);
    const sprints = await issueSource.fetchSprintsFromBoard(ctx.params.boardId);
    ctx.type = "json";
    ctx.body = sprints;
});


app.use(router.routes());

// Parcel proxy
app.use(
    proxy(
        'http://localhost:1234', {}
    )
);

app.listen(1212);
