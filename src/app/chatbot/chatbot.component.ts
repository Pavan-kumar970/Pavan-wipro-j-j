// chatbot.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as XLSX from 'xlsx';


interface TableData {
  headers: string[];
  rows: string[][];
}

interface Message {
  sender: 'user' | 'bot';
  text: string | TableData;
  type: 'text' | 'table';
  time: number;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
})
export class ChatbotComponent implements OnInit {
  @ViewChild('chatWindow') chatWindow!: ElementRef;

  messages: Message[] = [];
  userInput = '';
  loading = false;
  darkMode: boolean = false;
  excelData: any[] = [];   // stores JSON rows from excel
excelHeaders: string[] = [];


  serverStatus = 'Ready';

  // UI helpers for tables
  collapsedTables: Record<number, boolean> = {};
  tableSearch: Record<number, string> = {};
  originalTableStore: Record<number, TableData> = {};
  filteredTableStore: Record<number, TableData> = {};
  tableRowLimits: Record<number, number> = {};

  constructor(private chatService: ChatService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.addBotText('👋 Good to see you, Team J&J.');
  }

sanitizeHtml(content: string | TableData): any {
  if (typeof content === 'string') {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
  return ''; // fallback if it's not a string
}


  private addBotText(text: string) {
    this.messages.push({
      sender: 'bot',
      text,
      type: 'text',
      time: Date.now(),
    });
    this.scrollToBottom();
  }

  // get table data from message safely
  getTableData(msg: Message): TableData {
    return msg.type === 'table' ? (msg.text as TableData) : { headers: [], rows: [] };
  }

  // When send button pressed
sendMessage(): void {
  const prompt = this.userInput.trim();
  if (!prompt) return;

  // Push user message
  this.messages.push({
    sender: 'user',
    text: prompt,
    type: 'text',
    time: Date.now(),
  });

  this.userInput = '';
  this.loading = true;
  this.scrollToBottom();

  setTimeout(() => {
    let response: any;
    const query = prompt.toLowerCase();

    if (query.includes('all rows')) {
      response = {
        tableData: {
          headers: this.excelHeaders,
          rows: this.excelData,
        },
      };

    } else if (query.includes('summary')) {
      response = {
        answer: `This sheet has ${this.excelData.length} rows and ${this.excelHeaders.length} columns.`,
      };

    } else {
      // ✅ Extract keywords (allow words with at least 2 letters)
      const words = query.split(/\s+/).filter(w => w.length >= 2);

      // 🔎 Search rows that contain ANY of the keywords
      const rows = this.excelData.filter((row: string[]) =>
        words.some(word =>
          row.some((cell: string) =>
            (cell || '').toString().toLowerCase().includes(word)
          )
        )
      );

      if (rows.length > 0) {
        response = {
          tableData: {
            headers: this.excelHeaders,
            rows,
          },
        };
      } else {
        response = {
          answer: `❌ No matching data found for "${prompt}".`,
        };
      }
    }

    this.handleResponse(response);
  }, 1200);
}




  // Quick prompts
  quickPrompt(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  // table helpers
  isValidTable(t: any): t is TableData {
    return t && Array.isArray(t.headers) && Array.isArray(t.rows);
  }

  toggleTableCollapse(index: number) {
    this.collapsedTables[index] = !this.collapsedTables[index];
  }

  showMoreRows(index: number) {
    this.tableRowLimits[index] = (this.tableRowLimits[index] || 10) + 20;
  }

  filterTable(index: number) {
    const q = (this.tableSearch[index] || '').toLowerCase().trim();
    const src = this.originalTableStore[index];
    if (!src) return;
    if (!q) {
      this.filteredTableStore[index] = JSON.parse(JSON.stringify(src));
      this.replaceTableInMessage(index, this.filteredTableStore[index]);
      return;
    }

    const headers = src.headers;
    const rows = src.rows.filter((r) =>
      r.some((c) => ('' + c).toLowerCase().includes(q))
    );
    const filtered: TableData = { headers, rows };
    this.filteredTableStore[index] = filtered;
    this.replaceTableInMessage(index, filtered);
  }

  // replace table data inside messages[index]
  private replaceTableInMessage(index: number, table: TableData) {
    if (!this.messages[index]) return;
    if (this.messages[index].type === 'table') {
      this.messages[index].text = table;
    }
  }

  // copy table to clipboard
  copyTable(index: number) {
    const table = this.getTableFromIndex(index);
    if (!table) return;
    const csv = this.convertTableToCSV(table);
    navigator.clipboard.writeText(csv).then(() => {
      this.addBotText('✅ Table copied to clipboard.');
    }, () => {
      this.addBotText('⚠️ Unable to copy table to clipboard.');
    });
  }

  exportTableCSV(index: number) {
    const table = this.getTableFromIndex(index);
    if (!table) return;
    const csv = this.convertTableToCSV(table);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-export-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.addBotText('📥 CSV exported.');
  }

  private getTableFromIndex(index: number): TableData | null {
    if (!this.messages[index]) return null;
    const msg = this.messages[index];
    return msg.type === 'table' ? (msg.text as TableData) : null;
  }

  private convertTableToCSV(table: TableData) {
    const rows = [table.headers, ...table.rows];
    // Escape quotes and commas
    return rows.map(r => r.map(c => `"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n');
  }

  // Scroll to bottom
  private scrollToBottom() {
    try {
      setTimeout(() => {
        if (this.chatWindow && this.chatWindow.nativeElement) {
          this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight + 100;
        }
      }, 50);
    } catch {}
  }

  formatTime(ts: number) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onFileSelected(evt: any) {
  const file: File = evt.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e: any) => {
    const bstr: string = e.target.result;
    const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
    const wsname: string = wb.SheetNames[0];
    const ws: XLSX.WorkSheet = wb.Sheets[wsname];

    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    this.excelHeaders = data[0];         // first row
    this.excelData = data.slice(1);      // rest rows

    this.addBotText(`✅ File **${file.name}** loaded with ${this.excelData.length} rows and ${this.excelHeaders.length} columns. Now you can ask questions!`);
  };
  reader.readAsBinaryString(file);
}


  // clear chat
  clearChat() {
    this.messages = [];
    this.collapsedTables = {};
    this.tableSearch = {};
    this.originalTableStore = {};
    this.filteredTableStore = {};
    this.tableRowLimits = {};
    this.addBotText('Chat cleared. How can I help?');
  }

  toggleTheme() {
  this.darkMode = !this.darkMode;
}

private handleResponse(res: any) {
  if (res?.tableData && this.isValidTable(res.tableData)) {
    const table: TableData = res.tableData;
    const idx = this.messages.length;
    this.messages.push({
      sender: 'bot',
      text: table,
      type: 'table',
      time: Date.now(),
    });
    this.collapsedTables[idx] = false;
    this.tableSearch[idx] = '';
    this.originalTableStore[idx] = JSON.parse(JSON.stringify(table));
    this.filteredTableStore[idx] = JSON.parse(JSON.stringify(table));
    this.tableRowLimits[idx] = Math.min(10, table.rows.length);
  } else {
    const answer = res.answer || 'I could not find a suitable answer.';
    this.messages.push({
      sender: 'bot',
      text: answer,
      type: 'text',
      time: Date.now(),
    });
  }
  this.loading = false;
  this.scrollToBottom();
}


}
