import {View} from "hyperapp";
import cc from 'classcat';
import {
    div, span, section, nav,
    img, a, h3,
    select, option,
    table, thead, tbody, tr, td, th,
    ul, li
} from "@hyperapp/html";

import {readableDuration, readableTime} from "../common/utils";
import {State} from "./state";
import {Actions} from "./actions";
import {Issue, User} from "../common/model";

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
        section({class: "section"}, [

            state.sprintDetails ? (
                div({class: "container is-fluid"}, [

                    div({class: "columns"}, [
                        div({class: "column"}, [
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
                            })
                        ]),
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


interface SelectorItem {
    readonly id: number;
    readonly name: string;
}

interface SelectorParams {
    readonly items: Array<SelectorItem>;
    readonly selectedId: number | undefined;
    readonly onchange: (item: number) => any;
};

const Selector = ({items, selectedId, onchange}: SelectorParams) =>
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

const IssuesTable = ({issues}: IssuesTableParams) =>
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
        ...issues.map(issue =>
            tbody([
                IssueRow({issue: issue}),
                ...issue.children.map(child =>
                    IssueRow({issue: child})
                )
            ])
        )
    ]);


const IssueRow = ({issue}: { issue: Issue }) =>
    tr({key: issue.key}, [
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
            issue.sprintWorkRatio < 100 ?
                span({class: "green"}, `${issue.sprintWorkRatio} %`)
                :
                span({class: "red"}, `${issue.sprintWorkRatio} %`)
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


const UsersTable = ({users}: { users: Array<User> }) =>
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
