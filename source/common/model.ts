export interface ClientConfig {

}

export interface Sprint {
    boardName: string;
    sprintName: string;
    startDate: Date;
    endDate: Date;
    issues: Array<Issue>;
    summary: Array<any>;
}


export interface Issue {
    key: string;
    parent: string;
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
}

