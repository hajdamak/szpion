export interface ClientConfig {
}

export interface SprintId {
    id: number;
    name: string;
}

export interface BoardId {
    id: number;
    name: string;
}

export interface Sprint {
    board: BoardId;
    sprint: SprintId;
    startDate: Date;
    endDate: Date;
    issues: Array<Issue>;
    users: Array<User>;
}

export interface Issue {
    key: string;
    parent: string | null;
    children: Array<Issue> | null;
    url: string,
    priorityIconUrl: string;
    issuetypeIconUrl: string;
    assignee: string;
    assigneeId: string;
    summary: string;
    status: string;
    originalEstimate: number;
    timeSpent: number;
    remainingEstimate: number;
    sprintEstimate: number;
    sprintTimeSpent: number;
    sprintWorkRatio: number;
    periods: Array<any>;
    worklogs: Array<WorkLog>;
}

export interface User {
    name: string;
    timeSpent: number;
}

export interface WorkLog {
    author: string;
    date: Date;
    timeSpent: number;
}

