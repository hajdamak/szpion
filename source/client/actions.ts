import {BoardId, ClientConfig, Sprint, SprintId} from "../common/model";
import {State} from "./state";

export const actions = {
    init: () => async (state: State, actions) => {
        await actions.fetchConfig();
        await actions.fetchBoards();
        await actions.fetchSprints();
        await actions.fetchSprint();
    },

    fetchConfig: () => async (state: State, actions) => {
        console.log("Fetching config...");
        const configJson = await fetch('/config');
        const config = await configJson.json();
        actions.updateConfig(config);
    },
    updateConfig: (config: ClientConfig) => (state: State) => {
        console.log("Config updated.");
        return { config: config };
    },

    fetchBoards: () => async (state: State, actions) => {
        console.log("Fetching boards...");
        const boardsJson = await fetch('/boards');
        const boards = await boardsJson.json();
        actions.updateBoards(boards);
    },
    updateBoards: (boards: Array<BoardId>) => (state: State) => {
        console.log("Boards updated.")
        return {
            selectedBoardId: 213,
            boards: boards
        };
    },

    fetchSprints: () => async (state: State, actions) => {
        console.log("Fetching sprints...");
        const sprintsJson = await fetch(`/boards/${state.selectedBoardId}/sprints`);
        const sprints = await sprintsJson.json();
        actions.updateSprints(sprints);
    },
    updateSprints: (sprints: Array<SprintId>) => state => {
        console.log("Sprints updated.");
        return {
            selectedSprintId: sprints[0].id,
            sprints: sprints
        };
    },

    fetchSprint: () => async (state: State, actions) => {
        console.log("Fetching sprint...");
        const sprintJson = await fetch(`/boards/${state.selectedBoardId}/sprints/${state.selectedSprintId}`);
        const sprint = await sprintJson.json();
        actions.updateSprint(sprint);
    },
    updateSprint: (sprint: Sprint) => (state: State) => {
        console.log("Sprint updated.")
        return { sprint: sprint };
    },

    changeBoard: (boardId: string) => async (state: State, actions) => {
        console.log(`Changing board to ${boardId} ...`);
        if (boardId == state.selectedBoardId) return;
        actions.updateSelectedBoard(boardId);
        await actions.fetchSprints();
        await actions.fetchSprint();
    },
    updateSelectedBoard: (boardId: string) => (state: State) => {
        console.log(`Selected board updated to ${boardId}`);
        return { selectedBoardId: boardId };
    },

    changeSprint: (sprintId: string) => async (state: State, actions) => {
        console.log(`Changing sprint to ${sprintId} ...`);
        if (sprintId == state.selectedSprintId) return;
        actions.updateSelectedSprint(sprintId);
        await actions.fetchSprint();
    },
    updateSelectedSprint: (sprintId: string) => (state: State) => {
        console.log(`Selected sprint updated to ${sprintId}`);
        return { selectedSprintId: sprintId };
    },

}
