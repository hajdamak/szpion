import cc from 'classcat';
import {
	div, span,
	img, a,
	select, option,
	table, thead, tbody, tr, td, th,
} from "@hyperapp/html";

import {readableDuration, flatMap} from "../common/utils";
import {Issue, User} from "../common/model";

interface SelectorItem {
	readonly id: number;
	readonly name: string;
}

interface SelectorParams {
	readonly items: Array<SelectorItem>;
	readonly selectedId: number | undefined;
	readonly onchange: (item: number) => any;
};

export const Selector = ({items, selectedId, onchange}: SelectorParams) =>
	div({class: "select"}, [
		select({value: selectedId, onchange: (e: any) => onchange(parseInt(e.target.value))},
			items.map(item =>
				option({value: item.id}, item.name)
			)
		)
	]);


interface IssuesTableParams {
	readonly issues: Array<Issue>;
}

export const IssuesTable = ({issues}: IssuesTableParams) =>
	table({class: "table is-narrow is-fullwidth is-striped"}, [
		thead([
			tr([
				th("T"),
				th("Issue"),
				th("P"),
				th("Summary"),
				th("Assignee"),
				th("Original estimate"),
				th("Time spent"),

				th("Sprint estimate"),
				th("Sprint time spent"),
				th("Remaining estimate"),
				th("Sprint work ratio"),

				th("Status"),
			])
		]),
		tbody(
			flatMap(issues, issue => [
				IssueRow({issue: issue}),
				... issue.children.map(child =>
					IssueRow({issue: child})
				)
			])
		)
	]);


export const IssueRow = ({issue}: { issue: Issue }) =>
	tr({key: issue.key, class: cc({"parent-issue": issue.children.length != 0})}, [
		td([
			img({src: issue.issuetypeIconUrl})
		]),
		td({class: "text-nowrap"}, [
			a({href: issue.url}, issue.key)
		]),
		td([
			img({src: issue.priorityIconUrl})
		]),
		td(issue.summary),
		td({class: `user-${issue.assigneeId}`}, issue.assignee),
		td({class: "text-nowrap"}, readableDuration(issue.originalEstimate)),
		td({class: "text-nowrap"}, readableDuration(issue.timeSpent)),

		td({class: "text-nowrap"}, readableDuration(issue.sprintEstimate)),
		td({class: "text-nowrap"}, readableDuration(issue.sprintTimeSpent)),
		td({
			class: `text-nowrap remaining${issue.remainingEstimate > 0 ? "" : "-zero"}`
		}, readableDuration(issue.remainingEstimate)),

		td({class: "text-nowrap"}, [

			span({
				class: cc({
					"has-text-danger": issue.sprintWorkRatio > 100,
					"has-text-warning": (90 <= issue.sprintWorkRatio) && (issue.sprintWorkRatio <= 100),
					"has-text-success": issue.sprintWorkRatio < 90
				})
			}, `${issue.sprintWorkRatio}%`)

		]),

		td({class: "text-nowrap"}, [
			span({
				class: cc({
					"tag": true,
					"is-warning": issue.status === "Open",
					"is-info": issue.status === "In Progress",
					"is-success": issue.status === "Implemented" || issue.status === "Resolved",
					"is-dark": issue.status === "Closed",
					"is-danger": issue.status === "Reopened"
				})
			}, issue.status)
		])

	]);


export const UsersTable = ({users}: { users: Array<User> }) =>
	table({class: "table is-striped is-narrow is-fullwidth"}, [
		thead([
			th("User"),
			th("Time spent")
		]),
		tbody(
			users.map(user =>
				tr([
					td(user.name),
					td(readableDuration(user.timeSpent))
				])
			)
		)
	]);
