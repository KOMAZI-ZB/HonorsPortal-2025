export interface LabBooking {
    id?: number; // Optional during creation
    userNumber?: string; // Optional when posting a new booking (filled on the server)
    weekDays: string;
    startTime: string;    // 'HH:mm' format
    endTime: string;      // 'HH:mm' format
    bookingDate: string;  // 'yyyy-MM-dd' format
    description?: string;

}
