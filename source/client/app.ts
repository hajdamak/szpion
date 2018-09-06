import { app } from "hyperapp";

import { state } from "./state";
import { actions } from "./actions";
import { view } from "./components";

app(state, actions, view, document.body);
