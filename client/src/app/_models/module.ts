export interface Module {
    id: number;
    moduleCode: string;
    moduleName: string;
    semester: number;

    classVenue?: string;

    weekDays?: string[];      // e.g. ['Monday', 'Wednesday']
    startTimes?: string[];    // e.g. ['08:00:00', '10:00:00']
    endTimes?: string[];      // e.g. ['09:00:00', '11:00:00']

    test1Venue?: string;
    test1Date?: string;
    test1StartTime?: string;
    test1EndTime?: string;

    test2Venue?: string;
    test2Date?: string;
    test2StartTime?: string;
    test2EndTime?: string;

    supplementaryVenue?: string;
    supplementaryDate?: string;
    supplementaryStartTime?: string;
    supplementaryEndTime?: string;
}
