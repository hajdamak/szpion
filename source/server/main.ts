import proxy from 'koa-better-http-proxy';
import Koa from 'koa';
import Router from 'koa-router';
 import { config } from '../config';

console.log("Szpion server starts... " + config.version)

const app =  new Koa();

const router = new Router();

router.get('/test', (ctx, next) => {
    console.log("Test request");
    ctx.body = 'Test';
});

app.use(router.routes());

const isJIRARequest = (path : string) : boolean => path.startsWith("/rest") || path.startsWith("/image");

// JIRA proxy
app.use(
    proxy(
        'jira.coconet.de',
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
