import { Module } from './module';

export interface User {
    userNumber: string;
    name: string;
    surname: string;
    email: string;
    token: string;
    roles: string[];
    modules: Module[]; // ✅ This line fixes the error
}
