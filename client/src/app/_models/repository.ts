// src/app/_models/repository.model.ts

export interface Repository {
    id: number;
    label: string;       // e.g., "JoVE"
    imageUrl: string;    // e.g., "/assets/jove.png"
    linkUrl: string;     // e.g., "https://www.jove.com/"
}
