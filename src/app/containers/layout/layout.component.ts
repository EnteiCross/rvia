import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';

import { PrimeIcons } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

import { AuthService } from '@modules/auth/services/auth.service';
import { Nom_Rol, Usuario } from '@modules/usuarios/interfaces';
import { CoreService } from '@modules/shared/services/core.service';
import { UserBadgeComponent } from "./components/user-badge/user-badge.component";
import { MenuListComponent } from "./components/menu-list/menu-list.component";

@Component({
    selector: 'layout',
    imports: [CommonModule, RouterOutlet, DividerModule, UserBadgeComponent, MenuListComponent],
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  userLogged = signal<Usuario | null>(null);
  menuSidebar = [
    { path: '/apps/home', name: 'Inicio', icon: PrimeIcons.HOME },
  ];
  menuAdmin = [
    { path: '/users/list-users', name: 'Usuarios', icon: PrimeIcons.USERS },
  ];
  menuRvia = [
    { path: '/tools/execute-documentacion', name: 'Documentar proyecto', icon: PrimeIcons.FILE },
    { path: '/tools/test-case', name: 'Casos de prueba', icon: PrimeIcons.CLIPBOARD },
    // { path: '/tools/rate-code', name: 'Calificar código', icon: PrimeIcons.CHECK_SQUARE },
  ];
  menuTools = [
    { path: '/tools/recoveryPDF', name: 'Convertir a .csv', icon: PrimeIcons.FILE_EXCEL },
    { path: '/tools/execute-ia', name: 'Ejecutar IA', icon: PrimeIcons.MICROCHIP_AI },
    { path: '/tools/create-center', name: 'Centros', icon: PrimeIcons.BUILDING },
    { path: '/tools/create-leader', name: 'Encargados', icon: PrimeIcons.USER_PLUS },
  ];
  menuSettings = [
    { path: '/users/settings/my-account', name: 'Ajustes', icon: PrimeIcons.COG },
  ];

  Nom_rol = Nom_Rol;
  sidebarActive = false;
  coreVersion = signal<string[]>([]);
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private authService = inject(AuthService);
  coreService = inject(CoreService); 
  
  ngOnInit(): void {
    this.userLogged.set(this.authService.user());
    this.coreService.getCoreVersion();
    if (this.userLogged()?.position.nom_rol !== Nom_Rol.INVITADO) {
      this.menuSidebar.push(
        { path: '/apps/list-apps', name: 'Aplicaciones', icon: PrimeIcons.TABLE },
      );
    }
  }

  toggleSidebar(): void {
    this.sidebarActive = !this.sidebarActive;
  }

  closeSidebar(): void {
    this.sidebarActive = false;
  }

  logout(): void {
    this.authService.logoutUser();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
