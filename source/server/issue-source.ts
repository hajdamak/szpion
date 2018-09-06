import {BoardId, Sprint, SprintId} from '../common/model'


export interface IssueSource {

    fetchBoards() : Promise<Array<BoardId>>;

    fetchSprintsFromBoard(boardId : string) : Promise<Array<SprintId>>;

    fetchSprint(boardId: number, sprintId: number) : Promise<Sprint>;

    fetchLatestSprint() : Promise<Sprint>;
}

