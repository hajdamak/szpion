import {ActionsType} from "hyperapp";

import {Board, ClientConfig, SprintDetails, Sprint} from "../common/model";
import {State} from "./state";

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
    };

    updateBoards = (boards: Array<Board>) => (state: State) => {
        console.log("Boards updated.")
        return {
            selectedBoardId: 213,
            boards: boards
        };
    };

    fetchSprints = () => async (state: State, actions: Actions) => {
        console.log("Fetching sprints...");
        const sprintsJson = await fetch(`/boards/${state.selectedBoardId}/sprints`);
        const sprints = await sprintsJson.json();
        actions.updateSprints(sprints);
    };

    updateSprints = (sprints: Array<Sprint>) => (state: State) => {
        console.log("Sprints updated.");
        return {
            selectedSprintId: sprints[0].id,
            sprints: sprints
        };
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

    updateSelectedBoard = (boardId: number) => (state: State) => {
        console.log(`Selected board updated to ${boardId}`);
        return { selectedBoardId: boardId };
    };

    changeSprint = (sprintId: number) => async (state: State, actions: Actions) => {
        console.log(`Changing sprint to ${sprintId} ...`);
        if (sprintId == state.selectedSprintId) return;
        actions.updateSelectedSprint(sprintId);
        await actions.fetchSprintDetails();
    };

    updateSelectedSprint = (sprintId: number) => (state: State) => {
        console.log(`Selected sprint updated to ${sprintId}`);
        return { selectedSprintId: sprintId };
    };

}
