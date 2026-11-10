import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  incomeCount: number;
  expenseCount: number;
}

interface ReportResult {
  from: string;
  to: string;
  summary: FinancialSummary;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <header class="heading">
      <p class="eyebrow">HOUSEHOLD FINANCE</p>
      <h1>Financial reports</h1>
      <p>Review your income and spending for any date range.</p>
    </header>

    <form class="panel filters" #reportForm="ngForm" (ngSubmit)="generate()">
      <label>
        From date
        <input type="date" name="from" [(ngModel)]="from"
          min="2000-01-01" max="2100-12-31" required [disabled]="loading()">
      </label>

      <label>
        To date
        <input type="date" name="to" [(ngModel)]="to"
          min="2000-01-01" max="2100-12-31" required [disabled]="loading()">
      </label>

      <button type="submit" [disabled]="loading() || reportForm.invalid">
        {{ loading() ? 'Generating…' : 'Generate report' }}
      </button>
    </form>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    @if (result(); as report) {
      <section id="homebudget-print-report" class="panel report">
        <div class="report-heading">
          <div>
            <p class="eyebrow">HOMEBUDGET · OMR</p>
            <h2>Income and expense summary</h2>
            <p>
              {{ report.from | date:'dd MMM yyyy' }} –
              {{ report.to | date:'dd MMM yyyy' }}
            </p>
          </div>

          <button class="print-button" type="button" (click)="printReport()">
            Print / Save PDF
          </button>
        </div>

        <div class="metrics">
          <article class="metric">
            <h3>Total income</h3>
            <strong>{{ report.summary.totalIncome | number:'1.3-3' }} OMR</strong>
            <p>Income records: {{ report.summary.incomeCount }}</p>
          </article>

          <article class="metric">
            <h3>Total expenses</h3>
            <strong>{{ report.summary.totalExpenses | number:'1.3-3' }} OMR</strong>
            <p>Expense records: {{ report.summary.expenseCount }}</p>
          </article>

          <article class="metric net" [class.negative]="report.summary.netAmount < 0">
            <h3>Net cash flow</h3>
            <strong>{{ report.summary.netAmount | number:'1.3-3' }} OMR</strong>
            <p>Income minus expenses</p>
          </article>
        </div>

        @if (report.summary.incomeCount === 0 && report.summary.expenseCount === 0) {
          <p>No transactions recorded for this period.</p>
        }
      </section>
    }
  `,
  styles: [`
    :host { display: block; color: #173143; }
    .heading { margin-bottom: 24px; }
    .eyebrow {
      color: #39735f;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
    }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 40px); }
    h2 { margin: 0; font-size: 22px; }
    p { color: #536770; }

    .panel {
      padding: 22px;
      border: 1px solid #dce6e0;
      border-radius: 16px;
      background: #fff;
    }
    .filters, .report-heading {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .filters { align-items: end; margin-bottom: 18px; }
    .report-heading { justify-content: space-between; align-items: center; }

    label { display: grid; gap: 6px; font-weight: 600; }
    input, button {
      min-height: 42px;
      padding: 9px 14px;
      border-radius: 8px;
      font: inherit;
    }
    input { border: 1px solid #cbd8d2; }
    button {
      border: 1px solid #174b3b;
      background: #174b3b;
      color: #fff;
      cursor: pointer;
    }
    button:disabled { opacity: .55; cursor: default; }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .metric {
      padding: 16px;
      border: 1px solid #dce6e0;
      border-radius: 12px;
    }
    .metric h3 { margin: 0 0 10px; font-size: 14px; }
    .metric strong {
      font-size: 22px;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
    .metric p { margin-bottom: 0; font-size: 13px; }
    .net { background: #e7f5ec; }
    .negative { background: #fff0ed; color: #9b302d; }
    .error { color: #9b302d; }

    @media (max-width: 650px) {
      .metrics { grid-template-columns: 1fr; }
    }

    @media print {
      .report { border: 0; padding: 0; }
      .print-button { display: none; }
      .metric { break-inside: avoid; }
    }
  `]
})
export class Reports implements OnInit {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly result = signal<ReportResult | null>(null);

  private readonly today = new Date();
  private readonly minDate = '2000-01-01';
  private readonly maxDate = '2100-12-31';

  from = this.dateInputValue(
    new Date(this.today.getFullYear(), this.today.getMonth(), 1)
  );
  to = this.dateInputValue(
    new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0)
  );

  ngOnInit(): void {
    void this.generate();
  }

  private dateInputValue(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  async generate(): Promise<void> {
    if (this.loading()) return;

    const { from, to } = this;
    this.error.set('');
    this.result.set(null);

    if (!from || !to || from < this.minDate || from > this.maxDate ||
        to < this.minDate || to > this.maxDate) {
      this.error.set('Choose dates between 2000 and 2100.');
      return;
    }

    if (from > to) {
      this.error.set('From date must be on or before To date.');
      return;
    }

    this.loading.set(true);

    try {
      const query = new URLSearchParams({ fromDate: from, toDate: to });
      const response = await fetch(`/api/Reports/summary?${query}`, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const summary: FinancialSummary = await response.json();
      this.result.set({ from, to, summary });
    } catch {
      this.error.set(
        'Could not generate the report. Check that the API is running, then try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  printReport(): void {
    if (!this.result() || this.loading()) return;

    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body > :not(app-root),
        app-root :not(#homebudget-print-report):not(#homebudget-print-report *):not(:has(#homebudget-print-report)) {
          display: none !important;
        }

        html,
        body,
        app-root,
        app-root :has(#homebudget-print-report) {
          display: block !important;
          position: static !important;
          width: auto !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          background: #fff !important;
        }
      }
    `;

    document.head.appendChild(style);

    try {
      window.print();
    } finally {
      style.remove();
    }
  }
}