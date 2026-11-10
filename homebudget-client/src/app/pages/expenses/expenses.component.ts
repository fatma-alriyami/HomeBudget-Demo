import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FamilyMember {
  id: number;
  fullName: string;
  isActive: boolean;
}

interface ExpenseCategory {
  id: number;
  name: string;
  isActive: boolean;
}

interface ExpenseRecord {
  id: number;
  familyMemberId: number;
  familyMemberName: string | null;
  expenseCategoryId: number;
  expenseCategoryName: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
}

interface ExpenseDraft {
  familyMemberId: number | null;
  expenseCategoryId: number | null;
  amount: number | null;
  expenseDate: string;
  notes: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <header class="heading">
      <div>
        <p class="eyebrow">HOUSEHOLD TRANSACTIONS</p>
        <h1>Expenses</h1>
        <p>Record and review your household spending.</p>
      </div>
      <button type="button" (click)="openForm()"
        [disabled]="loading() || saving() || !!loadError() || formOpen()">
        + Add expense
      </button>
    </header>

    @if (formOpen()) {
      <form class="panel editor" #expenseForm="ngForm" (ngSubmit)="save()">
        <h2>{{ editingRecord() ? 'Edit expense' : 'Add expense' }}</h2>

        @if (!categoryOptions().length || !memberOptions().length) {
          <p role="status">
            You need an available category and family member to save an expense.
          </p>
        }

        <div class="fields">
          <label>
            Category
            <select name="expenseCategoryId" [(ngModel)]="draft.expenseCategoryId"
              required [disabled]="saving()">
              <option [ngValue]="null" disabled>Select a category</option>
              @for (category of categoryOptions(); track category.id) {
                <option [ngValue]="category.id">
                  {{ category.name }}{{ category.isActive ? '' : ' (inactive)' }}
                </option>
              }
            </select>
          </label>

          <label>
            Family member
            <select name="familyMemberId" [(ngModel)]="draft.familyMemberId"
              required [disabled]="saving()">
              <option [ngValue]="null" disabled>Select a family member</option>
              @for (member of memberOptions(); track member.id) {
                <option [ngValue]="member.id">
                  {{ member.fullName }}{{ member.isActive ? '' : ' (inactive)' }}
                </option>
              }
            </select>
          </label>

          <label>
            Amount (OMR)
            <input type="number" name="amount" [(ngModel)]="draft.amount"
              min="0.001" step="0.001" required [disabled]="saving()">
          </label>

          <label>
            Expense date
            <input type="date" name="expenseDate" [(ngModel)]="draft.expenseDate"
              [min]="minDate" [max]="maxDate" required [disabled]="saving()">
          </label>
        </div>

        <label>
          Notes (optional)
          <textarea name="notes" [(ngModel)]="draft.notes"
            rows="2" maxlength="500" [disabled]="saving()"></textarea>
        </label>

        @if (saveError()) {
          <p class="error" role="alert">{{ saveError() }}</p>
        }

        <div class="actions">
          <button type="submit" [disabled]="saving() || expenseForm.invalid">
            {{ saving() ? 'Saving…' : (editingRecord() ? 'Save changes' : 'Save expense') }}
          </button>
          <button class="secondary" type="button" (click)="closeForm()"
            [disabled]="saving()">Cancel</button>
        </div>
      </form>
    }

    @if (notice()) {
      <p class="notice" role="status">{{ notice() }}</p>
    }

    <section class="panel" [attr.aria-busy]="loading()">
      <h2>Expense records</h2>

      @if (loading()) {
        <p role="status">Loading expense records…</p>
      } @else if (loadError()) {
        <p class="error" role="alert">{{ loadError() }}</p>
        <button class="secondary" type="button" (click)="load()">Try again</button>
      } @else if (!records().length) {
        <p>No expenses recorded yet.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Category</th>
                <th scope="col">Family member</th>
                <th scope="col">Notes</th>
                <th scope="col" class="amount">Amount (OMR)</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (record of records(); track record.id) {
                <tr>
                  <td>{{ record.expenseDate.slice(0, 10) | date:'dd MMM yyyy' }}</td>
                  <td>{{ record.expenseCategoryName }}</td>
                  <td>{{ record.familyMemberName || 'Shared household' }}</td>
                  <td>{{ record.notes || '—' }}</td>
                  <td class="amount">
                    <strong>{{ record.amount | number:'1.3-3' }}</strong>
                  </td>
                  <td>
                    <button class="secondary" type="button"
                      [disabled]="formOpen() || saving()"
                      [attr.aria-label]="'Edit ' + record.expenseCategoryName + ' expense'"
                      (click)="openForm(record)">Edit</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; color: #173143; }
    .heading, .actions {
      display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
    }
    .heading { justify-content: space-between; margin-bottom: 24px; }
    .eyebrow {
      color: #39735f; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
    }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 40px); }
    h2 { margin: 0 0 16px; font-size: 20px; }
    p { color: #536770; }
    .panel {
      padding: 22px; border: 1px solid #dce6e0;
      border-radius: 16px; background: #fff;
    }
    .editor { display: grid; gap: 16px; margin-bottom: 18px; }
    .editor h2 { margin-bottom: 0; }
    .fields {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;
    }
    label { display: grid; gap: 6px; font-weight: 600; }
    input, select, textarea {
      width: 100%; min-width: 0; padding: 10px; border: 1px solid #cbd8d2;
      border-radius: 8px; background: #fff; color: #173143; font: inherit;
    }
    button {
      padding: 9px 14px; border: 1px solid #174b3b; border-radius: 8px;
      background: #174b3b; color: #fff; cursor: pointer;
    }
    button:disabled { opacity: .55; cursor: default; }
    .secondary { border-color: #cbd8d2; background: #fff; color: #174b3b; }
    .error { color: #9b302d; }
    .notice { color: #21654a; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px; border-bottom: 1px solid #e9efeb; }
    th { color: #536770; font-size: 13px; }
    .amount {
      text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums;
    }
    @media (max-width: 600px) {
      .fields { grid-template-columns: 1fr; }
      .panel { padding: 16px; }
    }
  `]
})
export class Expenses implements OnInit {
  readonly records = signal<ExpenseRecord[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingRecord = signal<ExpenseRecord | null>(null);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly notice = signal('');

  readonly minDate = '2000-01-01';
  readonly maxDate = '2100-12-31';

  private readonly apiUrl = '/api/Expenses';
  private readonly categories = signal<ExpenseCategory[]>([]);
  private readonly members = signal<FamilyMember[]>([]);

  readonly categoryOptions = computed(() => {
    const currentId = this.editingRecord()?.expenseCategoryId;
    return this.categories().filter(category => category.isActive || category.id === currentId);
  });

  readonly memberOptions = computed(() => {
    const currentId = this.editingRecord()?.familyMemberId;
    return this.members().filter(member => member.isActive || member.id === currentId);
  });

  draft: ExpenseDraft = this.emptyDraft();

  ngOnInit(): void {
    void this.load();
  }

  private emptyDraft(): ExpenseDraft {
    return {
      familyMemberId: null,
      expenseCategoryId: null,
      amount: null,
      expenseDate: '',
      notes: ''
    };
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

    try {
      const [records, categories, members] = await Promise.all([
        this.getList<ExpenseRecord>(this.apiUrl),
        this.getList<ExpenseCategory>('/api/ExpenseCategories'),
        this.getList<FamilyMember>('/api/FamilyMembers')
      ]);

      this.records.set(records);
      this.categories.set(categories);
      this.members.set(members);
    } catch {
      this.loadError.set('Could not load expense data. Check that the API is running.');
    } finally {
      this.loading.set(false);
    }
  }

  openForm(record?: ExpenseRecord): void {
    this.editingRecord.set(record ?? null);
    this.draft = record
      ? {
          familyMemberId: record.familyMemberId ?? null,
          expenseCategoryId: record.expenseCategoryId,
          amount: record.amount,
          expenseDate: record.expenseDate.slice(0, 10),
          notes: record.notes ?? ''
        }
      : this.emptyDraft();

    this.saveError.set('');
    this.notice.set('');
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingRecord.set(null);
    this.saveError.set('');
  }

  async save(): Promise<void> {
    if (this.saving()) return;

    const { familyMemberId, expenseCategoryId, amount, expenseDate, notes } = this.draft;
    const record = this.editingRecord();

    if (
      !this.memberOptions().some(member => member.id === familyMemberId) ||
      !this.categoryOptions().some(category => category.id === expenseCategoryId) ||
      amount === null ||
      !Number.isFinite(amount) ||
      amount < 0.001 ||
      Number(amount.toFixed(3)) !== amount ||
      !expenseDate ||
      expenseDate < this.minDate ||
      expenseDate > this.maxDate
    ) {
      this.saveError.set(
        'Check the category, family member, date and amount. Use up to three decimal places.'
      );
      return;
    }

    this.saving.set(true);
    this.saveError.set('');

    try {
      const url = record ? `${this.apiUrl}/${record.id}` : this.apiUrl;
      const response = await fetch(url, {
        method: record ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyMemberId,
          expenseCategoryId,
          amount,
          expenseDate,
          notes: notes.trim() || null
        })
      });

      if (!response.ok) {
        const details = await response.json().catch(() => null);
        const validationMessage = details?.errors
          ? Object.values(details.errors).flat().find(value => typeof value === 'string')
          : undefined;

        this.saveError.set(
          details?.message ?? validationMessage ??
          `Could not save expense (HTTP ${response.status}).`
        );
        return;
      }

      this.closeForm();
      this.notice.set(record ? 'Expense updated.' : 'Expense recorded.');
      await this.load();
    } catch {
      this.saveError.set(
        'Could not confirm the save. Refresh the page and check the records before retrying.'
      );
    } finally {
      this.saving.set(false);
    }
  }
}