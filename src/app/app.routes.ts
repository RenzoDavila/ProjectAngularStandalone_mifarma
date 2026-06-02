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
    title: 'Farmacia Online | Inkafarma',
  },
  {
    // PDP — Product Detail Page (lazy loaded por separado)
    path: 'producto/:id',
    loadComponent: () =>
      import('./features/pdp/pdp.component').then((m) => m.PdpComponent),
    title: 'Inka Precios | Inkafarma',
    // El título se establece dinámicamente en el componente via TitleStrategy
  },
  {
    // Página de compra exitosa
    path: 'compra-exitosa',
    loadComponent: () =>
      import('./features/success-purchase/success-purchase.component').then((m) => m.SuccessPurchaseComponent),
    title: 'Compra Exitosa | Mifarma',
  },
  {
    path: '**',
    redirectTo: 'productos',
  },
];
