import {BoardId, Sprint, SprintId} from '../common/model'


export interface IssueSource {

    fetchLatestSprint() : Promise<Sprint>;

    fetchBoards() : Promise<Array<BoardId>>;

    fetchSprintsFromBoard(boardId : string) : Promise<Array<SprintId>>;
}

