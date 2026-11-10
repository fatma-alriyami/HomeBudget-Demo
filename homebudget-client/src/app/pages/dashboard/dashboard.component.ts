import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FinancialSummary {
  fromDate: string;
  toDate: string;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  incomeCount: number;
  expenseCount: number;
}

interface BudgetSummary {
  id: number;
  expenseCategoryId: number;
  expenseCategoryName: string;
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  usagePercentage: number;
  status: string;
  notes: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class Dashboard implements OnInit {
  readonly loading = signal(false);
  readonly error = signal('');
  readonly summary = signal<FinancialSummary | null>(null);
  readonly budgets = signal<BudgetSummary[]>([]);
  readonly updatedAt = signal('');

  selectedMonth = this.currentMonth();

  ngOnInit(): void {
    void this.loadDashboard();
  }

  private currentMonth(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}`;
  }

  get periodLabel(): string {
    const [year, month] = this.selectedMonth.split('-').map(Number);

    return new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric'
    }).format(new Date(year, month - 1, 1));
  }

  get totalBudget(): number {
    return this.budgets().reduce(
      (total, budget) => total + budget.amount,
      0
    );
  }

  get overBudgetCount(): number {
    return this.budgets().filter(
      budget => budget.spent > budget.amount
    ).length;
  }

  progressWidth(value: number): number {
    return Math.min(100, Math.max(0, value));
  }

  async changeMonth(value: string): Promise<void> {
    if (!/^\d{4}-\d{2}$/.test(value)) {
      return;
    }

    const [year, month] = value.split('-').map(Number);

    if (year < 2000 || year > 2100 || month < 1 || month > 12) {
      return;
    }

    if (this.loading()) {
      return;
    }

    this.selectedMonth = value;
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.summary.set(null);
    this.budgets.set([]);

    const [year, month] = this.selectedMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    const fromDate = `${this.selectedMonth}-01`;
    const toDate = `${this.selectedMonth}-${lastDay}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65000);

    try {
      const [summary, budgets] = await Promise.all([
        this.readJson<FinancialSummary>(
          `/api/Reports/summary?fromDate=${fromDate}&toDate=${toDate}`,
          controller.signal
        ),
        this.readJson<BudgetSummary[]>(
          `/api/Budgets?year=${year}&month=${month}`,
          controller.signal
        )
      ]);

      this.summary.set(summary);
      this.budgets.set(budgets);

      this.updatedAt.set(
        new Intl.DateTimeFormat('en', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date())
      );
    } catch {
      controller.abort();

      this.error.set(
        'We could not load your financial data. Make sure the API is running, then try again.'
      );
    } finally {
      clearTimeout(timer);
      this.loading.set(false);
    }
  }

  private async readJson<T>(
    url: string,
    signal: AbortSignal
  ): Promise<T> {
    const response = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
      throw new Error('Expected a JSON response.');
    }

    return response.json() as Promise<T>;
  }
}