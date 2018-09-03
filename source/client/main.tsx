import { h, app } from "hyperapp";
// import { div, h1, button } from "@hyperapp/html"
import { ClientConfig, Sprint, SprintId, BoardId } from "../common/model";
import { readableDuration } from '../common/utils';

class State {
    config: ClientConfig = {};
    boards: Array<BoardId> = [];
    sprints: Array<SprintId> = [];
    sprint : Sprint = {
        board: { id: "", name: ""},
        sprint: { id: "", name: ""},
        startDate: new Date(),
        endDate: new Date(),
        issues: [],
        users: []
    };
}
const state =  new State();


const actions = {
	loadData: () => async (state, actions) => {
	    console.log("Loading configuration ...");
        const configJson = await fetch('/config');
        const config = await configJson.json();
        actions.updateConfig(config);

        console.log("Loading boards ...");
        const boardsJson = await fetch('/boards');
        const boards = await boardsJson.json();
        const board = boards[0];
        actions.updateBoards(boards);

        console.log("Loading sprints ...");
        const sprintsJson = await fetch(`/boards/${board.id}/sprints`);
        const sprints = await sprintsJson.json();
        actions.updateSprints(sprints);

        console.log("Loading data ...");
        const sprintJson = await fetch('/sprint');
        const sprint = await sprintJson.json();

		console.log("after loadData");
		actions.updateData(sprint);
	},
    updateConfig: config => state => {
        console.log("Config updated.")
        return { config: config };
    },
    updateBoards: boards => state => {
        console.log("Boards updated.")
        return { boards: boards };
    },
    updateSprints: sprints => state => {
        console.log("Sprints updated.")
        return { sprints: sprints };
    },
	updateData: sprint => state => {
		console.log("Data updated.")
        return { sprint: sprint };
	},
}

const view = (state, actions) => (
    <div className="container-fluid" oncreate={actions.loadData}>
        <div className="columns">
            <div className="column">
                <span id="logo">Szpion</span>
                <span> Daily Sprint Invigilation</span>
            </div>
            <div className="column">
                Board: <span>{state.sprint.board.name}</span><br/>
                Sprint: <span>{state.sprint.sprint.name}</span><br/>
            </div>
            <div className="column">
                Sprint issues : {state.sprint.issues.filter(issue => !partof(issue.status, "Closed")).length}<br/>
                Sprint issues completed
                : {state.sprint.issues.filter(issue => partof(issue.status, "Closed")).length}<br/>
                Sprint issues not started
                : {countNotStarted(state.sprint.issues.filter(issue => partof(issue.status, "Open")))}<br/>
            </div>
            <div className="column">
                Start date: <span>{readableTime(state.sprint.startDate)}</span><br/>
                End date: <span>{readableTime(state.sprint.endDate)}</span><br/>
            </div>
            <div className="column">
                Sprint estimate
                : {readableDuration(state.sprint.issues.reduce((sum, issue) => sum + issue.sprintEstimate, 0))}<br/>
                Sprint time spent
                : {readableDuration(state.sprint.issues.reduce((sum, issue) => sum + issue.sprintTimeSpent, 0))}<br/>
                Sprint remaining estimate
                : {readableDuration(state.sprint.issues.reduce((sum, issue) => sum + issue.remainingEstimate, 0))}<br/>
            </div>
        </div>

        <h3>Issues</h3>
        <IssuesTable
            issues={state.sprint.issues.filter(issue => !partof(issue.status, "Closed"))}/>

        <h3>Closed issues</h3>
        <IssuesTable
            issues={state.sprint.issues.filter(issue => partof(issue.status, "Closed"))}/>

        <h3>Users</h3>
        <UsersTable users={state.sprint.users}/>


    </div>
)

app(state, actions, view, document.body);


const IssuesTable = ({ issues }) => {

    return(
        <table className="table is-narrow is-fullwidth">
            <thead>
            <tr>
                <th>T</th>
                <th>Issue</th>
                <th>P</th>
                <th>Summary</th>
                <th>Assignee</th>
                <th>Original estimate</th>
                <th>Time spent</th>

                <th>Sprint estimate</th>
                <th>Sprint time spent</th>
                <th>Remaining estimate</th>
                <th>Sprint work ratio</th>

                <th>Status</th>
            </tr>
            </thead>
            {issues.map(issue =>
                <tbody>
                    <IssueRow issue={issue} />
                    {issue.children.map(child =>
                        <IssueRow issue={child} />
                    )}
                </tbody>
            )}
        </table>
    )

}

const IssueRow = ({ issue }) => (

    <tr key={issue.key}
        style={{
            backgroundColor : issue.parent ? '#efefef' : '#ffffff',
            borderTop: issue.parent ? '' : '1px solid #888888'
        }}
    >
        <td><img src={issue.issuetypeIconUrl}/></td>
        <td className="text-nowrap"><a href={issue.url}>{issue.key}</a></td>
        {/*<td className="text-nowrap">{issue.parent}</td>*/}
        <td><img src={issue.priorityIconUrl}/></td>
        <td>{issue.summary}</td>
        <td className={`user-${issue.assigneeId}`}>{issue.assignee}</td>
        <td className="text-nowrap">{readableDuration(issue.originalEstimate)}</td>
        <td className="text-nowrap">{readableDuration(issue.timeSpent)}</td>

        <td className="text-nowrap">{readableDuration(issue.sprintEstimate)}</td>
        <td className="text-nowrap">{readableDuration(issue.sprintTimeSpent)}</td>
        <td className={`text-nowrap remaining${issue.remainingEstimate > 0 ? "" : "-zero"}`}>{readableDuration(issue.remainingEstimate)}</td>

        <td className="text-nowrap">
            {issue.sprintWorkRatio < 100 ? (
                <span className="green">{issue.sprintWorkRatio} %</span>
            ) : (
                <span className="red">{issue.sprintWorkRatio} %</span>
            )}
        </td>
        <td className={`text-nowrap ${calculateStatusClass(issue.status)}`}>{issue.status}</td>
    </tr>
)


const readableTime = (date) => {
	return date.toLocaleString('pl', { hour12: false });
};

const calculateStatusClass = (status) => {
	if (status === "Implemented" || status === "Resolved") {
		return "finished";
	} else if (status === "In Progress") {
		return "in-progress";
	}
	return '';
};

const countNotStarted = (issues) => {
	return issues.filter(issue => partof(issue.status, "Open") && (!issue.children || issue.children.length === 0)).length;
};

const partof = (toCheck, ...elements) => {
	if (elements.find(element => element === toCheck))
		return true;
	else
		return false;
};


const UsersTable = ({users}) => {

    return (
        <table className="table is-striped is-narrow is-fullwidth">
            <thead>
            <tr>
                <th>User</th>
                <th>Time spent</th>
            </tr>
            </thead>
            <tbody>
            {users.map(user =>
                <tr>
                    <td>{user.name}</td>
                    <td>{readableDuration(user.timeSpent)}</td>
                </tr>
            )}
            </tbody>
        </table>
    )

}
