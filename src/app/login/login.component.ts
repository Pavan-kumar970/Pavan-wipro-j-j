import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  @Output() loginSuccess = new EventEmitter<{ success: boolean; user: string }>();

  private readonly USER = 'Pavan';
  private readonly PASS = 'Test123';

  login() {
    if (this.username === this.USER && this.password === this.PASS) {
      this.loginSuccess.emit({ success: true, user: this.username });
    } else {
      this.error = '❌ Invalid username or password';
    }
  }
}
