// src/app/_models/class-schedule.ts
export interface ClassSchedule {
    moduleCode: string;
    moduleName: string;
    semester: number;
    classVenue?: string;
    weekDays: string[];      // updated to array
    startTimes: string[];    // updated to array
    endTimes: string[];      // updated to array
}
