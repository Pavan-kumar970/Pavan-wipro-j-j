import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

sendMessage(prompt: string): Observable<any> {
  return this.http.post('http://localhost:5000/chat', { prompt });  // 👈 not { message }
}

}
