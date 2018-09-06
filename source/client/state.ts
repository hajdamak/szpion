import {BoardId, ClientConfig, Sprint, SprintId} from "../common/model";

export class State {
    config: ClientConfig = {};
    boards: Array<BoardId> = [];
    selectedBoardId: string|null = null;
    sprints: Array<SprintId> = [];
    selectedSprintId: string|null = null
    sprint : Sprint = {
        board: { id: 0, name: ""},
        sprint: { id: 0, name: ""},
        startDate: new Date(),
        endDate: new Date(),
        issues: [],
        users: []
    };
}

export const state = new State();
