import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  menuOpen = false;

  readonly navigation = [
    { label: 'Overview', path: '/dashboard', icon: '01' },
    { label: 'Family Members', path: '/family-members', icon: '02' },
    { label: 'Income Sources', path: '/income-sources', icon: '03' },
    { label: 'Expense Categories', path: '/expense-categories', icon: '04' },
    { label: 'Income', path: '/incomes', icon: '05' },
    { label: 'Expenses', path: '/expenses', icon: '06' },
    { label: 'Budgets', path: '/budgets', icon: '07' },
    { label: 'Reports', path: '/reports', icon: '08' }
  ];

  closeMenu(): void {
    this.menuOpen = false;
  }
}