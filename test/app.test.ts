import {app} from "hyperapp";

import {State} from "../source/client/state";
import {Actions} from "../source/client/actions";
import {view} from "../source/client/view";

import {Server} from "../source/server/server";

const server = new Server(false, true);
const actions = new Actions();
actions.setServerURL("http://localhost:1212");
const initState = new State();

const getState = (app: Actions) : State => {
   const state : any = app.getState();
   return state as State;
};

beforeAll(() => {
    server.start();
});

afterAll(() => {
    server.stop();
});

test('Initialize application', async () => {
    const testApp = app(initState, actions, view, null);
    await testApp.init();
    const state = getState(testApp);
    expect(state.boards.length).toBe(3);
});
