import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FamilyMemberDetails {
  fullName: string;
  relationship: string;
  isActive: boolean;
}

interface FamilyMember extends FamilyMemberDetails {
  id: number;
}

@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="heading">
      <div>
        <p class="eyebrow">HOUSEHOLD SETTINGS</p>
        <h1>Family members</h1>
        <p>Manage the people associated with your household records.</p>
      </div>
      <button type="button" (click)="openForm()" [disabled]="saving()">
        + Add member
      </button>
    </header>

    @if (editing()) {
      <form class="panel form" #memberForm="ngForm" (ngSubmit)="save()">
        <h2>{{ editingId === null ? 'Add family member' : 'Edit family member' }}</h2>

        <div class="fields">
          <label>
            Full name
            <input name="fullName" [(ngModel)]="draft.fullName"
              maxlength="100" required [disabled]="saving()">
          </label>

          <label>
            Relationship
            <input name="relationship" [(ngModel)]="draft.relationship"
              maxlength="50" required [disabled]="saving()">
          </label>
        </div>

        @if (editingId !== null) {
          <label class="check">
            <input type="checkbox" name="isActive"
              [(ngModel)]="draft.isActive" [disabled]="saving()">
            Active member
          </label>
        }

        @if (saveError()) {
          <p class="error" role="alert">{{ saveError() }}</p>
        }

        <div class="actions">
          <button type="submit"
            [disabled]="saving() || memberForm.invalid || !draft.fullName.trim() || !draft.relationship.trim()">
            {{ saving() ? 'Saving…' : 'Save member' }}
          </button>
          <button class="secondary" type="button"
            [disabled]="saving()" (click)="editing.set(false)">
            Cancel
          </button>
        </div>
      </form>
    }

    @if (notice()) {
      <p class="notice" role="status">{{ notice() }}</p>
    }

    <section class="panel" aria-label="Household directory">
      <h2>Household directory</h2>

      @if (loading()) {
        <p role="status">Loading family members…</p>
      } @else if (loadError()) {
        <p class="error" role="alert">{{ loadError() }}</p>
        <button class="secondary" type="button" (click)="load()">Try again</button>
      } @else if (members().length === 0) {
        <p>No family members yet. Select Add member to get started.</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Relationship</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              @for (member of members(); track member.id) {
                <tr>
                  <td><strong>{{ member.fullName }}</strong></td>
                  <td>{{ member.relationship }}</td>
                  <td>
                    <span class="badge" [class.inactive]="!member.isActive">
                      {{ member.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="secondary" type="button" [disabled]="saving()"
                      [attr.aria-label]="'Edit ' + member.fullName"
                      (click)="openForm(member)">Edit</button>
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
    .heading, .actions { display: flex; align-items: center; gap: 12px; }
    .heading { justify-content: space-between; flex-wrap: wrap; margin-bottom: 24px; }
    .eyebrow { color: #39735f; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 40px); letter-spacing: -1px; }
    h2 { margin: 0 0 16px; font-size: 20px; }
    p { color: #536770; }
    .panel { padding: 22px; border: 1px solid #dce6e0; border-radius: 16px; background: white; }
    .form { margin-bottom: 18px; }
    .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    label { display: grid; gap: 6px; font-weight: 600; }
    input:not([type=checkbox]) { width: 100%; padding: 10px; border: 1px solid #cbd8d2; border-radius: 8px; }
    .check { display: flex; align-items: center; margin-top: 14px; }
    .actions { margin-top: 16px; flex-wrap: wrap; }
    button { padding: 9px 14px; border: 1px solid #174b3b; border-radius: 8px; background: #174b3b; color: white; cursor: pointer; }
    .secondary { border-color: #cbd8d2; background: white; color: #174b3b; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 12px; border-bottom: 1px solid #e9efeb; }
    th { color: #536770; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 9px; border-radius: 999px; background: #e7f5ec; color: #21654a; font-size: 12px; }
    .inactive { background: #edf0f2; color: #455661; }
    .error { color: #9b302d; }
    .notice { color: #21654a; }
    @media (max-width: 600px) {
      .fields { grid-template-columns: 1fr; }
      .panel { padding: 16px; }
    }
  `]
})
export class FamilyMembers implements OnInit {
  readonly members = signal<FamilyMember[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly notice = signal('');

  private readonly apiUrl = '/api/FamilyMembers';
  editingId: number | null = null;
  draft: FamilyMemberDetails = {
    fullName: '',
    relationship: '',
    isActive: true
  };

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);
    this.loadError.set('');

    try {
      const response = await fetch(this.apiUrl, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.members.set(await response.json() as FamilyMember[]);
    } catch {
      this.loadError.set('Could not load family members. Check that the API is running.');
    } finally {
      this.loading.set(false);
    }
  }

  openForm(member?: FamilyMember): void {
    this.editingId = member?.id ?? null;
    this.draft = {
      fullName: member?.fullName ?? '',
      relationship: member?.relationship ?? '',
      isActive: member?.isActive ?? true
    };
    this.saveError.set('');
    this.notice.set('');
    this.editing.set(true);
  }

  async save(): Promise<void> {
    const fullName = this.draft.fullName.trim();
    const relationship = this.draft.relationship.trim();

    if (this.saving() || !fullName || !relationship) return;

    const id = this.editingId;
    const isNew = id === null;
    const payload = isNew
      ? { fullName, relationship }
      : { fullName, relationship, isActive: this.draft.isActive };

    this.saving.set(true);
    this.saveError.set('');

    try {
      const response = await fetch(isNew ? this.apiUrl : `${this.apiUrl}/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        this.saveError.set(`Could not save the member (HTTP ${response.status}).`);
        return;
      }

      this.editing.set(false);
      this.notice.set(isNew ? 'Family member added.' : 'Family member updated.');
      await this.load();
    } catch {
      this.saveError.set('Could not confirm the save. Reload the directory before trying again.');
    } finally {
      this.saving.set(false);
    }
  }
}