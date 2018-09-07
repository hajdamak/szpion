import {h, View} from "hyperapp";

import {readableDuration} from "../common/utils";
import {State} from "./state";
import {Actions} from "./actions";
import {Issue, User} from "../common/model";

export const view: View<State, Actions> = (state: State, actions: Actions) => (

	<div className="container-fluid" oncreate={actions.init}>

		<Selector title="Boards" items={state.boards} onchange={(itemId) => () => actions.changeBoard(itemId)} />
		<Selector title="Sprints" items={state.sprints} onchange={(itemId) => () => actions.changeSprint(itemId)} />

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

type SelectorItem = { id: number, name: string }

const Selector = ({title, items, onchange} : {title: string, items: Array<SelectorItem>, onchange:(item: number) => any}) => (
	<div className="dropdown is-hoverable">
		<div className="dropdown-trigger">
			<button className="button" aria-haspopup="true" aria-controls="dropdown-menu">
				<span>{title}</span>
				<span className="icon is-small">
						<i className="fas fa-angle-down" aria-hidden="true"></i>
				</span>
			</button>
		</div>
		<div className="dropdown-menu" id="dropdown-menu" role="menu">
			<div className="dropdown-content">
				{items.map(item =>
					<a className="dropdown-item" onclick={onchange(item.id)}>
						{item.name}
					</a>
				)}
				<a href="#" className="dropdown-item is-active" >
					Active dropdown item
				</a>
			</div>
		</div>
	</div>
)


const IssuesTable = ({issues} : {issues: Array<Issue>}) => (
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
			<IssueRow issue={issue}/>
			{issue.children.map(child =>
				<IssueRow issue={child}/>
			)}
			</tbody>
		)}
	</table>
)



const IssueRow = ({ issue } : { issue: Issue }) => (

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


const readableTime = (date: Date) => {
	return date.toLocaleString('pl', { hour12: false });
};

const calculateStatusClass = (status: string) => {
	if (status === "Implemented" || status === "Resolved") {
		return "finished";
	} else if (status === "In Progress") {
		return "in-progress";
	}
	return '';
};

const countNotStarted = (issues: Array<Issue>) => {
	return issues.filter(issue => partof(issue.status, "Open") && (!issue.children || issue.children.length === 0)).length;
};

const partof = (toCheck: string, ...elements : Array<string>) => {
	if (elements.find(element => element === toCheck))
		return true;
	else
		return false;
};


const UsersTable = ({users} : {users: Array<User>}) => {

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
