export interface ClientConfig {
}

export interface Sprint {
    readonly id: number;
    readonly name: string;
}

export interface Board {
    readonly id: number;
    readonly name: string;
}

export interface SprintDetails {
    readonly board: Board;
    readonly sprint: Sprint;
    readonly startDate: string;
    readonly endDate: string;
    readonly estimate: number,
    readonly timeSpent: number,
    readonly remainingEstimate: number,
    readonly issuesCount: number,
    readonly completedIssuesCount: number,
    readonly issues: Array<Issue>;
    readonly users: Array<User>;
}

export interface Issue {
    readonly key: string;
    readonly parent: string | null;
    readonly children: Array<Issue>;
    readonly url: string;
    readonly priorityIconUrl: string;
    readonly issuetypeIconUrl: string;
    readonly assignee: string;
    readonly assigneeId: string;
    readonly summary: string;
    readonly status: string;
    readonly originalEstimate: number;
    readonly timeSpent: number;
    readonly remainingEstimate: number;
    readonly sprintEstimate: number;
    readonly sprintTimeSpent: number;
    readonly sprintWorkRatio: number;
    readonly periods: Array<any>;
    readonly worklogs: Array<WorkLog>;
}

export interface User {
    readonly name: string;
    readonly timeSpent: number;
}

export interface WorkLog {
    readonly author: string;
    readonly date: Date;
    readonly timeSpent: number;
}
