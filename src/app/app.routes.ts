// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ChatbotComponent } from './chatbot/chatbot.component';

export const routes: Routes = [
  { path: '', component: ChatbotComponent }, // default route
];
