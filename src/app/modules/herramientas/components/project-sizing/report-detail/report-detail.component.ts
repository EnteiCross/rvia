import { Component, EventEmitter, inject, Input, input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';

import { HerramientasService } from '@modules/herramientas/services/herramientas.service';
import { PrimeNGModule } from '@modules/shared/prime/prime.module';
import { RviaLoaderComponent } from "@modules/shared/components/loader/loader.component";

@Component({
  selector: 'report-detail',
  imports: [PrimeNGModule, RviaLoaderComponent],
  templateUrl: './report-detail.component.html'
})
export class ReportDetailComponent implements OnInit, OnDestroy {
  idu = input.required<string>();
  private destroy$ = new Subject<void>();
  private _showDetail: boolean = false;
  private herramientasService = inject(HerramientasService);
  isLoading = signal<boolean>(true);
  data =  signal<any>(null);

  @Output() showDetailChange = new EventEmitter<boolean>();
  @Input()
  get showDetail(): boolean {
    return this._showDetail;
  }
  
  set showDetail(value: boolean) {
    this._showDetail = value;
    this.showDetailChange.emit(this._showDetail);
  }

  ngOnInit(): void {
    this.herramientasService.getAppDetail(this.idu())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          console.log(data);
          this.data.set(data);
        },
        error: () => {
          
        }
      });  
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
