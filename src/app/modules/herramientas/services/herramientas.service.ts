import { Injectable } from '@angular/core';
import { catchError, delay, map, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { NotificationsService } from '@modules/shared/services/notifications.service';
import { CheckmarxPDFCSV } from '@modules/shared/interfaces/checkmarx.interface';
import { AplicacionesService } from '@modules/aplicaciones/services/aplicaciones.service';
import { Aplication, AplicationsData, ArquitecturaOpciones } from '@modules/aplicaciones/interfaces';
import { AppAddonsCall, FormAddonCall, FormPDFtoCSV, OriginMethod, StartProcess } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class HerramientasService {
  private readonly baseUrl = environment.baseURL;

  constructor(
    private http: HttpClient,
    private notificationsService: NotificationsService,
    private aplicacionesService: AplicacionesService
  ) { }

  downloadCSVFile(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/checkmarx/download/${id}`, { responseType: 'blob' })
      .pipe(
        catchError(error => this.handleError(error, OriginMethod.GETDOWNLOADCSV))
      );
  }

  makeCSVFile({ idu_aplicacion, file }: FormPDFtoCSV): Observable<CheckmarxPDFCSV> {
    const formData = new FormData();
    formData.append('idu_aplicacion', idu_aplicacion.toString());
    formData.append('file', file);

    return this.http.post<CheckmarxPDFCSV>(`${this.baseUrl}/checkmarx/recoverypdf`, formData)
      .pipe(
        tap(resp => {
          if (resp && !resp.isValid) {
            this.handleError(new Error('PDF no válido'), OriginMethod.POSTMAKECSVPY);
          }

          if (resp && resp.isValid && resp.checkmarx) {
            this.aplicacionesService.changes = true;
          }

          this.messageStartRVIAProcess(resp.isValidProcess,resp.messageRVIA);
        }),
        catchError(error => this.handleError(error, OriginMethod.POSTMAKECSV))
      );
  }

  addonsCall(form: FormAddonCall) {
    const body = { ...form };
    return this.http.post<AppAddonsCall>(`${this.baseUrl}/rvia`, body)
      .pipe(
        tap((app) => {
          this.messageStartRVIAProcess(app.isProccessValid,app.message);
        }),
        tap((app) => this.aplicacionesService.changeStatusInProcess(app.idu_aplicacion,form.opc_arquitectura)),
        catchError(error => this.handleError(error, OriginMethod.POSTSTARTADDON))
      );
  }

  startProcessRateCodeRVIA(idu_aplicacion: number): Observable<Aplication> {
    const body = { opcArquitectura: ArquitecturaOpciones.EVALUATION };
    return this.http.patch<Aplication>(`${this.baseUrl}/applications/rate-project/${idu_aplicacion}`, body)
      .pipe(
        tap((app) => {
          const title = 'Proceso iniciado';
          const content = `¡El proceso para calificar código de la aplicación ${app.nom_aplicacion} ha iniciado con éxito!`;
          this.notificationsService.successMessage(title, content);
        }),
        tap(() => this.aplicacionesService.changes = true),
        catchError(error => this.handleError(error, OriginMethod.PATCHRATECODE))
      );
  }

  startProcessTestCasesRVIA(idu_aplicacion: number): Observable<Aplication> {
    const body = { opcArquitectura: ArquitecturaOpciones.TEST_CASES };
    return this.http.patch<Aplication>(`${this.baseUrl}/applications/test-cases/${idu_aplicacion}`, body)
      .pipe(
        tap((app) => {
          const title = 'Proceso iniciado';
          const content = `¡El proceso para generar casos de prueba de la aplicación ${app.nom_aplicacion} ha iniciado con éxito!`;
          this.notificationsService.successMessage(title, content);
        }),
        tap(() => this.aplicacionesService.changes = true),
        catchError(error => this.handleError(error, OriginMethod.PATCHRTESTCASE))
      );
  }

  startProcessDocumentationRVIA(idu_aplicacion: number, tipoDoc: string): Observable<StartProcess> {
    const body = { 
      opcArquitectura: tipoDoc === 'overview' 
      ? ArquitecturaOpciones.DOC_CMPLT 
      : ArquitecturaOpciones.DOC_CODE
    };
    const endpoint = tipoDoc === 'overview' ? 'documentation' : 'documentation-code';

    return this.http.patch<StartProcess>(`${this.baseUrl}/applications/${endpoint}/${idu_aplicacion}`, body)
      .pipe(
        tap(({ application }) => {
          const title = 'Proceso iniciado';
          const content = `¡El proceso para documentar la aplicación ${application.nom_aplicacion} ha iniciado con éxito!`;
          this.notificationsService.successMessage(title, content);
        }),
        tap(() => this.aplicacionesService.changes = true),
        catchError(error => this.handleError(error, OriginMethod.PATCHRDOCCODE))
      );
  }

  getSizingApps(): Observable<AplicationsData>{
    return this.http.get<Aplication[]>(`${this.baseUrl}/applications/dim`)
      .pipe(
        map((apps) => {
          return { 
            data: apps,
            total: apps.length
          }
        }),
        delay(1000),
        catchError(error => this.handleError(error, OriginMethod.GETAPPS))
      )
  }

  getAppDetail(idu_proyecto: string) {
    return this.http.get(`${this.baseUrl}/applications/report-dim/${idu_proyecto}`)
      .pipe(
        tap(r => console.log(r)),
        catchError(error => this.handleError(error, OriginMethod.GETAPPDETAIL,idu_proyecto))
      );
  }

  private messageStartRVIAProcess(isStart: boolean, message: string): void {
    const content = `${message}`
    if(isStart){
      const title = 'Proceso iniciado';
      this.notificationsService.successMessage(title,content);
      return
    }

    if(!isStart){
      const title = 'Proceso no iniciado';
      this.notificationsService.errorMessage(title,content);
      return
    }
  }

  private handleError(error: any, origin: OriginMethod, extra?: string | number) {
    const title = 'Error';

    const errorsMessages = {
      GETAPPS: 'Error al obtener las aplicaciones.',
      GETAPPDETAIL: `Error al obtener el detalle de la aplicación. ${extra ?? ''}`,
      GETDOWNLOADCSV: 'Error al descargar el CSV.',
      PATCHRDOCCODE: 'Ha ocurrido un error al iniciar el proceso de documentar aplicación. Inténtalo más tarde.',
      PATCHRTESTCASE: 'Ha ocurrido un error al iniciar el proceso de casos de prueba. Inténtalo más tarde.',
      PATCHRATECODE: 'Ha ocurrido un error al iniciar el proceso de calificación de código. Inténtalo más tarde.',
      POSTMAKECSV: 'Ha ocurrido un error al generar el CSV del PDF.',
      POSTMAKECSVPY: 'Ha ocurrido un error al generar el CSV, verifica que tu PDF sea válido para vulnerabilidades.',
      POSTSTARTADDON: 'Ha ocurrido un error al iniciar el proceso. Inténtalo más tarde.',
    };

    this.notificationsService.errorMessage(title, errorsMessages[origin]);
    return throwError(() => new Error('Error en la solicitud'));
  }
}
