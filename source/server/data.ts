import fetch from 'node-fetch';

import { Config } from './config';

Array.prototype.zip = function (array) {
    return this.map( (element, index) => [element, array[index]]);
}

const isPartOfSprint = (worklog, periods) => {
    return periods.reduce(
        (res, period) => {
            if (res == true) return true;
            if ((worklog.startedDate.getTime() > period.start.getTime())
                && (worklog.startedDate.getTime() < period.end.getTime()))
                return true;
        },
        false
    );
};

const numberOr = (valueToCheck, alternative) => {
    if (Number.isInteger(valueToCheck))
        return valueToCheck;
    else
        return alternative;
};

const addUserTimeSpent = (summary, worklog) => {
    if (!summary[worklog.author.name]) {
        summary[worklog.author.name] = {};
        summary[worklog.author.name].sum = 0;
        summary[worklog.author.name].name = worklog.author.name;
        summary[worklog.author.name].displayName = worklog.author.displayName;
    }

    summary[worklog.author.name].sum = summary[worklog.author.name].sum + worklog.timeSpentSeconds;
};

const clipWithSprintPeriod = (periods, sprintStart, sprintEnd) => {
    return periods.filter(
        // Get rid of periods completely outside of sprint.
        period => {
            if ((period.end.getTime() < sprintStart.getTime()) || (period.start.getTime() > sprintEnd.getTime()))
                return false;
            else
                return true;
        }
    ).map(
        // Fix periods partly in sprint.
        period => {
            const start =  (period.start.getTime() < sprintStart.getTime()) ? sprintStart : period.start;
            const end =  (period.end.getTime() > sprintEnd.getTime()) ? sprintEnd : period.end;
            return { start: start, end: end };
        }
    )
};

const calculateSprintMembershipPeriods = (issue, sprintName, issueEnded) => {

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

const getBoard = async (init, config) => {
    // Get all boards
    const boardsResponse = await fetch(`${config.jiraURL}/rest/greenhopper/1.0/rapidview`, init);

    console.log("Got rapid : ");
    const boardsJson = await boardsResponse.json();
    console.log("Got rapid json : ");
    const view = boardsJson.views.find(view => view.name === "MVAP - Team RafalH");
    return { id: view.id, name: view.name };
}




export const getData = async (config: Config) => {

    console.log("Gettting data...");

    // fetch does not directly support Basic HTTP authentication. Therefore provide calculated token.
    const init = {
        headers: {
            'Authorization': 'Basic ' + config.jiraBasicAuthToken
        }
    };

    let sprintId = 0;
    let sprintName = "";
    let startDate = null;
    let endDate = null;
    let summaryIssueTimeSpent = {};

    const board = await getBoard(init, config);

    // Get all sprint for board
    const sprintsResponse = await fetch(`${config.jiraURL}/rest/greenhopper/1.0/sprintquery/${board.id}`, init);
    const sprintsJson = await sprintsResponse.json();
    console.log("Received");

            const sprint = sprintsJson.sprints[sprintsJson.sprints.length - 1];
            sprintId = sprint.id;
            sprintName = sprint.name;

            // https://127.0.0.1:8888/rest/api/2/search?jql=sprint+%3D+%22FIP-RafalH+32%22&fields=summary,timetracking,created,customfield_11869,status,priority,issuetype,parent&expand=changelog&maxResults=99999
            const query = encodeURIComponent(`sprint="${sprint.name}"`);
            const fields = "summary,timetracking,created,customfield_11869,status,priority,issuetype,parent,assignee";
            const expand = "changelog";
            const maxResults = 99999;

    // Get issues belonging to sprint and sprint report with start and end dates
    return Promise.all([
                fetch(`${config.jiraURL}/rest/api/2/search?jql=${query}&fields=${fields}&expand=${expand}&maxResults=${maxResults}`,	init),
                fetch(`${config.jiraURL}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${board.id}&sprintId=${sprintId}`,	init)
    ]).then(

        ([searchResponse, reportResponse]) => Promise.all([searchResponse.json(), reportResponse.json()])

    ).then(

        ([searchJson, reportJson]) => {
            startDate = new Date(reportJson.sprint.startDate.toString());
            endDate = new Date(reportJson.sprint.endDate.toString());

            // Generate issues model for React's component
            const issues = searchJson.issues.map(issue => {
                console.log(`----------------------------------------------------------------`);
                console.log(`Calculation for (${issue.key}) created (${issue.fields.created})`);

                // Calculate issue availability periods in sprint.

                let issueToCheck = issue;

                // For subtasks use parent issue availability
                if (issue.fields.issuetype.subtask) {
                    issueToCheck = searchJson.issues.find(
                        parentIssue => issue.fields.parent.key === parentIssue.key
                    )
                }

                console.log(`Checking periods for ${issueToCheck.key}`);
                let periods = calculateSprintMembershipPeriods(issueToCheck, sprintName, endDate);
                periods.forEach(period => {
                    console.log(" Period  : " + JSON.stringify(period));
                });

                periods =  clipWithSprintPeriod(periods, startDate, endDate);
                periods.forEach(period => {
                    console.log(" Clipped : " + JSON.stringify(period));
                });

                const issueInSprintStartDate = periods[0].start;

                // Calculate sprint estimate.
                // Value is taken from:
                // - original estimate
                // - remaining estimate (if different than original estimate) and there are no remaining estimate changes in changelog.
                // - last remaining estimate change in changelog before issue is part of sprint.
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

                return {
                    key: issue.key,
                    parent: issue.fields.parent ? issue.fields.parent.key : "",
                    url: `https://${config.jiraHost}/browse/${issue.key}`,
                    priorityIconUrl: issue.fields.priority.iconUrl,
                    issuetypeIconUrl: issue.fields.issuetype.iconUrl,
                    assignee: issue.fields.assignee.displayName,
                    assigneeId: issue.fields.assignee.name,
                    summary: issue.fields.summary,
                    originalEstimate: numberOr(issue.fields.timetracking.originalEstimateSeconds, 0),
                    timeSpent: numberOr(issue.fields.timetracking.timeSpentSeconds, 0),
                    remainingEstimate: numberOr(issue.fields.timetracking.remainingEstimateSeconds, 0),
                    sprintEstimate: sprintEstimate,
                    status: issue.fields.status.name,
                    periods: periods
                }
            });

            return Promise.all(
                [issues, ...searchJson.issues.map(issue => fetch(`${config.jiraURL}/rest/api/2/issue/${issue.key}/worklog`, init))]
            );

        }

    ).then(

        ([issues, ...worklogResponses]) =>
            Promise.all([issues, ...worklogResponses.map(worklogResponse => worklogResponse.json()) ])

    ).then(
        ([issues, ...worklogJsons]) => {

            const resultIssues = issues.zip(worklogJsons).map(
                ([issue, worklogJson]) => {

                    console.log(`----------${issue.key}----------------------------------------------------------`);
                    console.log(`Periods  : ${JSON.stringify(issue.periods)}`);

                    const sprintTimeSpent = worklogJson.worklogs.map(
                        worklog => Object.assign({}, worklog, { startedDate : new Date(worklog.started) })
                    ).filter(
                        worklog => {
                            console.log(`log - ${worklog.timeSpentSeconds} - ${worklog.startedDate}`);
                            const res = isPartOfSprint(worklog, issue.periods);
                            //const res =  (worklog.startedDate.getTime() > startDate.getTime()) && (worklog.startedDate.getTime() < endDate.getTime())
                            if (res) {
                                addUserTimeSpent(summaryIssueTimeSpent, worklog);
                            }
                            return res;
                        }
                    ).reduce(
                        (sum, worklog) => sum + worklog.timeSpentSeconds
                        , 0
                    );
                    console.log(`Worklogs sum for : ${sprintTimeSpent}`);

                    const sprintWorkRatio =
                        (sprintTimeSpent == 0 || issue.sprintEstimate == 0) ? 0 : Math.floor((sprintTimeSpent / issue.sprintEstimate) * 100);

                    return Object.assign(
                        {}, issue,
                        {
                            sprintTimeSpent : sprintTimeSpent,
                            sprintWorkRatio : sprintWorkRatio
                        })
                }
            );

            console.log('>>>>>>>>>>>>>.individualTimeSpent : ', summaryIssueTimeSpent);


            const result = {
                boardName: board.name,
                sprintName: sprintName,
                startDate: startDate,
                endDate: endDate,
                issues: resultIssues, // organize(resultIssues),
                summary: summaryIssueTimeSpent
            }

            return result;


        }
    )

}

const organize = (issues) => {
    let map = {};
    for (let i = 0; i < issues.length; ++i) {
        let issue = issues[i];
        map[issue.key] = i;
        issue.children  = [];
    }

    let roots = [];
    for (let i = 0; i < issues.length; ++i) {
        let issue = issues[i];
        issue.children = [];
        if (issue.parent !== "") {
            let parentIndex = map[issue.parent];
            if (parentIndex !== undefined) {
                issues[parentIndex].children.push(issue);
            } else {
                roots.push(issue);
            }
        } else {
            roots.push(issue);
        }
    }

    issues.splice(0, issues.length);
    issues.push.apply(issues, roots);

    // group by assignee
    roots.sort((a, b) => -a.assigneeId.localeCompare(b.assigneeId));

    let toRender = [];
    roots.map( (root) => {
        if (root.children.length > 0) {
            toRender.push(root);
            root.children.map( (child) => {
                toRender.push(child);
            })
        } else {
            toRender.unshift(root);
        }
    });
    return toRender;
}
