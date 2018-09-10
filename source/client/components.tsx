import {h, View} from "hyperapp";
import cc from 'classcat';

import {readableDuration, readableTime} from "../common/utils";
import {State} from "./state";
import {Actions} from "./actions";
import {Issue, User} from "../common/model";

export const view: View<State, Actions> = (state: State, actions: Actions) => (

	<div oncreate={actions.init}>

		<section className="section">
		<nav class="level">
			<div class="level-left">
				<div class="level-item">
					<span id="logo">Szpion</span>
					<span> Daily Sprint Invigilation</span>
				</div>
			</div>
			<div class="level-right">
				<div class="tabs">
					<ul>
						<li class="is-active"><a>Sprint</a></li>
						<li><a>Epic</a></li>
					</ul>
				</div>
			</div>
		</nav>
		</section>
  	<section class="section">

		{state.sprintDetails ? (
			<div class="container is-fluid">

				<div class="columns">
					<div class="column">
						Board: <Selector items={state.boards} selectedId={state.selectedBoardId}
														 onchange={actions.changeBoard}/><br/>
						Sprint: <Selector items={state.sprints} selectedId={state.selectedSprintId}
															onchange={actions.changeSprint}/><br/>
					</div>
					<div class="column">
						Issues: {state.sprintDetails.issuesCount}<br/>
						Issues completed: {state.sprintDetails.completedIssuesCount}<br/>
					</div>
					<div class="column">
						Start date: <span>{readableTime(state.sprintDetails.startDate)}</span><br/>
						End date: <span>{readableTime(state.sprintDetails.endDate)}</span><br/>
					</div>
					<div class="column">
						Estimate: {readableDuration(state.sprintDetails.estimate)}<br/>
						Time spent: {readableDuration(state.sprintDetails.timeSpent)}<br/>
						Remaining estimate: {readableDuration(state.sprintDetails.remainingEstimate)}<br/>
					</div>
				</div>

				<IssuesTable
					issues={state.sprintDetails.issues.filter(issue => issue.status !== "Closed")}/>

				<h3>Closed issues</h3>
				<IssuesTable
					issues={state.sprintDetails.issues.filter(issue => issue.status === "Closed")}/>

				<h3>Users</h3>
				<UsersTable users={state.sprintDetails.users}/>
			</div>
		) : (
			<div>Loading data</div>
		)}

		</section>

	</div>

)

type SelectorItem = { id: number, name: string }

const Selector = ({items, selectedId, onchange}: { items: Array<SelectorItem>, selectedId: number | undefined, onchange: (item: number) => any }) => (
	<div class="select">
		<select value={selectedId} onchange={(e: any) => onchange(e.target.value)}>
			{items.map(item =>
				<option value={item.id}>{item.name}</option>
			)}
		</select>
	</div>
)


const IssuesTable = ({issues}: { issues: Array<Issue> }) => (
	<table class="table is-narrow is-fullwidth is-striped">
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


const IssueRow = ({issue}: { issue: Issue }) => {

	return (<tr key={issue.key}>
		<td><img src={issue.issuetypeIconUrl}/></td>
		<td class="text-nowrap"><a href={issue.url}>{issue.key}</a></td>
		{/*<td class="text-nowrap">{issue.parent}</td>*/}
		<td><img src={issue.priorityIconUrl}/></td>
		<td>{issue.summary}</td>
		<td class={`user-${issue.assigneeId}`}>{issue.assignee}</td>
		<td class="text-nowrap">{readableDuration(issue.originalEstimate)}</td>
		<td class="text-nowrap">{readableDuration(issue.timeSpent)}</td>

		<td class="text-nowrap">{readableDuration(issue.sprintEstimate)}</td>
		<td class="text-nowrap">{readableDuration(issue.sprintTimeSpent)}</td>
		<td
			class={`text-nowrap remaining${issue.remainingEstimate > 0 ? "" : "-zero"}`}>{readableDuration(issue.remainingEstimate)}</td>

		<td class="text-nowrap">
			{issue.sprintWorkRatio < 100 ? (
				<span class="green">{issue.sprintWorkRatio} %</span>
			) : (
				<span class="red">{issue.sprintWorkRatio} %</span>
			)}
		</td>
		<td class="text-nowrap">
			<span class={cc({
				"tag": true,
				"is-warning": issue.status === "Open",
				"is-info": issue.status === "In Progress",
				"is-success": issue.status === "Implemented" || issue.status === "Resolved",
				"is-dark": issue.status === "Closed",
				"is-danger": issue.status === "Reopened"
			})}>{issue.status}</span>
		</td>
	</tr>);
}

const UsersTable = ({users}: { users: Array<User> }) => {

	return (
		<table class="table is-striped is-narrow is-fullwidth">
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
