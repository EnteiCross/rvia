import { Component, inject, OnDestroy, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';

import { CenterService } from '@modules/herramientas/services/center.service';
import { PrimeNGModule } from '@modules/shared/prime/prime.module';
import { ValidationService } from '@modules/shared/services/validation.service';

@Component({
  selector: 'create-center',
  imports: [ReactiveFormsModule,NgClass, PrimeNGModule],
  templateUrl: './create-center.component.html',
  styles: ``
})
export class CreateCenterComponent implements OnDestroy {

  private destroy$ = new Subject<void>();
  private centerSrvc = inject(CenterService);
  private fb = inject(FormBuilder);
  private vldtnSrvc = inject(ValidationService);
  
  isCreating = signal(false);
  centerForm: FormGroup = this.fb.group({
    nom_centro: ['',[Validators.required, Validators.minLength(3), this.vldtnSrvc.noBlankValidation()]],
    num_centro: [null,[Validators.required, Validators.min(200000), Validators.max(299999)]],
  });

  isValidField(field: string): boolean | null {
    return this.centerForm.controls[field].errors && this.centerForm.controls[field].touched;
  }

  onSubmit(): void {
    if(this.centerForm.invalid){
      this.centerForm.markAllAsTouched();
      return;
    }

    if(this.isCreating()) return;
    
    this.isCreating.set(true);            
    const values = this.centerForm.value;
    values.nom_centro = values.nom_centro.trim();

    this.centerSrvc.createCenter(values)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isCreating.set(false)),
      ).subscribe({
        next: () => {
          this.resetForm();
        }
      });
    }
  
  resetForm(): void {
    this.centerForm.reset();  
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
