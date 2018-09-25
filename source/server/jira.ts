import fetch from 'cross-fetch';
import fs from 'fs';

import {SprintDetails, Issue, WorkLog, User, Board, Sprint} from '../common/model';
import {flatMap, ifElse, numberOr, orElse, zip} from '../common/utils';
import path from "path";

type ViewsJson = {
	views: [{
		id: number,
		name: string

	}]
};

type SprintsJson = {
	sprints: [{
		id: number,
		name: string
	}]
};

type SprintReportJson = {
	sprint: {
		startDate: string,
		endDate: string
	}
}

type WorklogJson = {
	started: string,
	timeSpentSeconds: number,
	author: {
		displayName: string
	}
}

type WorklogsJson = {
	worklogs: [WorklogJson]
}

type SearchJson = {
	issues: [IssueJson]
}

type IssueJson = {
	key: string
	fields: {
		summary: string,
		created: string,
		issuetype: {
			subtask: boolean,
			iconUrl: string
		},
		parent: {
			key: string
		},
		priority: {
			iconUrl: string
		},
		status: {
			name: string,
		},
		assignee: {
			name: string,
			displayName: string
		},
		timetracking: {
			originalEstimateSeconds: number,
			timeSpentSeconds: number,
			remainingEstimateSeconds: number
		},
		customfield_11869?: [string]
	},
	changelog: {
		histories: [{
			created: string,
			items: [{
				field: string,
				fromString?: string,
				to?: string,
				toString?: string
			}]
		}]
	}
}


interface Period {
	start: Date;
	end: Date;
}


export class Jira {

	private readonly init: any;

	constructor(
		private readonly jiraURL: string,
		private readonly basicAuthToken: string,
		private readonly mock: boolean = false
	) {
		this.init = {
			headers: {
				'Authorization': 'Basic ' + this.basicAuthToken
			}
		};
	}

	public readonly fetchSprint = async (boardId: number, sprintId: number): Promise<SprintDetails> => {
		console.log(`Getting sprint ${sprintId} data of board ${boardId} from JIRA...`);

		// Get board
		const boards = await this.fetchBoards();
		const board = boards.find(board => board.id === boardId);
		if (!board) {
			throw Error(`Can't find board ${boardId}`);
		}

		// Get sprint
		const sprints = await this.fetchSprintsFromBoard(boardId);
		const sprint = sprints.find(sprint => sprint.id === sprintId);
		if (!sprint) {
			throw Error(`Can't find sprint ${sprintId}`);
		}

		const [searchJson, reportJson] = await Promise.all([
			this.fetchIssuesFromSprint(sprint.name),
			this.fetchSprintReport(boardId, sprintId)
		]);

		const sprintStartDate = new Date(reportJson.sprint.startDate);
		const sprintEndDate = new Date(reportJson.sprint.endDate);

		const worklogJsons = await Promise.all(
			searchJson.issues.map(issueJson => this.fetchIssueWorklog(issueJson.key))
		);

		const issuesAndWorklogs = zip(searchJson.issues, worklogJsons);
		const issues = issuesAndWorklogs.map(
			([issueJson, worklogJson]): Issue => {

				const issueToCheck = ifElse(
					issueJson.fields.issuetype.subtask,
					() => {
						const parentIssue = searchJson.issues.find(
							parentIssue => issueJson.fields.parent.key === parentIssue.key
						);
						if (!parentIssue)
							throw Error("Cant't find parent issue to calculate issue availability in sprint");
						return parentIssue
					},
					() => issueJson
				);

				const periods = this.calculateIssueAvailabilityInSprint(issueToCheck, sprint.name, sprintStartDate, sprintEndDate);

				const sprintEstimate = this.calculateSprintEstimate(issueJson, periods);

				const worklogs = this.calculateWorkLogsInSprint(worklogJson, periods);

				const sprintTimeSpent = worklogs.reduce((sum, worklog) => sum + worklog.timeSpent, 0);

				const sprintWorkRatio =
					(sprintTimeSpent == 0 || sprintEstimate == 0) ? 0 : Math.floor((sprintTimeSpent / sprintEstimate) * 100);

				return {
					key: issueJson.key,
					parent: issueJson.fields.parent ? issueJson.fields.parent.key : null,
					children: [],
					url: `${this.jiraURL}/browse/${issueJson.key}`,
					priorityIconUrl: issueJson.fields.priority.iconUrl,
					issuetypeIconUrl: issueJson.fields.issuetype.iconUrl,
					status: issueJson.fields.status.name,
					assignee: issueJson.fields.assignee.displayName,
					assigneeId: issueJson.fields.assignee.name,
					summary: issueJson.fields.summary,
					originalEstimate: numberOr(issueJson.fields.timetracking.originalEstimateSeconds, 0),
					timeSpent: numberOr(issueJson.fields.timetracking.timeSpentSeconds, 0),
					remainingEstimate: numberOr(issueJson.fields.timetracking.remainingEstimateSeconds, 0),
					sprintEstimate: sprintEstimate,
					sprintTimeSpent: sprintTimeSpent,
					sprintWorkRatio: sprintWorkRatio,
					periods: periods,
					worklogs: worklogs
				}
			}
		);

		const users = this.calculateUsersInfo(issues);

		const issuesCount = issues.length;
		const completedIssuesCount = issues.filter(issue => issue.status === "Closed").length;

		const estimate = issues.reduce((sum, issue) => sum + issue.sprintEstimate, 0);
		const timeSpent = issues.reduce((sum, issue) => sum + issue.sprintTimeSpent, 0);
		const remainingEstimate = issues.reduce((sum, issue) => sum + issue.remainingEstimate, 0);

		const issuesWithChildren = issues.filter(
			issue => issue.parent == null
		).map(
			issue => {
				const children = issues.filter(child => issue.key === child.parent)
				return {...issue, children: children}
			}
		)

		return {
			board: board,
			sprint: sprint,
			startDate: sprintStartDate.toJSON(),
			endDate: sprintEndDate.toJSON(),
			estimate: estimate,
			timeSpent: timeSpent,
			remainingEstimate: remainingEstimate,
			issuesCount: issuesCount,
			completedIssuesCount: completedIssuesCount,
			issues: issuesWithChildren,
			users: users
		}

	}

	public readonly fetchBoards = async (): Promise<Array<Board>> => {
		console.log("Gettting boards from JIRA...");
		// Get all boards
		const boardsJson = await this.fetchFromJira<ViewsJson>(`/rest/greenhopper/1.0/rapidview`);
		console.log("Received boards from JIRA.");
		const boards = boardsJson.views.map(
			viewJson => ({
				id: viewJson.id,
				name: viewJson.name,
			})
		);
		return boards;
	}

	public readonly fetchSprintsFromBoard = async (boardId: number): Promise<Array<Sprint>> => {
		console.log(`Getting sprints of board ${boardId} from JIRA...`);
		const sprintsJson = await this.fetchFromJira<SprintsJson>(`/rest/greenhopper/1.0/sprintquery/${boardId}`);
		console.log("Received sprints from JIRA.");
		const sprints = sprintsJson.sprints.map(
			sprintJson => ({
				id: sprintJson.id,
				name: sprintJson.name
			})
		);
		return sprints.reverse();
	};

	private readonly fetchFromJira = async <T>(resourcePath: string): Promise<T> => {
		if (!this.mock) {
			const response = await fetch(`${this.jiraURL}${resourcePath}`, this.init);
			const json: T = await response.json();
			return json;
		} else {
			const file = path.join(process.cwd(), `jira-mock-data${resourcePath}.json`);
			console.log(`Reading file : ${file}`);
			const response = fs.readFileSync(file, "UTF-8");
			const json = JSON.parse(response);
			return json;
		}
	};

	private readonly fetchIssuesFromSprint = async (sprintName: string): Promise<SearchJson> => {
		console.log("Getting sprint issues from JIRA...");
		const query = encodeURIComponent(`sprint="${sprintName}"`);
		const fields = "summary,timetracking,created,customfield_11869,status,priority,issuetype,parent,assignee";
		const expand = "changelog";
		const maxResults = 99999;
		const searchJson =
			await this.fetchFromJira<SearchJson>(`/rest/api/2/search?jql=${query}&fields=${fields}&expand=${expand}&maxResults=${maxResults}`);
		console.log("Received sprint issues from JIRA.");
		return searchJson;
	};

	private readonly fetchSprintReport = async (boardId: number, sprintId: number): Promise<SprintReportJson> => {
		console.log("Getting sprint report from JIRA...");
		const reportJson = await
			this.fetchFromJira<SprintReportJson>(`/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`);
		return reportJson;
	};

	private readonly fetchIssueWorklog = async (issueKey: string): Promise<WorklogsJson> => {
		console.log(`Getting worklog from JIRA for issue ${issueKey} ...`);
		const worklogJson = await this.fetchFromJira<WorklogsJson>(`/rest/api/2/issue/${issueKey}/worklog`);
		console.log(`Received worklog from JIRA for issue ${issueKey}.`);
		return worklogJson;
	};

	private readonly clipWithSprintPeriod = (periods: Array<Period>, sprintStart: Date, sprintEnd: Date) => {
		return periods.filter(
			// Get rid of periods completely outside of the sprint.
			period => {
				if ((period.end.getTime() < sprintStart.getTime()) || (period.start.getTime() > sprintEnd.getTime()))
					return false;
				else
					return true;
			}
		).map(
			// Fix periods partly in the sprint.
			period => {
				const start = (period.start.getTime() < sprintStart.getTime()) ? sprintStart : period.start;
				const end = (period.end.getTime() > sprintEnd.getTime()) ? sprintEnd : period.end;
				return {start: start, end: end};
			}
		)
	};

	private readonly calculateSprintMembershipPeriods =
		(issue: IssueJson, sprintName: string, sprintEndDate: Date): Array<Period> => {

			// Search issue history for sprint changes
			const points = issue.changelog.histories.map(
				history => {
					const item = history.items.find(item => item.field === "Sprint");
					if (item) {
						const point = {
							createdDate: new Date(history.created),
							fromCurrentSprint: item.fromString ? item.fromString.includes(sprintName) : false,
							toCurrentSprint: item.toString ? item.toString.includes(sprintName) : false,
							initial: false
						};

						// Avoid Sprint field modifications that do not change membership in searched sprint.
						if (point.fromCurrentSprint && point.toCurrentSprint)
							return undefined;

						return point;
					} else {
						return undefined;
					}
				}
			).filter(
				point => point != undefined
			);

			const inSprint = (sprintName: string) => {
				if (issue.fields.customfield_11869) {
					return issue.fields.customfield_11869.reduce((res, item) => item.includes(sprintName), false)
				} else {
					return false;
				}
			};

			if ((points.length == 0) && inSprint(sprintName)) {
				return [{start: new Date(issue.fields.created), end: sprintEndDate}];
			}

			const periods = points.map(
				(currentPoint, index, points) => {
					if (!currentPoint) return undefined;

					if ((index == 0) && currentPoint.fromCurrentSprint) {
						return {start: new Date(issue.fields.created), end: currentPoint.createdDate};
					} else if ((index == (points.length - 1)) && currentPoint.toCurrentSprint) {
						return {start: currentPoint.createdDate, end: sprintEndDate};
					} else if ((index > 0)) {
						const previousPoint = points[index - 1];
						if (!previousPoint) return undefined;
						if (previousPoint.toCurrentSprint && currentPoint.fromCurrentSprint)
							return {start: previousPoint.createdDate, end: currentPoint.createdDate};
						else
							return undefined;
					} else {
						return undefined;
					}
				}
			).filter(
				(period): period is Period => period != undefined
			);

			return periods;
		};

	// Calculate sprint estimate.
	// Value is taken from:
	// - original estimate
	// - remaining estimate (if different than original estimate) and there are no remaining estimate changes in changelog.
	// - last remaining estimate change in changelog before issue is part of sprint.
	private readonly calculateSprintEstimate = (issue: IssueJson, periods: Array<Period>): number => {
		if (periods.length == 0) return 0;

		const issueInSprintStartDate = periods[0].start;

		type Changes = { date: Date, estimate: number };

		const remainingEstimateChanges: Array<Changes> = issue.changelog.histories.map(
			history => {
				return {
					date: new Date(history.created),
					estimate: history.items.reduce(
						(estimate: undefined | number, item) => {
							if (item.field === "timeestimate") {
								if (item.to)
									return Number.parseInt(item.to);
								else
									return undefined;
							} else {
								return estimate;
							}
						},
						undefined
					)
				}
			}
		).filter(
			(change): change is Changes => change.estimate !== undefined
		);

		const defaultSprintEstimate =
			((issue.fields.timetracking.originalEstimateSeconds != issue.fields.timetracking.remainingEstimateSeconds)
				&& (remainingEstimateChanges.length == 0))
				?
				numberOr(issue.fields.timetracking.remainingEstimateSeconds, 0)
				:
				numberOr(issue.fields.timetracking.originalEstimateSeconds, 0);

		const sprintEstimate = remainingEstimateChanges.reduce(
			(estimate, change) => {
				if (change.date.getTime() < issueInSprintStartDate.getTime())
					return change.estimate;
				else
					return estimate;
			}
			, numberOr(defaultSprintEstimate, 0)
		);

		return sprintEstimate;
	};

	// Calculate issue availability periods in sprint.
	private readonly calculateIssueAvailabilityInSprint = (
		issue: IssueJson, sprintName: string, sprintStartDate: Date, sprintEndDate: Date): Array<Period> => {
		const periods = this.calculateSprintMembershipPeriods(issue, sprintName, sprintEndDate);
		const clippedPeriods = this.clipWithSprintPeriod(periods, sprintStartDate, sprintEndDate);
		return clippedPeriods;
	};

	private readonly calculateWorkLogsInSprint = (worklogsJson: WorklogsJson, periods: Array<Period>): Array<WorkLog> => {

		const isWorkLogPartOfSprint = (worklogJson: WorklogJson, periods: Array<Period>) => {
			const startedDate = new Date(worklogJson.started);
			return periods.reduce(
				(res, period) => {
					if (res == true) return true;
					if ((startedDate.getTime() > period.start.getTime())
						&& (startedDate.getTime() < period.end.getTime()))
						return true;
					return false;
				},
				false
			);
		};

		return worklogsJson.worklogs.filter(
			worklogJson => isWorkLogPartOfSprint(worklogJson, periods)
		).map(
			(worklogJson): WorkLog => ({
				author: worklogJson.author.displayName,
				date: new Date(worklogJson.started),
				timeSpent: worklogJson.timeSpentSeconds
			})
		);

	};

	private readonly calculateUsersInfo = (issues: Array<Issue>): Array<User> => {

		// Calculate work spent for each user
		const worklogs = flatMap(issues, issue => issue.worklogs);
		const usersMap = worklogs.reduce(
			(summary, worklog) => {
				const userTimeSpent = orElse(summary.get(worklog.author), () => 0);
				return new Map([
					...summary,
					[worklog.author, userTimeSpent + worklog.timeSpent]
				]);
			},
			new Map<string, number>()
		);

		const users = Array.from(usersMap).map(
			([key, value]): User => {
				return {
					name: key,
					timeSpent: value
				}
			}
		);

		return users;
	};

}

