import fetch from 'node-fetch';

import { Sprint, Issue, WorkLog, User, BoardId, SprintId } from '../common/model';
import { numberOr } from '../common/utils';
import { IssueSource } from "./issue-source";

export class JiraIssueSource implements IssueSource {

    private readonly init;

    constructor(
        private readonly jiraURL: string,
        private readonly basicAuthToken: string) {
        this.init = {
            headers: {
                'Authorization': 'Basic ' + this.basicAuthToken
            }
        };
    }

    public readonly fetchLatestSprint = async (): Promise<Sprint> => {
        console.log("Getting sprint data from JIRA...");

        const boardJson = await this.fetchRHTeamBoard();
        const boardId = boardJson.id;
        const boardName = boardJson.name;

        const sprintJson = await this.fetchLatestSprintFromBoard(boardId);
        const sprintId = sprintJson.id;
        const sprintName = sprintJson.name;

        const [searchJson, reportJson] = await Promise.all([
            this.fetchIssuesFromSprint(sprintName),
            this.fetchSprintReport(boardId, sprintId)
        ]);

        const sprintStartDate = new Date(reportJson.sprint.startDate.toString());
        const sprintEndDate = new Date(reportJson.sprint.endDate.toString());

        const worklogJsons = await Promise.all(
            searchJson.issues.map(issueJson => this.fetchIssueWorklog(issueJson.key))
        );

        const issues = searchJson.issues.zip(worklogJsons).map(
            ([issueJson, worklogJson]): Issue => {

                console.log(`-- ${issueJson.key} ----------------------------------------------------------`);

                let issueToCheck = issueJson;

                // For subtasks use parent issue availability
                if (issueJson.fields.issuetype.subtask) {
                    issueToCheck = searchJson.issues.find(
                        parentIssue => issueJson.fields.parent.key === parentIssue.key
                    )
                }

                const periods = this.calculateIssueAvailabilityInSprint(issueToCheck, sprintName, sprintStartDate, sprintEndDate);
                console.log(`periods  : ${JSON.stringify(periods)}`);

                const sprintEstimate = this.calculateSprintEstimate(issueJson, periods);
                console.log(`sprintEstimate  : ${sprintEstimate}`);

                const worklogs = this.calculateWorkLogsInSprint(worklogJson, periods);

                const sprintTimeSpent = worklogs.reduce((sum, worklog) => sum + worklog.timeSpent, 0);
                console.log(`sprintTimeSpent  : ${sprintTimeSpent}`);

                const sprintWorkRatio =
                    (sprintTimeSpent == 0 || sprintEstimate == 0) ? 0 : Math.floor((sprintTimeSpent / sprintEstimate) * 100);

                return {
                    key: issueJson.key,
                    parent: issueJson.fields.parent ? issueJson.fields.parent.key : null,
                    children: null,
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


        const issuesWithChildren = issues.filter(
            issue => issue.parent == null
        ).map(
            issue => {
                const children = issues.filter(child => issue.key === child.parent )
                return { ...issue, children: children}
            }
        )

        return {
            board: { id: boardId, name: boardName },
            sprint: { id: sprintId, name: sprintName },
            startDate: sprintStartDate,
            endDate: sprintEndDate,
            issues: issuesWithChildren,
            users: users
        }

    }

    public readonly fetchBoards = async () : Promise<Array<BoardId>> => {
        console.log("Gettting boards from JIRA...");
        // Get all boards
        const boardsResponse = await this.fetchFromJira(`/rest/greenhopper/1.0/rapidview`);
        const boardsJson = await boardsResponse.json();
        console.log("Received boards from JIRA.");
        const boards = boardsJson.views.map(
            viewJson => ({
                id: viewJson.id,
                name: viewJson.name,
            })
        );
        return boards;
    }

    public readonly fetchSprintsFromBoard = async (boardId : string) : Promise<Array<SprintId>> => {
        console.log("Gettting sprints from JIRA...");
        // Get all sprints for board
        const sprintsResponse = await this.fetchFromJira(`/rest/greenhopper/1.0/sprintquery/${boardId}`);
        const sprintsJson = await sprintsResponse.json();
        console.log("Received sprints from JIRA.");
        const sprints = sprintsJson.sprints.map(
            sprint => ({
                id: sprint.id,
                name: sprint.name
            })
        );
        return sprints;
    }


    private readonly fetchFromJira = async (path: string) => {
        return await fetch(`${this.jiraURL}${path}`, this.init);
    }

    private readonly fetchRHTeamBoard = async () => {
        console.log("Gettting boards from JIRA...");
        // Get all boards
        const boardsResponse = await this.fetchFromJira(`/rest/greenhopper/1.0/rapidview`);
        const boardsJson = await boardsResponse.json();
        console.log("Received boards from JIRA.");
        const view = boardsJson.views.find(view => view.name === "MVAP - Team RafalH");
        return {id: view.id, name: view.name};
    }

    private readonly fetchLatestSprintFromBoard = async (boardId) => {
        console.log("Gettting sprints from JIRA...");
        // Get all sprints for board
        const sprintsResponse = await this.fetchFromJira(`/rest/greenhopper/1.0/sprintquery/${boardId}`);
        const sprintsJson = await sprintsResponse.json();
        console.log("Received sprints from JIRA.");
        const sprintJson = sprintsJson.sprints[sprintsJson.sprints.length - 1];
        return sprintJson;
    }

    private readonly fetchIssuesFromSprint = async (sprintName) => {
        console.log("Getting sprint issues from JIRA...");
        const query = encodeURIComponent(`sprint="${sprintName}"`);
        const fields = "summary,timetracking,created,customfield_11869,status,priority,issuetype,parent,assignee";
        const expand = "changelog";
        const maxResults = 99999;
        const searchResponse =
            await this.fetchFromJira(`/rest/api/2/search?jql=${query}&fields=${fields}&expand=${expand}&maxResults=${maxResults}`);
        const searchJson = await searchResponse.json();
        console.log("Received sprint issues from JIRA.");
        return searchJson;
    }

    private readonly fetchSprintReport = async (boardId, sprintId) => {
        console.log("Getting sprint report from JIRA...");
        const reportResponse = await
            this.fetchFromJira(`/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`);
        const reportJson = await reportResponse.json();
        console.log("Received sprint report from JIRA.");
        return reportJson;
    }

    private readonly fetchIssueWorklog = async (issueKey) => {
        console.log(`Getting worklog from JIRA for issue ${issueKey} ...`);
        const worklogResponse = await this.fetchFromJira(`/rest/api/2/issue/${issueKey}/worklog`);
        const worklogJson = await worklogResponse.json();
        console.log(`Received worklog from JIRA for issue ${issueKey}.`);
        return worklogJson;
    }


    private readonly clipWithSprintPeriod = (periods, sprintStart, sprintEnd) => {
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
                const start =  (period.start.getTime() < sprintStart.getTime()) ? sprintStart : period.start;
                const end =  (period.end.getTime() > sprintEnd.getTime()) ? sprintEnd : period.end;
                return { start: start, end: end };
            }
        )
    };

    private readonly  calculateSprintMembershipPeriods = (issue, sprintName, issueEnded) => {

        const inSprint = (sprintName) => {
            if (issue.fields.customfield_11869) {
                return issue.fields.customfield_11869.reduce((res, item) => item.includes(sprintName), false)
            }	else {
                return false;
            }
        }

        const points = issue.changelog.histories.map(
            history => {
                const item = history.items.filter(item => item.field === "Sprint")[0];
                if (item) {
                    const point = {
                        createdDate: new Date(history.created),
                        fromCurrentSprint: item.fromString ? item.fromString.includes(sprintName) : false,
                        toCurrentSprint: item.toString ? item.toString.includes(sprintName) : false,
                        initial: false
                    }

                    // Avoid Sprint field modifications that do not change membership in searched sprint.
                    if (point.fromCurrentSprint && point.toCurrentSprint)
                        return null;

                    return point;
                } else {
                    return null;
                }
            }
        ).filter(
            point => point != null
        )

        if ((points.length == 0) && inSprint(sprintName)) {
            return [{ start: new Date(issue.fields.created), end: issueEnded }]
        }

        const periods = points.map(
            (currentPoint, index, points) => {
                const previousPoint = points[index - 1];

                if ((index == 0) && currentPoint.fromCurrentSprint) {
                    return { start: new Date(issue.fields.created), end: currentPoint.createdDate };
                } else if ((index == (points.length-1)) && currentPoint.toCurrentSprint) {
                    return { start: currentPoint.createdDate, end: issueEnded };
                } else if ((index > 0) && previousPoint.toCurrentSprint && currentPoint.fromCurrentSprint) {
                    return { start: previousPoint.createdDate, end: currentPoint.createdDate };
                } else {
                    return null;
                }
            }
        ).filter(
            period => period != null
        )

        return periods;

    };

    // Calculate sprint estimate.
    // Value is taken from:
    // - original estimate
    // - remaining estimate (if different than original estimate) and there are no remaining estimate changes in changelog.
    // - last remaining estimate change in changelog before issue is part of sprint.
    private readonly calculateSprintEstimate = (issue, periods) => {
        const issueInSprintStartDate = periods[0].start;

        const remainingEstimateChanges = issue.changelog.histories.map(
            history => {
                return {
                    date: new Date(history.created),
                    estimate: history.items.reduce(
                        (estimate, item) => {
                            if (item.field === "timeestimate")
                                return Number.parseInt(item.to);
                            else
                                return estimate;
                        }, null
                    )
                }
            }
        ).filter(
            change => change.estimate !== null
        );
        console.log(`Remaining estimate changes : ${JSON.stringify(remainingEstimateChanges)}`);

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
    }

    // Calculate issue availability periods in sprint.
    private readonly  calculateIssueAvailabilityInSprint = (issue, sprintName, sprintStartDate, sprintEndDate) => {

        console.log(`Checking periods for ${issue.key}`);
        let periods = this.calculateSprintMembershipPeriods(issue, sprintName, sprintEndDate);
        periods.forEach(period => {
            console.log(" Period  : " + JSON.stringify(period));
        });

        periods = this.clipWithSprintPeriod(periods, sprintStartDate, sprintEndDate);
        periods.forEach(period => {
            console.log(" Clipped : " + JSON.stringify(period));
        });

        return periods
    }

    private readonly calculateWorkLogsInSprint = (worklogJson, periods): Array<WorkLog> => {

        const isWorkLogPartOfSprint = (worklogJson, periods) => {
            const startedDate = new Date(worklogJson.started);
            return periods.reduce(
                (res, period) => {
                    if (res == true) return true;
                    if ((startedDate.getTime() > period.start.getTime())
                        && (startedDate.getTime() < period.end.getTime()))
                        return true;
                },
                false
            );
        };

        return worklogJson.worklogs.filter(
            worklogJson => isWorkLogPartOfSprint(worklogJson, periods)
        ).map(
            (worklogJson) : WorkLog => ({
                author: worklogJson.author.displayName,
                date: new Date(worklogJson.started),
                timeSpent: worklogJson.timeSpentSeconds
            })
        );

    }

    private readonly calculateUsersInfo = (issues: Array<Issue>) : Array<User> => {

        // Calculate work spent for each user
        const usersMap = issues.flatMap(
            issue => issue.worklogs
        ).reduce(
            (summary: Map<string, number>, worklog) => {
                const timeSpent = summary.has(worklog.author) ? summary.get(worklog.author) + worklog.timeSpent : 0;
                return new Map([...summary, [worklog.author, timeSpent]]);
            },
            new Map<string, number>()
        );

        const users = Array.from(usersMap).map(
            ([key, value]) : User => {
                return {
                    name: key,
                    timeSpent: value
                }
            }
        );

        return users;
    }

}

