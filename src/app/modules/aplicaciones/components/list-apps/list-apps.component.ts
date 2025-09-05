import { Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';

import { Table } from 'primeng/table';

import { PrimeNGModule } from '@modules/shared/prime/prime.module';
import { AplicacionesService } from '@modules/aplicaciones/services/aplicaciones.service';
import { AuthService } from '@modules/auth/services/auth.service';
import { Nom_Rol, Usuario } from '@modules/usuarios/interfaces';
import { downloandFile } from '@modules/shared/helpers/downloadFile';
import { Aplication, ArquitecturaOpciones, NumberAction, StatusApp } from '@modules/aplicaciones/interfaces';
import { RviaIconComponent } from '../rvia-icon/rvia-icon.component';
import { RviaLoaderComponent } from '@modules/shared/components/loader/loader.component';

@Component({
    selector: 'list-apps',
    imports: [RouterLink, PrimeNGModule, RviaIconComponent, RviaLoaderComponent, DatePipe],
    templateUrl: './list-apps.component.html',
    styleUrls: ['./list-apps.component.scss']
})
export class ListAppsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('dt2') dt2!: Table; 
  user = signal<Usuario | null>(null);
  aplications: Aplication[] = [];
  
  Nom_Rols = Nom_Rol;
  StatusApps = StatusApp; 
  NumberAction = NumberAction;
  ArquitecturaOpciones = ArquitecturaOpciones;

  totalItems: number = 0;
  loadingDataPage: boolean = true;
  rowsPerPageOpts: number[] = [10,15,20,25];

  colums: string[] = ['#', 'ID proyecto', 'Subido el','Nombre', 'Proceso/Acciones'];
  isLoading = signal<boolean>(true);
  isDownload = signal<boolean>(false);
  lastUpadate = signal<string>('');

  private aplicacionService = inject(AplicacionesService);
  private authService = inject(AuthService);
  
  ngOnInit(): void {
    this.user.set(this.authService.user());
    this.setColumns();
    this.onGetAplicaciones();
  }

  setColumns(): void {
    if(this.user()){
      const rol =  this.user()?.position.nom_rol;
      if (rol === Nom_Rol.ADMINISTRADOR || rol === Nom_Rol.AUTORIZADOR) {
        this.colums.splice(3, 0, 'Usuario');
      }
    }
  }

  filtercustom(event: Event) {
    const input = event.target as HTMLInputElement;
    this.dt2.filterGlobal(input.value, 'contains');
  }

  onGetAplicaciones(): void {
    this.isLoading.set(true);
    this.lastUpadate.set(new Date().toString());
    this.aplicacionService.getAplicaciones()
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

  refreshApps(): void {
    this.aplicacionService.changes = true;
    this.onGetAplicaciones();
  }

  onDownloadFile(app: Aplication, main: boolean = true, archi: ArquitecturaOpciones | 0 = 0 ): void {    
    if(this.isDownload()) return;
    if (main && app.applicationstatus.idu_estatus_aplicacion !== StatusApp.DONE) {
      return;
    }

    if (!main) {
      if(archi === 0) return;
      
      const statusMap = {
        [ArquitecturaOpciones.DOC_CMPLT]: app.opc_estatus_doc,
        [ArquitecturaOpciones.DOC_CODE]: app.opc_estatus_doc_code,
        [ArquitecturaOpciones.TEST_CASES]: app.opc_estatus_caso,
        [ArquitecturaOpciones.EVALUATION]: app.opc_estatus_calificar,
      };

      if (statusMap[archi] !== StatusApp.DONE) return;
    }
    
    this.isDownload.set(true);
    this.aplicacionService.downloadFile(app.idu_aplicacion,main,archi)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          let fileName = `${app.idu_proyecto}_${app.nom_aplicacion}.7z`;
          
          if(archi === ArquitecturaOpciones.DOC_CMPLT){
            fileName = `doc_${fileName}`;
          }else if(archi === ArquitecturaOpciones.DOC_CODE){
            fileName = `dof_${fileName}`;
          }
          downloandFile(blob, fileName);
          this.isDownload.set(false);
        },
        error: () => {
          this.isDownload.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}