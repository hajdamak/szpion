import proxy from 'koa-better-http-proxy';
import Koa from 'koa';
import Router from 'koa-router';

import { loadConfig } from './config';
import { getData } from './data';

console.log("Szpion server starts... ");

const config  = loadConfig();

console.log("Using JIRA : " + config.jiraURL)

const app =  new Koa();
const router = new Router();

router.get('/test', (ctx, next) => {
    console.log("Test request");
    ctx.body = 'Test';
});

router.get('/config', (ctx, next) => {
    console.log("Accessing config API.");
    ctx.body = JSON.stringify(config.clientConfig);
});

router.get('/data', async (ctx, next) => {
    console.log("Accessing data API.");
    const data = await getData(config);
    ctx.body = JSON.stringify(data);
});

app.use(router.routes());

// Parcel proxy
app.use(
    proxy(
        'http://localhost:1234', {}
    )
);

app.listen(1212);
