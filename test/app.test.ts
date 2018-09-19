import {app} from "hyperapp";
import {div} from "@hyperapp/html"

import {State} from "../source/client/state";
import {Actions} from "../source/client/actions";
//import {view} from "../source/client/components";

import {Server} from "../source/server/server";

const server = new Server(false, true);

beforeAll(() => {
    server.start();
    document.body.innerHTML = ""
});

afterAll(() => {
    server.stop();
});

test('test app', async () => {

    const view = (state: State, actions: Actions) =>
        div({
                oncreate: () => {
                    console.log("It works");
                    expect(state).toEqual({
                        value: 2,
                        foo: true
                    })
                }
            },
            ""
        );

    //serverURL = "http://localhost:1212";
    const actions = new Actions();
    const state = new State();
    const testApp = app(state, actions, view, document.body);

    //const res = await testApp.init();
    //console.log(`Out : ${JSON.stringify(res)}`);
});
