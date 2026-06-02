import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full',
  },
  {
    // PLP — Product Listing Page (cargada en el chunk inicial)
    path: 'productos',
    loadComponent: () =>
      import('./features/plp/plp.component').then((m) => m.PlpComponent),
    title: 'Farmacia Online | Mifarma — Compra medicamentos al mejor precio',
  },
  {
    // PDP — Product Detail Page (lazy loaded por separado)
    path: 'producto/:id',
    loadComponent: () =>
      import('./features/pdp/pdp.component').then((m) => m.PdpComponent),
    // El título se establece dinámicamente en el componente via TitleStrategy
  },
  {
    path: '**',
    redirectTo: 'productos',
  },
];
