import {View} from "hyperapp";
import {
	div, span, section, nav,
	a, h3,
	ul, li
} from "@hyperapp/html";

import {readableDuration, readableTime} from "../common/utils";
import {State} from "./state";
import {Actions} from "./actions";
import {IssuesTable, UsersTable, Selector} from "./components";

export const view: View<State, Actions> = (state: State, actions: Actions) =>
	div({oncreate: actions.init}, [
		section({class: "section"}, [
			nav({class: "level"}, [
				div({class: "level-left"}, [
					div({class: "level-item"}, [
						span({id: "logo"}, "Szpion"),
						span("Daily Sprint Invigilation")
					])
				]),
				div({class: "level-right"}, [
					div({class: "tabs"}, [
						ul([
							li({class: "is-active"}, [a("Sprint")]),
							li([a("Epic")])
						])
					])
				])
			])
		]),

		span("Board"),
		Selector({
			items: state.boards,
			selectedId: state.selectedBoardId,
			onchange: actions.changeBoard
		}),
		span("Sprint"),
		Selector({
			items: state.sprints, selectedId:
			state.selectedSprintId,
			onchange: actions.changeSprint
		}),

		section({class: "section"}, [

			state.sprintDetails ? (
				div({class: "container is-fluid"}, [

					div({class: "columns"}, [
						div({class: "column"}, []),
						div({class: "column"}, [
							div(`Issues: ${state.sprintDetails.issuesCount}`),
							div(`Issues completed: ${state.sprintDetails.completedIssuesCount}`)
						]),
						div({class: "column"}, [
							div(`Start date: ${readableTime(state.sprintDetails.startDate)}`),
							div(`End date: ${readableTime(state.sprintDetails.endDate)}`)
						]),
						div({class: "column"}, [
							div(`Estimate: ${readableDuration(state.sprintDetails.estimate)}`),
							div(`Time spent: ${readableDuration(state.sprintDetails.timeSpent)}`),
							div(`Remaining estimate: ${readableDuration(state.sprintDetails.remainingEstimate)}`)
						])
					]),

					IssuesTable({
						issues: state.sprintDetails.issues.filter(issue => issue.status !== "Closed")
					}),
					h3("Closed issues"),
					IssuesTable({
						issues: state.sprintDetails.issues.filter(issue => issue.status === "Closed")
					}),

					h3("Users"),
					UsersTable({users: state.sprintDetails.users})
				])
			) : (
				div("Loading data")
			)

		])

	]);

