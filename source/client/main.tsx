//import './styles/index.scss';
import { h, app } from "hyperapp";
// import { div, h1, button } from "@hyperapp/html"

// import TimeTable from './timeTable.tsx';
import { readableDuration } from './utils';
import { getData } from './data';

const state = {
    config: {},
	data: {
        boardName: "",
        sprintName: "",
        startDate: "",
        endDate: "",
        sprintTimeSpent: 0,
        issues: [],
        summary: {}
	}
}


const actions = {
	loadData: () => async (state, actions) => {
        console.log("Loading configuration ...");
        const configJson = await fetch('/config');
        const config = await configJson.json();
        actions.updateConfig(config);

        console.log("Loading data ...");
		const result = await getData(config);
		console.log("after loadData");
		actions.updateData(result);
	},
    updateConfig: config => state => {
        console.log("Config updated.")
        return { config: config };
    },
	updateData: data => state => {
		console.log("Data updated.")
        return { data: data };
	},
}

const view = (state, actions) => (
    <div className="container-fluid">
    <div oncreate={actions.loadData}>

        <div>

            <div className="columns">
                <div className="column">
                    <span id="logo">Szpion</span>
                    <span> Daily Sprint Invigilation</span>
                </div>
                <div className="column">
                    Board: <span>{ state.data.boardName }</span><br/>
                    Sprint: <span>{ state.data.sprintName }</span><br/>
                </div>
                <div className="column">
                    Sprint issues : { state.data.issues.filter(issue => !partof(issue.status, "Closed")).length }<br/>
                    Sprint issues completed : { state.data.issues.filter(issue => partof(issue.status, "Closed")).length }<br/>
                    Sprint issues not started : { countNotStarted(state.data.issues.filter(issue => partof(issue.status, "Open"))) }<br/>
                </div>
                <div className="column">
                    Start date: <span>{ readableTime(state.data.startDate) }</span><br/>
                    End date: <span>{ readableTime(state.data.endDate) }</span><br/>
                </div>
                <div className="column">
                    Sprint estimate : { readableDuration(state.data.issues.reduce((sum, issue) => sum + issue.sprintEstimate, 0)) }<br/>
                    Sprint time spent : { readableDuration(state.data.issues.reduce((sum, issue) => sum + issue.sprintTimeSpent, 0)) }<br/>
                    Sprint remaining estimate : { readableDuration(state.data.issues.reduce((sum, issue) => sum + issue.remainingEstimate, 0)) }<br/>
                </div>
            </div>

            <IssuesTable
                issues={ state.data.issues.filter(issue => !partof(issue.status, "Closed")).sort((a, b) => a.parent.localeCompare(b.parent)) } />

            <h3>Closed</h3>
            <IssuesTable
                issues={ state.data.issues.filter(issue => partof(issue.status, "Closed")).sort((a, b) => a.parent.localeCompare(b.parent)) } />


            <h3>Time spent in sprint</h3>
            <TimeTable summary={ state.data.summary } />

		</div>


    </div>
    </div>
)



app(state, actions, view, document.body);

const organize = (issues) => {
    let map = {};
    for (let i = 0; i < issues.length; ++i) {
        let issue = issues[i];
        map[issue.key] = i;
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


const IssuesTable = ({ issues }) => {

    const issuesOrganized = organize(issues);

    return(
        <table className="table is-striped is-narrow is-fullwidth">
            <thead>
            <tr>
                <th>T</th>
                <th>Issue</th>
                <th>Parent</th>
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
            <tbody>
            {issuesOrganized.map(issue =>
                <tr key={issue.key} className={issue.children.length > 0 ? "parent-issue" : ""}>
                    <td><img src={issue.issuetypeIconUrl}/></td>
                    <td className="text-nowrap"><a href={issue.url}>{issue.key}</a></td>
                    <td className="text-nowrap">{issue.parent}</td>
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
            )}
            </tbody>
        </table>
    )

}


const readableTime = (date) => {
	return date.toLocaleString('pl', { hour12: false });
};

const calculateStatusClass = (status) => {
	if (status === "Implemented" || status === "Resolved") {
		return "finished";
	} else if (status === "In Progress") {
		return "in-progress";
	}
	return '';
};

const countNotStarted = (issues) => {
	return issues.filter(issue => partof(issue.status, "Open") && (!issue.children || issue.children.length === 0)).length;
};

const partof = (toCheck, ...elements) => {
	if (elements.find(element => element === toCheck))
		return true;
	else
		return false;
};


const TimeTable = ({summary}) => {

    return (
        <table>
            <thead>
            <tr>
                <th>Who</th>
                <th>Time spent</th>
            </tr>
            </thead>
            <tbody>
            {Object.keys(summary).map(key =>
                <tr key={key}>
                    <td className={`user-${key} col-md-1`}>{summary[key].displayName}</td>
                    <td className={`user-${key} col-md-6`}>{readableDuration(summary[key].sum)}</td>
                </tr>
            )}

            </tbody>
        </table>
    )

}
