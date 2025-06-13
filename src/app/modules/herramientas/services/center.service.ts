import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, delay, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment.prod';
import { NotificationsService } from '@modules/shared/services/notifications.service';
import { Centro, OriginMethodCentro } from '@modules/herramientas/interfaces';

@Injectable({
  providedIn: 'root'
})
export class CenterService {
  private readonly baseUrl = environment.baseURL;

  private http = inject(HttpClient);
  private notificationsService = inject(NotificationsService); 
  
  createCenter(info: Centro): Observable<Centro> {
    return this.http.post<Centro>(`${this.baseUrl}/centros`,info)
     .pipe(
      tap((c) => { 
        const title = 'Centro creado correctamente';
        const message = `El centro ${c.num_centro} - ${c.nom_centro} se ha creado exitosamente`;

        this.notificationsService.successMessage(title,message, 5000);
      }),
      delay(1200), 
      catchError(error => this.handleError(error, OriginMethodCentro.POSTCREATECENTRO))
    );
  }

    private handleError(error: any, origin: OriginMethodCentro, extra?: string | number) {
      const title = 'Upps, algo salió mal';
      const errorsMessages = {
        POSTCREATECENTRO: `Ha ocurrido un error al crear centro. ${ error?.error.message ? error.error.message : '' }`,
      };
  
      this.notificationsService.errorMessage(title, errorsMessages[origin],5000);
      return throwError(() => new Error('Error en service centro'));
    }
}
