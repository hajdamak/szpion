import {app} from "hyperapp";

import {State} from "../client/state";
import {Actions} from "../client/actions";
import {view} from "../client/view";

import {Server} from "../server/server";
import {readableDuration} from "../common/utils";

const server = new Server(8080, false, true);
const actions = new Actions();
actions.setServerURL(`http://localhost:8080`);
const initState = new State();

const getState = (app: Actions): State => {
	const state: any = app.getState();
	return state as State;
};

beforeAll(() => {
	server.start();
});

afterAll(() => {
	server.stop();
});

// 15m - 900
// 1h - 3600
// 2h - 7200
// 1d - 28800

test('Initialize application', async () => {
	const testApp = app(initState, actions, view, null);
	await testApp.init();
	const state = getState(testApp);

	expect(state.boards.length).toBe(3);
	expect(state.sprints.length).toBe(4);

	expect(state.sprintDetails).toBeDefined();
	if (state.sprintDetails) {

		expect(state.sprintDetails.issuesCount).toBe(6);
		expect(state.sprintDetails.completedIssuesCount).toBe(1);

		expect(readableDuration(state.sprintDetails.estimate)).toBe("16d 1h 45m");
		expect(readableDuration(state.sprintDetails.timeSpent)).toBe("3d");
		expect(readableDuration(state.sprintDetails.remainingEstimate)).toBe("13d 3h");

		// Check work logged outside of the sprint.
		const issueOutside = state.sprintDetails.issues.find(issue => issue.key === "WAP-12351");
		expect(issueOutside).toBeDefined();
		if (issueOutside) {
			expect(issueOutside.assignee).toBe("Kate Rubin");
			expect(readableDuration(issueOutside.originalEstimate)).toBe("3d");
			expect(readableDuration(issueOutside.timeSpent)).toBe("2d 1h 15m");
			expect(readableDuration(issueOutside.sprintEstimate)).toBe("2d 7h");
			expect(readableDuration(issueOutside.sprintTimeSpent)).toBe("1d 2h 15m");
			expect(readableDuration(issueOutside.remainingEstimate)).toBe("1d 4h 45m");
			expect(issueOutside.status).toBe("Implemented");
		}

		// Check zero work logged
		const issueZero = state.sprintDetails.issues.find(issue => issue.key === "WAP-12356");
		expect(issueZero).toBeDefined();
		if (issueZero) {
			expect(issueZero.assignee).toBe("John Smith");
			expect(readableDuration(issueZero.originalEstimate)).toBe("4d");
			expect(readableDuration(issueZero.timeSpent)).toBe("0m");
			expect(readableDuration(issueZero.sprintEstimate)).toBe("4d");
			expect(readableDuration(issueZero.sprintTimeSpent)).toBe("0m");
			expect(readableDuration(issueZero.remainingEstimate)).toBe("4d");
			expect(issueZero.sprintWorkRatio).toBe(0);
			expect(issueZero.status).toBe("Open");
		}

		// Check issue in sprint for periods
		const issuePeriod = state.sprintDetails.issues.find(issue => issue.key === "WAP-12352");
		expect(issuePeriod).toBeDefined();
		if (issuePeriod) {
			expect(issuePeriod.assignee).toBe("Kate Rubin");
			expect(readableDuration(issuePeriod.originalEstimate)).toBe("5d");
			expect(readableDuration(issuePeriod.timeSpent)).toBe("5h 15m");
			expect(readableDuration(issuePeriod.sprintEstimate)).toBe("3d 4h");
			expect(readableDuration(issuePeriod.sprintTimeSpent)).toBe("1h");
			expect(readableDuration(issuePeriod.remainingEstimate)).toBe("3d 3h");
			expect(issuePeriod.sprintWorkRatio).toBe(3);
			expect(issuePeriod.status).toBe("Implemented");
		}

		// Check issue in sprint before sprint starts
		const parent = state.sprintDetails.issues.find(issue => issue.key === "WAP-11739");
		expect(parent).toBeDefined();
		if (parent) {
			const issueInSpB = parent.children.find(issue => issue.key === "WAP-11742");
			expect(issueInSpB).toBeDefined();
			if (issueInSpB) {
				expect(issueInSpB.assignee).toBe("Fred Gavin");
				expect(readableDuration(issueInSpB.originalEstimate)).toBe("6d 4h");
				expect(readableDuration(issueInSpB.timeSpent)).toBe("2d 45m");
				expect(readableDuration(issueInSpB.sprintEstimate)).toBe("5d 5h");
				expect(readableDuration(issueInSpB.sprintTimeSpent)).toBe("1d 1h 45m");
				expect(readableDuration(issueInSpB.remainingEstimate)).toBe("4d 3h 15m");
				expect(issueInSpB.status).toBe("Closed");
			}

			const issueOver = parent.children.find(issue => issue.key === "WAP-11744");
			expect(issueOver).toBeDefined();
			if (issueOver) {
				expect(issueOver.assignee).toBe("John Smith");
				expect(readableDuration(issueOver.originalEstimate)).toBe("2h");
				expect(readableDuration(issueOver.timeSpent)).toBe("3h 15m");
				expect(readableDuration(issueOver.sprintEstimate)).toBe("1h 45m");
				expect(readableDuration(issueOver.sprintTimeSpent)).toBe("3h");
				expect(readableDuration(issueOver.remainingEstimate)).toBe("0m");
				expect(issueOver.sprintWorkRatio).toBe(171);
				expect(issueOver.status).toBe("Open");
			}

		}

	}

});
