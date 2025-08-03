import { AssessmentSchedule } from './assessment-schedule';

export interface Module {
    id: number;
    moduleCode: string;
    moduleName: string;
    semester: number;

    classVenue?: string;

    weekDays?: string[];      // e.g. ['Monday', 'Wednesday']
    startTimes?: string[];    // e.g. ['08:00:00', '10:00:00']
    endTimes?: string[];      // e.g. ['09:00:00', '11:00:00']

    assessments?: AssessmentSchedule[];
}
