import { AssessmentSchedule } from './assessment-schedule';
import { ClassSession } from './class-session';

export interface Module {
    id: number;
    moduleCode: string;
    moduleName: string;
    semester: number;

    // Legacy (no longer used by timetable rendering; safe to keep during transition)
    classVenue?: string;
    weekDays?: string[];    // e.g. ['Monday', 'Wednesday']
    startTimes?: string[];  // e.g. ['08:00:00', '10:00:00']
    endTimes?: string[];    // e.g. ['09:00:00', '11:00:00']

    // ✅ New: sessions per venue/day/time
    classSessions?: ClassSession[];

    assessments?: AssessmentSchedule[];
}