export interface Announcement {
    id: number;
    type: string;
    title: string;
    message: string;
    imagePath?: string | null;
    createdBy: string;
    createdAt: string;
    moduleId?: number | null;
}
