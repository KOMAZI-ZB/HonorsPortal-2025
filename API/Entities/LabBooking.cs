using System;

namespace API.Entities;

public class LabBooking
{
    public int Id { get; set; }

    public string UserNumber { get; set; } = string.Empty;

    public string WeekDays { get; set; } = string.Empty; // Monday–Saturday

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public DateOnly BookingDate { get; set; }

}

