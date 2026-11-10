import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    title: 'Overview | HomeBudget',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component')
        .then(m => m.Dashboard)
  },
  {
    path: 'family-members',
    title: 'Family Members | HomeBudget',
    loadComponent: () =>
      import('./pages/family-members/family-members.component')
        .then(m => m.FamilyMembers)
  },
  {
    path: 'income-sources',
    title: 'Income Sources | HomeBudget',
    loadComponent: () =>
      import('./pages/income-sources/income-sources.component')
        .then(m => m.IncomeSources)
  },
  {
    path: 'expense-categories',
    title: 'Expense Categories | HomeBudget',
    loadComponent: () =>
      import('./pages/expense-categories/expense-categories.component')
        .then(m => m.ExpenseCategories)
  },
  {
    path: 'incomes',
    title: 'Income | HomeBudget',
    loadComponent: () =>
      import('./pages/incomes/incomes.component')
        .then(m => m.Incomes)
  },
  {
    path: 'expenses',
    title: 'Expenses | HomeBudget',
    loadComponent: () =>
      import('./pages/expenses/expenses.component')
        .then(m => m.Expenses)
  },
  {
    path: 'budgets',
    title: 'Budgets | HomeBudget',
    loadComponent: () =>
      import('./pages/budgets/budgets.component')
        .then(m => m.Budgets)
  },
  {
    path: 'reports',
    title: 'Reports | HomeBudget',
    loadComponent: () =>
      import('./pages/reports/reports.component')
        .then(m => m.Reports)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];