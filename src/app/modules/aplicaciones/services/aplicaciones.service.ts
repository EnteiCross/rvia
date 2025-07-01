import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, delay, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { NotificationsService } from '@modules/shared/services/notifications.service';
import { CheckmarxInfo, CheckmarxPDFCSV } from '@modules/shared/interfaces/checkmarx.interface';
import { AppsSelectIA } from '@modules/herramientas/interfaces/appsSelectIA.interface';
import { Aplication, AplicationsData, AppsToUseSelect, ArquitecturaOpciones, 
  FormNewApp, Language, NumberAction, Opt_architec, OriginMethod, ResponseAddApp,
  StatusApp } from '../interfaces';
import { AppOrg } from '@modules/auth/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AplicacionesService {
  private readonly baseUrl = environment.baseURL;
  private http = inject( HttpClient);
  private notificationsService = inject( NotificationsService);

  changes: boolean = false;

  appPDFSubject = new BehaviorSubject<Aplication | null>(null);
  appPDF$: Observable<Aplication | null> = this.appPDFSubject.asObservable();

  allApps: AplicationsData = {
    data: [],
    total: -1 
  }

  private cacheBusinesApps = signal<AppOrg[]>([]);

  clearDataApps(): void {
    this.allApps.data = [];
    this.allApps.total = -1; 
  }

  //GET
  getAplicaciones(): Observable<AplicationsData> {
    if(this.allApps.data.length === 0 || this.changes){
      return this.http.get<Aplication[]>(`${this.baseUrl}/applications`)
        .pipe(
          tap(apps => {
            this.allApps.data = apps;
            this.allApps.total = apps.length;
            this.changes = false;
          }),
          map(() => ({...this.allApps })),
          delay(1000),
          catchError(error => this.handleError(error, OriginMethod.GETAPPS))
        )
      }
      else{
        return of({...this.allApps})
      }
  }

  getSanitationApps(): Observable<AppsToUseSelect[]> {
    return of(this.allApps)
      .pipe(
        switchMap(infoApps => {
          if(infoApps.total !== -1 && !this.changes){
            return of(this.filterSanitationApps([...infoApps.data]))
          }
          return this.getAplicaciones().pipe(
            map(() => {
              return this.filterSanitationApps([...this.allApps.data])
            })
          )
        })
      );
  }

  getWaitingApps(): Observable<AppsSelectIA[]> {
    return of(this.allApps)
    .pipe(
      switchMap(infoApps => {
        if(infoApps.total !== -1){
          return of(this.filterWaitingApps([...infoApps.data]))
        }
        return this.getAplicaciones().pipe(
          map(() => {
            return this.filterWaitingApps([...this.allApps.data])
          })
        )
      })
    );
  }
  
  getSomeArchitecApps(type: keyof Opt_architec): Observable<AppsToUseSelect[]>{
    return of(this.allApps)
    .pipe(
      switchMap(infoApps => {
        if(infoApps.total !== -1 && !this.changes){
          return of(this.filterTypeProcessApps([...infoApps.data],type))
        }
        return this.getAplicaciones().pipe(
          map(() => {
            return this.filterTypeProcessApps([...this.allApps.data],type)
          })
        )
      })
    );
  }

  private filterWaitingApps(data: Aplication[]): AppsSelectIA[] {
    return data
      .filter(app => {
        return app.opc_estatus_doc === StatusApp.ONHOLD || //documentacion completa
          app.opc_estatus_doc_code === StatusApp.ONHOLD || //documentacion por codigo
          app.opc_estatus_caso === StatusApp.ONHOLD ||     //casos de prueba
          app.opc_estatus_calificar === StatusApp.ONHOLD   //calificacion en espera
      })
      .map( app => {
        const waiting = [];
        if(app.opc_estatus_doc === StatusApp.ONHOLD){
          waiting.push({
            value: ArquitecturaOpciones.DOC_CMPLT,
            name: 'Generar documentación completa'
          });
        }
        if(app.opc_estatus_doc_code === StatusApp.ONHOLD){
          waiting.push({
            value: ArquitecturaOpciones.DOC_CODE,
            name: 'Generar documentación por código'
          });
        }
        if(app.opc_estatus_caso === StatusApp.ONHOLD){
          waiting.push({
            value: ArquitecturaOpciones.TEST_CASES,
            name: 'Generar casos de prueba'
          });
        }
        if(app.opc_estatus_calificar === StatusApp.ONHOLD){
          waiting.push({
            value: ArquitecturaOpciones.EVALUATION,
            name: 'Generar calificación de proyecto'
          });
        }

        return { 
          app: app.idu_aplicacion, 
          value: `${app.idu_proyecto} - ${app.nom_aplicacion}`,
          waiting
        }
      })
  }

  private filterSanitationApps(data: Aplication[]): AppsToUseSelect[]{
    return data
      .filter(app => app.num_accion === NumberAction.SANITIZECODE)
      .map( app => {
        return { value: app.idu_aplicacion, name: `${app.idu_proyecto} - ${app.nom_aplicacion}`}
      })
  }

  private filterTypeProcessApps(data: Aplication[],type: number): AppsToUseSelect[] {
    return data
      .filter(app => !app.opc_arquitectura[type])
      .map( app => {
        return { value: app.idu_aplicacion, name: `${app.idu_proyecto} - ${app.nom_aplicacion}`}
      });
  }
  
  getCSVAplication(id: number): Observable<CheckmarxInfo> {
    return this.http.get<CheckmarxInfo>(`${this.baseUrl}/checkmarx/${id}`)
    .pipe(
      catchError(error => this.handleError(error, OriginMethod.GETCSVAPP))
    );
  }
 
  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.baseUrl}/languages`)
    .pipe(
      delay(1000),
      catchError(error => this.handleError(error, OriginMethod.GETLANGUAGES))
    );    
  }

  getBusinessApp(): Observable<AppOrg[]> {
    if(this.cacheBusinesApps().length > 0){
      return of(this.cacheBusinesApps());
    }
      
    return this.http.get<AppOrg[]>(`${this.baseUrl}/apps-area`)
    .pipe(
      delay(1000),
      tap(positions => this.cacheBusinesApps.set(positions)),
      catchError(error => this.handleError(error, OriginMethod.GETBUSINESSAPPS))
    );    
  }

  downloadFile(id: number, main: boolean, archi?: ArquitecturaOpciones | 0): Observable<Blob> {
    let url: string = '';

    if(main){
      url = `${this.baseUrl}/applications/zip/${id}`;
    }else {
      if(archi === ArquitecturaOpciones.DOC_CMPLT || archi === ArquitecturaOpciones.DOC_CODE){
        url = `${this.baseUrl}/applications/download-doc/${id}`;
      }
    }
  
    return this.http.get(url,{ responseType: 'blob' })
      .pipe(
        catchError(error => this.handleError(error, OriginMethod.GETDOWNLOAD))
      );
  }

  //POST
  saveProjectWitPDF(form: FormNewApp): Observable<ResponseAddApp> {
    const formData = new FormData();

    formData.append('num_accion',form.action.toString()); 
    formData.append('opc_arquitectura', JSON.stringify(form.opt_archi));
    formData.append('idu_aplicacion_de_negocio',form.idu_aplicacion_de_negocio.toString());
    
    if(form.action === NumberAction.MIGRATION){
      formData.append('opc_lenguaje',form.language.toString());
    }

    if(form.type === 'zip'){ 
      formData.append('files',form.zipFile!);
      if(form.pdfFile) formData.append('files',form.pdfFile!);
    
      return this.http.post<ResponseAddApp>(`${this.baseUrl}/applications/files`,formData)
        .pipe(
          delay(1500),
          tap((resp) => this.savedSuccessfully(resp)),
          catchError(error => this.handleError(error, OriginMethod.POSTSAVEFILE))
        );
    }

    if(form.type === 'git'){
      formData.append('url',form.urlGit);
      if(form.pdfFile) formData.append('file',form.pdfFile);

      let endPoint: string;
      if(form.urlGit.includes('github.com')){
        endPoint = 'git';
      }else if(form.urlGit.includes('gitlab.com')){
        endPoint = 'gitlab';
      }else{
        return this.handleError(new Error('Error url'), OriginMethod.POSTSAVEFILE);
      }

      return this.http.post<ResponseAddApp>(`${this.baseUrl}/applications/${endPoint}`,formData)
        .pipe(
          tap((resp) => this.savedSuccessfully(resp)),
          catchError(error => this.handleError(error, OriginMethod.POSTSAVEFILE))
        );
    }

    return this.handleError(new Error('Error load new app'), OriginMethod.POSTSAVEFILE);
  }

  savePDFFile(pdfFile: File, app: Aplication): Observable<any> {
    
    const formData = new FormData();
    formData.append('idu_aplicacion',app.idu_aplicacion.toString());
    formData.append('file', pdfFile);
    
    return this.http.post<CheckmarxPDFCSV>(`${this.baseUrl}/checkmarx/upload-pdf`,formData)
    .pipe(
      tap(resp => {
        if(resp && !resp.isValid){
          this.handleError(new Error('PDF no válido'), OriginMethod.POSTSAVEPDF)
        }

        if(resp && resp.isValid){
          const title = 'Archivo PDF guardado';
          const content = `¡El archivo .PDF del aplicativo ${app.nom_aplicacion} se ha subido con éxito!`
          this.notificationsService.successMessage(title,content);
          this.changes = true;
        }

        this.startRVIAProcess(resp.isValidProcess,resp.messageRVIA);
      }), 
      catchError(error => this.handleError(error, OriginMethod.POSTSAVEPDF))
    );
  }
  //PATCH
  setNewStatus(app: Aplication, newStatus: number): Observable<Aplication> {
    const body = { estatusId: newStatus };
    return this.http.patch<Aplication>(`${this.baseUrl}/applications/${app.idu_aplicacion}`,body)
      .pipe(
        delay(1000),
        tap(() => {
          const title = 'Estatus actualizado';
          const content = `¡El estado de la aplicación ${app.nom_aplicacion} 
          se ha actualizado a ${app.applicationstatus.des_estatus_aplicacion} con éxito!`
          this.notificationsService.successMessage(title,content);
        }),
        catchError(error => this.handleError(error, OriginMethod.UPDATESTATUS,app.nom_aplicacion))
      );
  }

  private savedSuccessfully(resp: ResponseAddApp){
    this.changes = true
    const title = 'Aplicativo guardado';
    const content = `¡El aplicativo ${resp.application.nom_aplicacion} se ha subido con éxito!`
    this.notificationsService.successMessage(title,content);
    
    if(!resp.checkmarx){
      const title = 'Archivo .csv no generado';
      const content = `¡El aplicativo se ha guardado correctamente pero el archivo .csv no se genero.`
      this.notificationsService.warnMessage(title,content);
    }

    if(resp.rviaProcess){
      this.startRVIAProcess(resp.rviaProcess.isValidProcess,resp.rviaProcess.messageRVIA);
    }
  }

  changeStatusInProcess(idu_aplicacion: number, opt: number): void {
    const temp = [...this.allApps.data];
    let appIndex = temp.findIndex(app => app.idu_aplicacion === idu_aplicacion);
    if(appIndex !== -1){
      if(opt === ArquitecturaOpciones.DOC_CMPLT) 
        temp[appIndex].opc_estatus_doc = StatusApp.PROGRESS; 
      if(opt === ArquitecturaOpciones.DOC_CODE) 
        temp[appIndex].opc_estatus_doc_code = StatusApp.PROGRESS; 
      if(opt === ArquitecturaOpciones.TEST_CASES) 
        temp[appIndex].opc_estatus_caso = StatusApp.PROGRESS; 
      if(opt === ArquitecturaOpciones.EVALUATION) 
        temp[appIndex].opc_estatus_calificar = StatusApp.PROGRESS; 
    }
    this.allApps.data = [...temp];
  }

  private startRVIAProcess(isStart: boolean, message: string): void {
    if(isStart){
      const title = 'Proceso iniciado';
      const content = `${message}`
      this.notificationsService.successMessage(title,content);
      return
    }

    if(!isStart){
      const title = 'Proceso no iniciado';
      const content = `${message}`
      this.notificationsService.errorMessage(title,content);
      return
    }
  }

  handleError(error: Error, origin: OriginMethod, extra?: string | number) {
    const title = 'Error';
    
    const errorsMessages = {
      GETAPPS: 'Error al cargar información', 
      GETBUSINESSAPPS: 'Error al cargar información de aplicaciones de negocio.',
      GETCSVAPP: 'Error al cargar información del CSV',
      GETDOWNLOAD: 'Error al descargar el 7z',
      GETLANGUAGES: 'Ha ocurrido un error al cargar información. Inténtalo de nuevo.',
      POSTSAVEPDF: `Ocurrió un error al guardar el archivo PDF. Inténtalo de nuevo`,
      POSTSAVEFILE: `Ocurrió un error al guardar el aplicativo. Inténtalo de nuevo`,
      UPDATESTATUS: `¡El estado de la aplicación ${extra} no se pudo actualizar!`
    };

    this.notificationsService.errorMessage(title,errorsMessages[origin]);
    return throwError(() => 'ERROR ERROR ERROR');
  }
}