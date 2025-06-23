export interface TestSchedule {
    moduleCode: string;
    moduleName: string;
    semester: number;
    testType?: string;    // "Test 1", "Test 2", "Supplementary"
    testDate?: string;    // e.g., "2025-07-20"
    startTime?: string;   // e.g., "10:00:00"
    endTime?: string;     // e.g., "11:00:00"
    venue?: string;
}
