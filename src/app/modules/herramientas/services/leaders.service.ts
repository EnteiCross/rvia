import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, delay, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment.prod';
import { NotificationsService } from '@modules/shared/services/notifications.service';
import { Leader, LeaderForm, OriginMethodLeader } from '../interfaces/leader.interface';

@Injectable({
  providedIn: 'root'
})
export class LeadersService {
  private readonly baseUrl = environment.baseURL;

  private http = inject(HttpClient);
  private notificationsService = inject(NotificationsService); 
  
  createLeader(info: LeaderForm): Observable<Leader> {
    return this.http.post<Leader>(`${this.baseUrl}/leader`,info)
     .pipe(
      tap((l) => { 
        const title = 'Centro creado correctamente';
        const message = `El encargado ${l.num_empleado} - ${l.nom_empleado} se ha registrado exitosamente`;

        this.notificationsService.successMessage(title,message, 5000);
      }),
      delay(1200), 
      catchError(error => this.handleError(error, OriginMethodLeader.POSTCREATELEADER))
    );
  }

  private handleError(error: any, origin: OriginMethodLeader, extra?: string | number) {
    const title = 'Upps, algo salió mal';
    const errorsMessages = {
      POSTCREATELEADER: `Ha ocurrido un error al registar encardao. ${ error?.error.message ? error.error.message : '' }`,
    };

    this.notificationsService.errorMessage(title, errorsMessages[origin],5000);
    return throwError(() => new Error('Error en service leader'));
  }
}
