import fetch from 'cross-fetch';
import {ActionsType} from "hyperapp";

import {Board, ClientConfig, SprintDetails, Sprint} from "../common/model";
import {State} from "./state";
import {getNumberFromLocalStorage} from "../common/utils";

// TODO: Move it to Actions class after migration to Hyperapp 2
let serverURL: string = "";

export class Actions implements ActionsType<State, Actions> {

    private readonly fetch = async <T>(resourcePath: string): Promise<T> => {
        const response = await fetch(`${serverURL}${resourcePath}`);
        const json: T = await response.json();
        return json;
    };

    // TODO: This is only used to set server URL in tests. Should be constructor param in Hyperapp 2.
    readonly setServerURL = (url: string) => {
        serverURL = url;
    };

    // TODO: Only used in tests. Should not be needed in Hyperapp 2.
    readonly getState = () => (state: State, actions: Actions) => {
        return state;
    };

    readonly init = () => async (state: State, actions: Actions) => {
        console.log("Initialize application...");
        await actions.fetchConfig();
        await actions.fetchBoards();
        await actions.fetchSprints();
        await actions.fetchSprintDetails();
    };

    readonly fetchConfig = () => async (state: State, actions: Actions) => {
        console.log("Fetching config...");
        const config = await this.fetch<ClientConfig>('/config');
        actions.updateConfig(config);
    };
    readonly updateConfig = (config: ClientConfig) => (state: State) => {
        console.log("Config updated.");
        return {config: config};
    };


    readonly fetchBoards = () => async (state: State, actions: Actions) => {
        console.log("Fetching boards...");
        const boards = await this.fetch<Array<Board>>('/boards');
        actions.updateBoards(boards);
        actions.updateSelectedBoard(undefined);
    };
    readonly updateBoards = (boards: Array<Board>) => (state: State) => {
        console.log("Boards updated.")
        return {boards: boards};
    };
    readonly updateSelectedBoard = (boardId: number | undefined) => (state: State) => {
        const id = boardId ? boardId : getNumberFromLocalStorage("selectedBoardId");
        const foundBoard = state.boards.find(board => board.id === id);
        const board = foundBoard ? foundBoard : state.boards[0];
        const targetId = board ? board.id : undefined;

        console.log(`Selected board updated to ${targetId}`);
        window.localStorage.setItem("selectedBoardId", String(targetId));
        return {selectedBoardId: targetId};
    };
    readonly changeBoard = (boardId: number) => async (state: State, actions: Actions) => {
        console.log(`Changing board to ${boardId} ...`);
        if (boardId == state.selectedBoardId) return;
        actions.updateSelectedBoard(boardId);
        await actions.fetchSprints();
        await actions.fetchSprintDetails();
    };


    readonly fetchSprints = () => async (state: State, actions: Actions) => {
        console.log("Fetching sprints...");
        const sprints = await this.fetch<Array<Sprint>>(
            `/boards/${state.selectedBoardId}/sprints`);
        actions.updateSprints(sprints);
        actions.updateSelectedSprint(undefined);
    };
    readonly updateSprints = (sprints: Array<Sprint>) => (state: State) => {
        console.log("Sprints updated.");
        return {sprints: sprints};
    };
    readonly updateSelectedSprint = (sprintId: number | undefined) => (state: State) => {
        const id = sprintId ? sprintId : getNumberFromLocalStorage("selectedSprintId");
        const foundSprint = state.sprints.find(sprint => sprint.id === id);
        const sprint = foundSprint ? foundSprint : state.sprints[0];
        const targetId = sprint ? sprint.id : undefined;

        console.log(`Selected sprint updated to ${targetId}`);
        window.localStorage.setItem("selectedSprintId", String(targetId));
        return {selectedSprintId: targetId};
    };
    readonly changeSprint = (sprintId: number) => async (state: State, actions: Actions) => {
        console.log(`Changing sprint to ${sprintId} ...`);
        if (sprintId == state.selectedSprintId) return;
        actions.updateSelectedSprint(sprintId);
        await actions.fetchSprintDetails();
    };


    readonly fetchSprintDetails = () => async (state: State, actions: Actions) => {
        if (state.selectedBoardId && state.selectedSprintId) {
            console.log("Fetching sprint details...");
            const sprintDetails = await this.fetch<SprintDetails>(
                `/boards/${state.selectedBoardId}/sprints/${state.selectedSprintId}`);
            actions.updateSprintDetails(sprintDetails);
        }
    };
    readonly updateSprintDetails = (sprintDetails: SprintDetails) => (state: State) => {
        console.log("Sprint updated.")
        return {sprintDetails: sprintDetails};
    };

}
