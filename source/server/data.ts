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

// Calculate sprint estimate.
// Value is taken from:
// - original estimate
// - remaining estimate (if different than original estimate) and there are no remaining estimate changes in changelog.
// - last remaining estimate change in changelog before issue is part of sprint.
const calculateSprintEstimate = (issue, periods) => {
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

const calculateIssueAvailabiltyInSprint = (issue, sprintName, sprintStartDate, sprintEndDate) => {

    console.log(`Checking periods for ${issue.key}`);
    let periods = calculateSprintMembershipPeriods(issue, sprintName, sprintEndDate);
    periods.forEach(period => {
        console.log(" Period  : " + JSON.stringify(period));
    });

    periods = clipWithSprintPeriod(periods, sprintStartDate, sprintEndDate);
    periods.forEach(period => {
        console.log(" Clipped : " + JSON.stringify(period));
    });

    return periods
}

const getRHTeamBoard = async (init, config) => {
    console.log("Gettting boards from JIRA...");
    // Get all boards
    const boardsResponse = await fetch(`${config.jiraURL}/rest/greenhopper/1.0/rapidview`, init);
    const boardsJson = await boardsResponse.json();
    console.log("Received boards from JIRA.");
    const view = boardsJson.views.find(view => view.name === "MVAP - Team RafalH");
    return { id: view.id, name: view.name };
}

const getLatestSprintFromBoard = async (init, config, boardId) => {
    console.log("Gettting sprints from JIRA...");
    // Get all sprints for board
    const sprintsResponse = await fetch(`${config.jiraURL}/rest/greenhopper/1.0/sprintquery/${boardId}`, init);
    const sprintsJson = await sprintsResponse.json();
    console.log("Received sprints from JIRA.");
    const sprintJson = sprintsJson.sprints[sprintsJson.sprints.length - 1];
    return sprintJson;
}

const getIssuesFromSprint = async (init, config, sprintName) => {
    console.log("Getting sprint issues from JIRA...");
    const query = encodeURIComponent(`sprint="${sprintName}"`);
    const fields = "summary,timetracking,created,customfield_11869,status,priority,issuetype,parent,assignee";
    const expand = "changelog";
    const maxResults = 99999;
    const searchResponse =  await fetch(`${config.jiraURL}/rest/api/2/search?jql=${query}&fields=${fields}&expand=${expand}&maxResults=${maxResults}`, init);
    const searchJson = await searchResponse.json();
    console.log("Received sprint issues from JIRA.");
    return searchJson;
}

const getSprintReport = async (init, config, boardId, sprintId) => {
    console.log("Getting sprint report from JIRA...");
    const reportResponse = await fetch(`${config.jiraURL}/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=${boardId}&sprintId=${sprintId}`, init);
    const reportJson = await reportResponse.json();
    console.log("Received sprint report from JIRA.");
    return reportJson;
}

const getIssueWorklog = async (init, config, issue) => {
    console.log(`Getting worklog from JIRA for issue ${issue.key} ...`);
    const worklogResponse = await fetch(`${config.jiraURL}/rest/api/2/issue/${issue.key}/worklog`, init);
    const worklogJson = await worklogResponse.json();
    console.log(`Received worklog from JIRA for issue ${issue.key}.`);
    return worklogJson;
}

export const getData = async (config: Config) => {

    console.log("Getting sprint data from JIRA...");

    // fetch does not directly support Basic HTTP authentication. Therefore provide calculated token.
    const init = {
        headers: {
            'Authorization': 'Basic ' + config.jiraBasicAuthToken
        }
    };

    const boardJson = await getRHTeamBoard(init, config);
    const boardId = boardJson.id;
    const boardName = boardJson.name;

    const sprintJson = await getLatestSprintFromBoard(init, config, boardId);
    const sprintId = sprintJson.id;
    const sprintName = sprintJson.name;

    let summaryIssueTimeSpent = {};

    const [searchJson, reportJson] = await Promise.all([
        getIssuesFromSprint(init, config, sprintName),
        getSprintReport(init, config, boardId, sprintId)
    ]);

    const sprintStartDate = new Date(reportJson.sprint.startDate.toString());
    const sprintEndDate = new Date(reportJson.sprint.endDate.toString());

    // Generate issues model for React's component
    const issues = searchJson.issues.map(issue => {
        console.log(`----------------------------------------------------------------`);
        console.log(`Calculation for (${issue.key}) created (${issue.fields.created})`);


        let issueToCheck = issue;

        // For subtasks use parent issue availability
        if (issue.fields.issuetype.subtask) {
            issueToCheck = searchJson.issues.find(
                parentIssue => issue.fields.parent.key === parentIssue.key
            )
        }

        const periods = calculateIssueAvailabiltyInSprint(issueToCheck, sprintName, sprintStartDate, sprintEndDate);

        const sprintEstimate = calculateSprintEstimate(issue, periods);

        return {
            key: issue.key,
            parent: issue.fields.parent ? issue.fields.parent.key : "",
            url: `${config.jiraURL}/browse/${issue.key}`,
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

    const worklogJsons = await Promise.all(
        issues.map(issue => getIssueWorklog(init, config, issue))
    );


    const resultIssues = issues.zip(worklogJsons).map(
        ([issue, worklogJson]) => {

            console.log(`----------${issue.key}----------------------------------------------------------`);
            console.log(`Periods  : ${JSON.stringify(issue.periods)}`);

            const sprintTimeSpent = worklogJson.worklogs.map(
                worklog => Object.assign({}, worklog, {startedDate: new Date(worklog.started)})
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
                    sprintTimeSpent: sprintTimeSpent,
                    sprintWorkRatio: sprintWorkRatio
                })
        }
    );

    console.log('>>>>>>>>>>>>>.individualTimeSpent : ', summaryIssueTimeSpent);


    const result = {
        boardName: boardName,
        sprintName: sprintName,
        startDate: sprintStartDate,
        endDate: sprintEndDate,
        issues: resultIssues, // organize(resultIssues),
        summary: summaryIssueTimeSpent
    }

    return result;




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
