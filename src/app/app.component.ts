import { Component } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  loggedIn = false;
  showPopup = false;
  username = '';

  handleLogin(success: boolean, user: string) {
    if (success) {
      this.loggedIn = true;
      this.username = user;
      this.showPopup = true;
      
      // Auto-close popup after 2.5s
      setTimeout(() => {
        this.showPopup = false;
      }, 2500);
    }
  }
}
