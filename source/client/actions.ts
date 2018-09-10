import {ActionsType} from "hyperapp";
import {defaultTo} from 'ramda';

import {Board, ClientConfig, SprintDetails, Sprint} from "../common/model";
import {State} from "./state";
import {getNumberFromLocalStorage, orElse} from "../common/utils";

export class Actions implements ActionsType<State, Actions> {

    init = () => async (state: State, actions: Actions) => {
        await actions.fetchConfig();
        await actions.fetchBoards();
        await actions.fetchSprints();
        await actions.fetchSprintDetails();
    };

    fetchConfig = () => async (state: State, actions: Actions) => {
        console.log("Fetching config...");
        const configJson = await fetch('/config');
        const config = await configJson.json();
        actions.updateConfig(config);
    };
    updateConfig = (config: ClientConfig) => (state: State) => {
        console.log("Config updated.");
        return { config: config };
    };

    fetchBoards = () => async (state: State, actions: Actions) => {
        console.log("Fetching boards...");
        const boardsJson = await fetch('/boards');
        const boards = await boardsJson.json();
        actions.updateBoards(boards);
        actions.updateSelectedBoard(undefined);
    };
    updateBoards = (boards: Array<Board>) => (state: State) => {
        console.log("Boards updated.")
        return {
            boards: boards
        };
    };
    updateSelectedBoard = (boardId: number|undefined) => (state: State) => {
        const saved = orElse(getNumberFromLocalStorage("selectBoardId"), state.boards[0].id);
        const newBoardId = defaultTo(saved)(boardId);
        console.log(`Selected board updated to ${newBoardId}`);
        window.localStorage.setItem("selectedBoardId", newBoardId.toString());
        return { selectedBoardId: newBoardId };
    };


    fetchSprints = () => async (state: State, actions: Actions) => {
        console.log("Fetching sprints...");
        const sprintsJson = await fetch(`/boards/${state.selectedBoardId}/sprints`);
        const sprints = await sprintsJson.json();
        actions.updateSprints(sprints);
        actions.updateSelectedSprint(1);
    };
    updateSprints = (sprints: Array<Sprint>) => (state: State) => {
        console.log("Sprints updated.");
        return {
            sprints: sprints
        };
    };
    updateSelectedSprint = (sprintId: number|number) => (state: State) => {
        const saved = orElse(getNumberFromLocalStorage("selectSprintId"), state.sprints[0].id);
        const newSprintId = orElse(sprintId, saved);
        console.log(`Selected sprint updated to ${newSprintId}`);
        window.localStorage.setItem("selectedSprintId", newSprintId.toString());
        return { selectedSprintId: newSprintId };
    };


    fetchSprintDetails = () => async (state: State, actions: Actions) => {
        console.log("Fetching sprint...");
        const sprintJson = await fetch(`/boards/${state.selectedBoardId}/sprints/${state.selectedSprintId}`);
        const sprint = await sprintJson.json();
        actions.updateSprintDetails(sprint);
    };
    updateSprintDetails = (sprintDetails: SprintDetails) => (state: State) => {
        console.log("Sprint updated.")
        return { sprintDetails: sprintDetails };
    };

    changeBoard = (boardId: number) => async (state: State, actions: Actions) => {
        console.log(`Changing board to ${boardId} ...`);
        if (boardId == state.selectedBoardId) return;
        actions.updateSelectedBoard(boardId);
        await actions.fetchSprints();
        await actions.fetchSprintDetails();
    };

    changeSprint = (sprintId: number) => async (state: State, actions: Actions) => {
        console.log(`Changing sprint to ${sprintId} ...`);
        if (sprintId == state.selectedSprintId) return;
        actions.updateSelectedSprint(sprintId);
        await actions.fetchSprintDetails();
    };

}
