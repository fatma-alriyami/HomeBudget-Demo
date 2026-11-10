import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface IncomeSource {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-income-sources',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="heading">
      <div>
        <p class="eyebrow">HOUSEHOLD SETTINGS</p>
        <h1>Income sources</h1>
        <p>Manage the sources used to classify your household income.</p>
      </div>
      <button type="button" [disabled]="saving()" (click)="openForm()">
        + Add source
      </button>
    </header>

    @if (editing()) {
      <form class="panel editor" (ngSubmit)="save()">
        <h2>{{ editingId === null ? 'Add income source' : 'Edit income source' }}</h2>

        <label>
          Source name
          <input name="name" [(ngModel)]="draft.name"
            maxlength="100" required [disabled]="saving()">
        </label>

        <label>
          Description (optional)
          <input name="description" [(ngModel)]="draft.description"
            maxlength="300" [disabled]="saving()">
        </label>

        @if (editingId !== null) {
          <label class="checkbox">
            <input type="checkbox" name="isActive"
              [(ngModel)]="draft.isActive" [disabled]="saving()">
            Active source
          </label>
        }

        @if (saveError()) {
          <p class="error" role="alert">{{ saveError() }}</p>
        }

        <div class="actions">
          <button type="submit" [disabled]="saving() || !draft.name.trim()">
            {{ saving() ? 'Saving…' : 'Save source' }}
          </button>
          <button class="secondary" type="button" [disabled]="saving()"
            (click)="editing.set(false)">Cancel</button>
        </div>
      </form>
    }

    @if (notice()) {
      <p class="notice" role="status">{{ notice() }}</p>
    }

    <section class="panel" aria-label="Source directory">
      <h2>Source directory</h2>

      @if (loading()) {
        <p role="status">Loading income sources…</p>
      } @else if (loadError()) {
        <p class="error" role="alert">{{ loadError() }}</p>
        <button class="secondary" type="button" (click)="load()">Try again</button>
      } @else if (sources().length === 0) {
        <p>No income sources yet. Select Add source to get started.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (source of sources(); track source.id) {
                <tr>
                  <td><strong>{{ source.name }}</strong></td>
                  <td>{{ source.description || '—' }}</td>
                  <td>
                    <span class="badge" [class.inactive]="!source.isActive">
                      {{ source.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="secondary" type="button" [disabled]="saving()"
                      [attr.aria-label]="'Edit ' + source.name"
                      (click)="openForm(source)">Edit</button>
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
    .heading, .actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .heading { justify-content: space-between; margin-bottom: 24px; }
    .eyebrow { color: #39735f; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 40px); }
    h2 { margin: 0 0 16px; font-size: 20px; }
    p { color: #536770; }
    .panel { padding: 22px; border: 1px solid #dce6e0; border-radius: 16px; background: #fff; }
    .editor { display: grid; gap: 14px; margin-bottom: 18px; }
    .editor h2 { margin-bottom: 0; }
    label { display: grid; gap: 6px; font-weight: 600; }
    input:not([type=checkbox]) { width: 100%; padding: 10px; border: 1px solid #cbd8d2; border-radius: 8px; }
    .checkbox { display: flex; align-items: center; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px; border-bottom: 1px solid #e9efeb; }
    th { color: #536770; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 9px; border-radius: 999px; background: #e7f5ec; color: #21654a; font-size: 12px; }
    .inactive { background: #edf0f2; color: #455661; }
    .error { color: #9b302d; }
    .notice { color: #21654a; }
    button { padding: 9px 14px; border: 1px solid #174b3b; border-radius: 8px; background: #174b3b; color: #fff; cursor: pointer; }
    .secondary { border-color: #cbd8d2; background: #fff; color: #174b3b; }
  `]
})
export class IncomeSources implements OnInit {
  readonly sources = signal<IncomeSource[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly notice = signal('');

  private readonly apiUrl = '/api/IncomeSources';
  editingId: number | null = null;
  draft = { name: '', description: '', isActive: true };

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.sources.set(await response.json() as IncomeSource[]);
    } catch {
      this.loadError.set('Could not load income sources. Check that the API is running.');
    } finally {
      this.loading.set(false);
    }
  }

  openForm(source?: IncomeSource): void {
    this.editingId = source?.id ?? null;
    this.draft = {
      name: source?.name ?? '',
      description: source?.description ?? '',
      isActive: source?.isActive ?? true
    };
    this.saveError.set('');
    this.notice.set('');
    this.editing.set(true);
  }

  async save(): Promise<void> {
    const name = this.draft.name.trim();
    if (this.saving() || !name) return;

    const id = this.editingId;
    const description = this.draft.description.trim() || null;
    const payload = id === null
      ? { name, description }
      : { name, description, isActive: this.draft.isActive };

    this.saving.set(true);
    this.saveError.set('');

    try {
      const response = await fetch(id === null ? this.apiUrl : `${this.apiUrl}/${id}`, {
        method: id === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 409) {
        this.saveError.set('An income source with this name already exists.');
        return;
      }

      if (!response.ok) {
        this.saveError.set(`Could not save the source (HTTP ${response.status}).`);
        return;
      }

      this.editing.set(false);
      this.notice.set(id === null ? 'Income source added.' : 'Income source updated.');
      await this.load();
    } catch {
      this.saveError.set('Could not confirm the save. Refresh the page before trying again.');
    } finally {
      this.saving.set(false);
    }
  }
}