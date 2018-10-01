import {Board, ClientConfig, SprintDetails, Sprint} from "../common/model";

export class State {
	isLoading: boolean = false;
	error: string|undefined = undefined;
	config: ClientConfig = {};
	boards: Array<Board> = [];
	selectedBoardId: number | undefined;
	sprints: Array<Sprint> = [];
	selectedSprintId: number | undefined;
	sprintDetails: SprintDetails | undefined = undefined;

}

