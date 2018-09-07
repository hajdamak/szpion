import {Board, ClientConfig, SprintDetails, Sprint} from "../common/model";

export class State {
    config: ClientConfig = {};
    boards: Array<Board> = [];
    selectedBoardId: number|undefined;
    sprints: Array<Sprint> = [];
    selectedSprintId: number|undefined;
    sprint : SprintDetails = {
        board: { id: 0, name: ""},
        sprint: { id: 0, name: ""},
        startDate: new Date(),
        endDate: new Date(),
        issues: [],
        users: []
    };
}

export const state = new State();
