import { Routes } from '@angular/router';
import { PersonsStore } from './state/persons-store';

export const PERSONS_ROUTES: Routes = [
  {
    path: '',
    providers: [PersonsStore],
    children: [
      {
        path: '',
        title: 'Personen',
        loadComponent: () =>
          import('./ui/person-list/person-list-page').then((m) => m.PersonListPage),
      },
      {
        path: ':id',
        title: 'Person',
        loadComponent: () =>
          import('./ui/person-detail/person-detail-page').then((m) => m.PersonDetailPage),
      },
    ],
  },
];
