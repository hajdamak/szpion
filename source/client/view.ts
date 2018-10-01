import cc from 'classcat';
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

		div({
			class: cc({
				"pageloader": true,
				"is-active": state.isLoading,
			})
		}, [
			span({class: "title"}, "Receiving data...")
		]),

		div({
			class: cc({
				"modal": true,
				"is-active": state.error ? true : false,
			})
		}, [
			div({class: "modal-background"}),
			div({class: "modal-content"}, [
				div({class: "notification is-danger"}, state.error)
			])
		]),

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

		section({class: "section"}, [

			div({class: "container is-fluid"}, [

				div({class: "columns"}, [
					div({class: "column"}, [
						div([
							span("Board: "),
							Selector({
								items: state.boards,
								selectedId: state.selectedBoardId,
								onchange: actions.changeBoard
							})
						]),
						div([
							span("Sprint: "),
							Selector({
								items: state.sprints, selectedId:
								state.selectedSprintId,
								onchange: actions.changeSprint
							})
						])
					]),
					div({class: "column"}, state.sprintDetails ? [
						div(`Issues: ${state.sprintDetails.issuesCount}`),
						div(`Issues completed: ${state.sprintDetails.completedIssuesCount}`)
					] : []),
					div({class: "column"}, state.sprintDetails ? [
						div(`Start date: ${readableTime(state.sprintDetails.startDate)}`),
						div(`End date: ${readableTime(state.sprintDetails.endDate)}`)
					] : []),
					div({class: "column"}, state.sprintDetails ? [
						div(`Estimate: ${readableDuration(state.sprintDetails.estimate)}`),
						div(`Time spent: ${readableDuration(state.sprintDetails.timeSpent)}`),
						div(`Remaining estimate: ${readableDuration(state.sprintDetails.remainingEstimate)}`)
					] : [])
				]),
				state.sprintDetails ?
					div([
						IssuesTable({
							issues: state.sprintDetails.issues
						}),
						h3("Users"),
						UsersTable({users: state.sprintDetails.users})
					])
					:
					div("Loading data")
			])

		])

	]);

