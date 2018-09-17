import {ActionsType} from "hyperapp";
import {Board, ClientConfig, SprintDetails, Sprint} from "../common/model";
import {State} from "./state";
import {getNumberFromLocalStorage} from "../common/utils";

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
        return {config: config};
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
        return {boards: boards};
    };
    updateSelectedBoard = (boardId: number | undefined) => (state: State) => {
        const id = boardId ? boardId : getNumberFromLocalStorage("selectedBoardId");
        const foundBoard = state.boards.find(board => board.id === id);
        const board = foundBoard ? foundBoard : state.boards[0];
        const targetId = board ? board.id : undefined;

        console.log(`Selected board updated to ${targetId}`);
        window.localStorage.setItem("selectedBoardId", String(targetId));
        return {selectedBoardId: targetId};
    };
    changeBoard = (boardId: number) => async (state: State, actions: Actions) => {
        console.log(`Changing board to ${boardId} ...`);
        if (boardId == state.selectedBoardId) return;
        actions.updateSelectedBoard(boardId);
        await actions.fetchSprints();
        await actions.fetchSprintDetails();
    };


    fetchSprints = () => async (state: State, actions: Actions) => {
        console.log("Fetching sprints...");
        const sprintsJson = await fetch(`/boards/${state.selectedBoardId}/sprints`);
        const sprints = await sprintsJson.json();
        actions.updateSprints(sprints);
        actions.updateSelectedSprint(undefined);
    };
    updateSprints = (sprints: Array<Sprint>) => (state: State) => {
        console.log("Sprints updated.");
        return {sprints: sprints};
    };
    updateSelectedSprint = (sprintId: number | undefined) => (state: State) => {
        const id = sprintId ? sprintId : getNumberFromLocalStorage("selectedSprintId");
        const foundSprint = state.sprints.find(sprint => sprint.id === id);
        const sprint = foundSprint ? foundSprint : state.sprints[0];
        const targetId = sprint ? sprint.id : undefined;

        console.log(`Selected sprint updated to ${targetId}`);
        window.localStorage.setItem("selectedSprintId", String(targetId));
        return {selectedSprintId: targetId};
    };
    changeSprint = (sprintId: number) => async (state: State, actions: Actions) => {
        console.log(`Changing sprint to ${sprintId} ...`);
        if (sprintId == state.selectedSprintId) return;
        actions.updateSelectedSprint(sprintId);
        await actions.fetchSprintDetails();
    };


    fetchSprintDetails = () => async (state: State, actions: Actions) => {
        console.log("Fetching sprint...");
        const sprintJson = await fetch(`/boards/${state.selectedBoardId}/sprints/${state.selectedSprintId}`);
        const sprint = await sprintJson.json();
        actions.updateSprintDetails(sprint);
    };
    updateSprintDetails = (sprintDetails: SprintDetails) => (state: State) => {
        console.log("Sprint updated.")
        return {sprintDetails: sprintDetails};
    };

}
