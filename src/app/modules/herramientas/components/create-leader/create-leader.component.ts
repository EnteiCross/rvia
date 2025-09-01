import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';

import { Position } from '@modules/auth/interfaces';
import { AuthService } from '@modules/auth/services/auth.service';
import { LeadersService } from '@modules/herramientas/services/leaders.service';
import { ValidationService } from '@modules/shared/services/validation.service';
import { PrimeNGModule } from '@modules/shared/prime/prime.module';

@Component({
  selector: 'app-create-leader',
  imports: [ReactiveFormsModule,NgClass, PrimeNGModule],
  templateUrl: './create-leader.component.html',
  styles: ``
})
export class CreateLeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private leaderSrvc = inject(LeadersService);
  private fb = inject(FormBuilder);
  private vldtnSrvc = inject(ValidationService);
  private authSrv = inject(AuthService);

  positionsOpcs: Position[] = [];
  isCreating = signal(false);
  leaderForm: FormGroup = this.fb.group({
    nom_empleado: ['',[Validators.required,this.vldtnSrvc.completeUserName(), this.vldtnSrvc.noBlankValidation()]],
    num_empleado: [null,[Validators.required,this.vldtnSrvc.employeeNumber()]],
    num_puesto: [null,[Validators.required]],
  });

  ngOnInit(): void {
    this.authSrv.getPositions()
    .pipe(takeUntil(this.destroy$))
    .subscribe(resp => {
      if(resp){
        this.positionsOpcs = [...resp.slice(0,4)];
      }
    });
  }

  isValidField(field: string): boolean | null {
    return this.leaderForm.controls[field].errors && this.leaderForm.controls[field].touched;
  }

  onSubmit(): void {
    if(this.leaderForm.invalid){
      this.leaderForm.markAllAsTouched();
      return;
    }

    if(this.isCreating()) return;    

    this.isCreating.set(true);          
    this.leaderSrvc.createLeader(this.leaderForm.value)
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
    this.leaderForm.reset();  
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
