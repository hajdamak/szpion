import {ActionsType, app} from "hyperapp";

import {State, state} from "./state";
import { Actions } from "./actions";
import { view } from "./components";

const actions: ActionsType<State, Actions> = new Actions();

app(state, actions, view, document.body);
