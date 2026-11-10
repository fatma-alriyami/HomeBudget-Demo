import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FamilyMember {
  id: number;
  fullName: string;
  isActive: boolean;
}

interface IncomeSource {
  id: number;
  name: string;
  isActive: boolean;
}

interface IncomeRecord {
  id: number;
  familyMemberId: number;
  familyMemberName: string;
  incomeSourceId: number;
  incomeSourceName: string;
  amount: number;
  incomeDate: string;
  notes: string | null;
}

interface IncomeDraft {
  familyMemberId: number | null;
  incomeSourceId: number | null;
  amount: number | null;
  incomeDate: string;
  notes: string;
}

@Component({
  selector: 'app-incomes',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
    <header class="heading">
      <div>
        <p class="eyebrow">HOUSEHOLD TRANSACTIONS</p>
        <h1>Income</h1>
        <p>Record and review money received by your household.</p>
      </div>

      <button type="button" (click)="openForm()"
        [disabled]="loading() || saving() || !!loadError() || formOpen()">
        + Add income
      </button>
    </header>

    @if (formOpen()) {
      <form class="panel editor" #incomeForm="ngForm" (ngSubmit)="save()">
        <h2>{{ editingRecord() ? 'Edit income' : 'Add income' }}</h2>

        @if (!memberOptions().length || !sourceOptions().length) {
          <p role="status">
            Select a valid family member and income source to save this record.
          </p>
        }

        <div class="fields">
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
            Income source
            <select name="incomeSourceId" [(ngModel)]="draft.incomeSourceId"
              required [disabled]="saving()">
              <option [ngValue]="null" disabled>Select an income source</option>
              @for (source of sourceOptions(); track source.id) {
                <option [ngValue]="source.id">
                  {{ source.name }}{{ source.isActive ? '' : ' (inactive)' }}
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
            Date received
            <input type="date" name="incomeDate" [(ngModel)]="draft.incomeDate"
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
          <button type="submit" [disabled]="saving() || incomeForm.invalid">
            {{ saving() ? 'Saving…' : (editingRecord() ? 'Save changes' : 'Save income') }}
          </button>
          <button class="secondary" type="button" (click)="closeForm()"
            [disabled]="saving()">
            Cancel
          </button>
        </div>
      </form>
    }

    @if (notice()) {
      <p class="notice" role="status">{{ notice() }}</p>
    }

    <section class="panel" [attr.aria-busy]="loading()">
      <h2>Income records</h2>

      @if (loading()) {
        <p role="status">Loading income records…</p>
      } @else if (loadError()) {
        <p class="error" role="alert">{{ loadError() }}</p>
        <button class="secondary" type="button" (click)="load()">Try again</button>
      } @else if (!records().length) {
        <p>No income recorded yet.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Family member</th>
                <th scope="col">Source</th>
                <th scope="col">Notes</th>
                <th scope="col" class="amount">Amount (OMR)</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (record of records(); track record.id) {
                <tr>
                  <td>{{ record.incomeDate.slice(0, 10) | date:'dd MMM yyyy' }}</td>
                  <td>{{ record.familyMemberName }}</td>
                  <td>{{ record.incomeSourceName }}</td>
                  <td>{{ record.notes || '—' }}</td>
                  <td class="amount">
                    <strong>{{ record.amount | number:'1.3-3' }}</strong>
                  </td>
                  <td>
                    <button class="secondary" type="button"
                      [disabled]="formOpen() || saving()"
                      [attr.aria-label]="'Edit income for ' + record.familyMemberName"
                      (click)="openForm(record)">
                      Edit
                    </button>
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
      width: 100%; padding: 10px; border: 1px solid #cbd8d2;
      border-radius: 8px; background: #fff; color: #173143; font: inherit;
    }
    button {
      padding: 9px 14px; border: 1px solid #174b3b; border-radius: 8px;
      background: #174b3b; color: #fff; cursor: pointer;
    }
    button:disabled { opacity: .55; cursor: default; }
    .secondary { border-color: #cbd8d2; background: #fff; color: #174b3b; }
    .error { color: #9b302d; }
    .notice, td.amount { color: #21654a; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px; border-bottom: 1px solid #e9efeb; }
    th { color: #536770; font-size: 13px; }
    .amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    @media (max-width: 600px) {
      .fields { grid-template-columns: 1fr; }
      .panel { padding: 16px; }
    }
  `]
})
export class Incomes implements OnInit {
  readonly records = signal<IncomeRecord[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingRecord = signal<IncomeRecord | null>(null);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly notice = signal('');

  readonly minDate = '2000-01-01';
  readonly maxDate = '2100-12-31';

  private readonly apiUrl = '/api/Incomes';
  private readonly members = signal<FamilyMember[]>([]);
  private readonly sources = signal<IncomeSource[]>([]);

  readonly memberOptions = computed(() => {
    const currentId = this.editingRecord()?.familyMemberId;
    return this.members().filter(member => member.isActive || member.id === currentId);
  });

  readonly sourceOptions = computed(() => {
    const currentId = this.editingRecord()?.incomeSourceId;
    return this.sources().filter(source => source.isActive || source.id === currentId);
  });

  draft: IncomeDraft = this.emptyDraft();

  ngOnInit(): void {
    void this.load();
  }

  private emptyDraft(): IncomeDraft {
    return {
      familyMemberId: null,
      incomeSourceId: null,
      amount: null,
      incomeDate: '',
      notes: ''
    };
  }

  private async getList<T>(url: string): Promise<T[]> {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Expected a list.');
    }

    return data as T[];
  }

  async load(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.loadError.set('');

    try {
      const [records, members, sources] = await Promise.all([
        this.getList<IncomeRecord>(this.apiUrl),
        this.getList<FamilyMember>('/api/FamilyMembers'),
        this.getList<IncomeSource>('/api/IncomeSources')
      ]);

      this.records.set(records);
      this.members.set(members);
      this.sources.set(sources);
    } catch {
      this.loadError.set('Could not load income data. Check that the API is running.');
    } finally {
      this.loading.set(false);
    }
  }

  openForm(record?: IncomeRecord): void {
    this.editingRecord.set(record ?? null);
    this.draft = record
      ? {
          familyMemberId: record.familyMemberId,
          incomeSourceId: record.incomeSourceId,
          amount: record.amount,
          incomeDate: record.incomeDate.slice(0, 10),
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

    const { familyMemberId, incomeSourceId, amount, incomeDate, notes } = this.draft;
    const record = this.editingRecord();

    if (
      familyMemberId === null ||
      incomeSourceId === null ||
      !this.memberOptions().some(member => member.id === familyMemberId) ||
      !this.sourceOptions().some(source => source.id === incomeSourceId) ||
      amount === null ||
      !Number.isFinite(amount) ||
      amount < 0.001 ||
      Number(amount.toFixed(3)) !== amount ||
      !incomeDate ||
      incomeDate < this.minDate ||
      incomeDate > this.maxDate
    ) {
      this.saveError.set(
        'Check the member, source, date and amount. Use up to three decimal places.'
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
          incomeSourceId,
          amount,
          incomeDate,
          notes: notes.trim() || null
        })
      });

      if (!response.ok) {
        const details = await response.json().catch(() => null);
        const validationMessage = details?.errors
          ? Object.values(details.errors).flat().find(value => typeof value === 'string')
          : undefined;

        this.saveError.set(
          details?.message ?? validationMessage ?? `Could not save income (HTTP ${response.status}).`
        );
        return;
      }

      this.closeForm();
      this.notice.set(record ? 'Income updated.' : 'Income recorded.');
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