import { DecimalPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ExpenseCategory {
  id: number;
  name: string;
  isActive: boolean;
}

interface Budget {
  id: number;
  expenseCategoryId: number;
  expenseCategoryName: string;
  amount: number;
  spent: number;
  remaining: number;
  usagePercentage: number;
  status: string;
  notes: string | null;
}

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <header class="heading">
      <div>
        <p class="eyebrow">HOUSEHOLD PLANNING</p>
        <h1>Budgets</h1>
        <p>Set monthly limits and compare them with actual spending.</p>
      </div>

      <div class="actions">
        <label>
          Budget month
          <input type="month" [ngModel]="period()"
            (ngModelChange)="changeMonth($event)"
            min="2000-01" max="2100-12"
            [disabled]="loading() || editing()">
        </label>
        <button type="button" (click)="openForm()"
          [disabled]="loading() || editing() || !!loadError() || !availableCategories().length">
          + Add budget
        </button>
      </div>
    </header>

    @if (editing()) {
      <form class="panel editor" #budgetForm="ngForm" (ngSubmit)="save()">
        <h2>{{ editingId === null ? 'Add budget' : 'Edit budget' }}</h2>

        <div class="fields">
          @if (editingId === null) {
            <label>
              Expense category
              <select name="category" [(ngModel)]="draft.categoryId"
                required [disabled]="saving()">
                <option [ngValue]="null" disabled>Select a category</option>
                @for (category of availableCategories(); track category.id) {
                  <option [ngValue]="category.id">{{ category.name }}</option>
                }
              </select>
            </label>
          } @else {
            <p><strong>{{ editingCategory }}</strong> · {{ period() }}</p>
          }

          <label>
            Budget amount (OMR)
            <input type="number" name="amount" [(ngModel)]="draft.amount"
              min="0.001" step="0.001" required [disabled]="saving()">
          </label>
        </div>

        <label>
          Notes (optional)
          <textarea name="notes" [(ngModel)]="draft.notes"
            maxlength="500" rows="2" [disabled]="saving()"></textarea>
        </label>

        @if (saveError()) {
          <p class="error" role="alert">{{ saveError() }}</p>
        }

        <div class="actions">
          <button type="submit" [disabled]="budgetForm.invalid || saving()">
            {{ saving() ? 'Saving…' : 'Save budget' }}
          </button>
          <button class="secondary" type="button" [disabled]="saving()"
            (click)="editing.set(false)">Cancel</button>
        </div>
      </form>
    }

    @if (notice()) {
      <p class="notice" role="status">{{ notice() }}</p>
    }

    <section class="panel" [attr.aria-busy]="loading()">
      <h2>Monthly budget plan</h2>

      @if (loading()) {
        <p role="status">Loading budgets…</p>
      } @else if (loadError()) {
        <p class="error" role="alert">{{ loadError() }}</p>
        <button class="secondary" type="button" (click)="load()">Try again</button>
      } @else {
        @if (!availableCategories().length) {
          <p>There are no active categories without a budget for this month.</p>
        }

        @if (!budgets().length) {
          <p>No budgets for this month.</p>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Planned (OMR)</th>
                  <th scope="col">Spent (OMR)</th>
                  <th scope="col">Remaining (OMR)</th>
                  <th scope="col">Usage</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (budget of budgets(); track budget.id) {
                  <tr>
                    <td>
                      <strong>{{ budget.expenseCategoryName }}</strong>
                      @if (budget.notes) {
                        <small>{{ budget.notes }}</small>
                      }
                    </td>
                    <td>{{ budget.amount | number:'1.3-3' }}</td>
                    <td>{{ budget.spent | number:'1.3-3' }}</td>
                    <td [class.error]="budget.remaining < 0">
                      {{ budget.remaining | number:'1.3-3' }}
                    </td>
                    <td>
                      <strong>{{ budget.usagePercentage | number:'1.0-2' }}%</strong>
                      <small>{{ budget.status }}</small>
                    </td>
                    <td>
                      <button class="secondary" type="button" [disabled]="editing()"
                        [attr.aria-label]="'Edit ' + budget.expenseCategoryName + ' budget'"
                        (click)="openForm(budget)">Edit</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    :host { display: block; color: #173143; }
    .heading, .actions { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; }
    .heading { justify-content: space-between; margin-bottom: 24px; }
    .eyebrow { color: #39735f; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 40px); }
    h2 { margin: 0 0 16px; font-size: 20px; }
    p, small { color: #536770; }
    small { display: block; margin-top: 4px; overflow-wrap: anywhere; }
    .panel { padding: 22px; border: 1px solid #dce6e0; border-radius: 16px; background: #fff; }
    .editor { display: grid; gap: 16px; margin-bottom: 18px; }
    .editor h2 { margin: 0; }
    .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    label { display: grid; gap: 6px; font-weight: 600; }
    input, select, textarea {
      width: 100%; min-height: 40px; padding: 9px 12px;
      border: 1px solid #cbd8d2; border-radius: 8px;
      background: #fff; color: #173143; font: inherit;
    }
    button {
      min-height: 40px; padding: 8px 14px; border: 1px solid #174b3b;
      border-radius: 8px; background: #174b3b; color: #fff; cursor: pointer;
    }
    .secondary { border-color: #cbd8d2; background: #fff; color: #174b3b; }
    .error { color: #9b302d; }
    .notice { color: #21654a; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px; border-bottom: 1px solid #e9efeb; font-variant-numeric: tabular-nums; }
    th { color: #536770; font-size: 13px; }
    @media (max-width: 600px) {
      .fields { grid-template-columns: 1fr; }
      .panel { padding: 16px; }
    }
  `]
})
export class Budgets implements OnInit {
  readonly period = signal(this.currentMonth());
  readonly budgets = signal<Budget[]>([]);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly notice = signal('');

  private readonly apiUrl = '/api/Budgets';
  editingId: number | null = null;
  editingCategory = '';
  draft = {
    categoryId: null as number | null,
    amount: null as number | null,
    notes: ''
  };

  ngOnInit(): void {
    void this.load();
  }

  private currentMonth(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${month}`;
  }

  changeMonth(value: string): void {
    if (this.loading() || this.editing() ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(value) ||
        value < '2000-01' || value > '2100-12') {
      return;
    }

    this.period.set(value);
    this.notice.set('');
    void this.load();
  }

  availableCategories(): ExpenseCategory[] {
    return this.categories().filter(category =>
      category.isActive &&
      !this.budgets().some(budget => budget.expenseCategoryId === category.id)
    );
  }

  private async getList<T>(url: string): Promise<T[]> {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Expected a list.');

    return data as T[];
  }

  async load(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.loadError.set('');
    const [year, month] = this.period().split('-').map(Number);

    try {
      const [budgets, categories] = await Promise.all([
        this.getList<Budget>(`${this.apiUrl}?year=${year}&month=${month}`),
        this.getList<ExpenseCategory>('/api/ExpenseCategories')
      ]);

      this.budgets.set(budgets);
      this.categories.set(categories);
    } catch {
      this.loadError.set('Could not load budgets. Check that the API is running.');
    } finally {
      this.loading.set(false);
    }
  }

  openForm(budget?: Budget): void {
    this.editingId = budget?.id ?? null;
    this.editingCategory = budget?.expenseCategoryName ?? '';
    this.draft = {
      categoryId: budget?.expenseCategoryId ?? null,
      amount: budget?.amount ?? null,
      notes: budget?.notes ?? ''
    };

    this.saveError.set('');
    this.notice.set('');
    this.editing.set(true);
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    const { categoryId, amount, notes } = this.draft;
    const id = this.editingId;

    if (amount === null || !Number.isFinite(amount) || amount < 0.001 ||
        Number(amount.toFixed(3)) !== amount) {
      this.saveError.set('Enter a positive amount with up to three decimal places.');
      return;
    }

    if (id === null && !this.availableCategories().some(c => c.id === categoryId)) {
      this.saveError.set('Select an available expense category.');
      return;
    }

    const [year, month] = this.period().split('-').map(Number);
    const details = { amount, notes: notes.trim() || null };
    const payload = id === null
      ? { ...details, expenseCategoryId: categoryId, year, month }
      : details;

    this.saving.set(true);
    this.saveError.set('');

    try {
      const response = await fetch(id === null ? this.apiUrl : `${this.apiUrl}/${id}`, {
        method: id === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 409) {
        this.saveError.set('This category already has a budget for the selected month.');
        return;
      }

      if (!response.ok) {
        this.saveError.set(`Could not save the budget (HTTP ${response.status}).`);
        return;
      }

      this.editing.set(false);
      this.notice.set(id === null ? 'Budget added.' : 'Budget updated.');
      await this.load();
    } catch {
      this.saveError.set('Could not confirm the save. Check the budget list before retrying.');
    } finally {
      this.saving.set(false);
    }
  }
}