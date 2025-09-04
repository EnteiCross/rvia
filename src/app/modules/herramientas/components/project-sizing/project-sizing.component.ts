import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';

import { Table } from 'primeng/table';

import { PrimeNGModule } from '@modules/shared/prime/prime.module';
import { Aplication } from '@modules/aplicaciones/interfaces';
import { AuthService } from '@modules/auth/services/auth.service';
import { Nom_Rol, Usuario } from '@modules/usuarios/interfaces';
import { RviaLoaderComponent } from "@modules/shared/components/loader/loader.component";
import { DialogFileUploadComponent } from '@modules/shared/components/dialog-file-upload/dialog-file-upload.component';
import { HerramientasService } from '@modules/herramientas/services/herramientas.service';

@Component({
  selector: 'project-sizing',
  imports: [RviaLoaderComponent, PrimeNGModule, DialogFileUploadComponent],
  templateUrl: './project-sizing.component.html',
})
export class ProjectSizingComponent implements OnInit, OnDestroy{
  private authService = inject(AuthService);
  private herramientasService = inject(HerramientasService);
  private destroy$ = new Subject<void>();
  @ViewChild('dt2') dt2!: Table; 
  
  isLoading = signal<boolean>(false);
  user = signal<Usuario | null>(null);
  colums = signal<string[]>(['#', 'ID proyecto', 'Subido el','Nombre', 'Detalles']);
  
  visible: boolean = false;
  aplications: Aplication[] = [];
  
  Nom_Rols = Nom_Rol;

  totalItems: number = 0;
  loadingDataPage: boolean = true;
  rowsPerPageOpts: number[] = [10,15,20,25];

  ngOnInit(): void {
    this.user.set(this.authService.user());
    this.setColumns();
    this.onGetAplicaciones();
  }

  setColumns(): void {
    if(this.user()){
      const rol =  this.user()?.position.nom_rol;
      if (rol === Nom_Rol.ADMINISTRADOR || rol === Nom_Rol.AUTORIZADOR) {
        this.colums.update(c => {
          c.splice(3, 0, 'Usuario');
          return [...c]; 
        });
      }
    }
  }

  filtercustom(event: Event) {
    const input = event.target as HTMLInputElement;
    this.dt2.filterGlobal(input.value, 'contains');
  }

  onGetAplicaciones(): void {
    this.isLoading.set(true);
    this.herramientasService.getSizingApps()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ data, total }) => {
          if (!data) return;
          this.loadingDataPage = true;
          this.totalItems = total;
          this.aplications = [...data];
          this.loadingDataPage = false;

        },
        error: () => {
          this.aplications = [];
          this.totalItems = 0;
        }
      });  
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}

