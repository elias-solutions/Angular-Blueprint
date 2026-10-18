import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'persons' },
  {
    path: 'persons',
    loadChildren: () => import('./features/persons/persons.routes').then((m) => m.PERSONS_ROUTES),
  },
  { path: '**', redirectTo: 'persons' },
];
