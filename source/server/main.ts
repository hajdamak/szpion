console.log("Szpion server starts... ");

import proxy from 'koa-better-http-proxy';
import Koa from 'koa';
import Router from 'koa-router';

import { loadConfig } from './config';
import { getData } from './data';

const config = loadConfig();

console.log("Using JIRA : " + config.jiraHost)

const app =  new Koa();

const router = new Router();

router.get('/test', (ctx, next) => {
    console.log("Test request");
    ctx.body = 'Test';
});

router.get('/config', (ctx, next) => {
    console.log("Accessing config API.");
    ctx.body = JSON.stringify(config);
});

router.get('/data', async (ctx, next) => {
    console.log("Accessing data API.");
    const data = await getData(config);
    ctx.body = JSON.stringify(data);
});


app.use(router.routes());

const isJIRARequest = (path : string) : boolean => path.startsWith("/rest") || path.startsWith("/image");

// JIRA proxy
app.use(
    proxy(
        config.jiraHost,
        {
            filter: ctx => isJIRARequest(ctx.path),
            https: true
        },

    )
);

// Parcel proxy
app.use(
    proxy(
        'http://localhost:1234',
        {
            filter: ctx => !isJIRARequest(ctx.path),
        },
    )
);

app.listen(1212);

