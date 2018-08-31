import { Sprint, Issue } from '../common/model'


export interface IssueSource {

    fetchLatestSprint() : Promise<Sprint>;

}
