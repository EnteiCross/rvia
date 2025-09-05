import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ConfirmationService } from 'primeng/api';

import { PrimeNGModule } from '@modules/shared/prime/prime.module';
import { AplicacionesService } from '@modules/aplicaciones/services/aplicaciones.service';
import { HerramientasService } from '@modules/herramientas/services/herramientas.service';
import { AppsToUseSelect, ArquitecturaOpciones } from '@modules/aplicaciones/interfaces';
import { RviaLoaderComponent } from '@modules/shared/components/loader/loader.component';

@Component({
    selector: 'test-case',
    imports: [ReactiveFormsModule, PrimeNGModule, RviaLoaderComponent],
    providers: [ConfirmationService],
    templateUrl: './test-case.component.html',
})
export class TestCaseComponent implements OnInit, OnDestroy { 
  private destroy$ = new Subject<void>();
  isLoadingData = signal<boolean>(true);
  isRequest = signal<boolean>(false);
  label = computed<string>(() => {
    return this.isRequest() ? 'Iniciando' : 'Iniciar';
  });

  form!: FormGroup; 
  appsOpcs: AppsToUseSelect[] = [];

  private fb = inject(FormBuilder);
  private aplicacionesService = inject(AplicacionesService);
  private herramientasService = inject(HerramientasService);
  private confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    this.getApps();
  }

  private getApps(): void {
    this.aplicacionesService.getSomeArchitecApps(ArquitecturaOpciones.TEST_CASES)
      .pipe(takeUntil(this.destroy$))  
      .subscribe((resp) => {        
        if(resp){
          this.initForm();
          this.appsOpcs = resp;
          this.isLoadingData.set(false);          
        }
      });
  }

  private initForm(): void {
    this.form = this.fb.group({  
      idu_aplicacion: [null, [Validators.required]],
    });
  }

  onSubmit(): void { 
    if(this.form.invalid || this.isRequest()){  
      this.form.markAllAsTouched();  
      return;
    }

    const message = '¿Deseas proceder con los casos de prueba?';  
    this.confirmationService.confirm({
      message,
      header: 'Casos de Prueba',  
      icon: 'pi pi-exclamation-triangle text-3xl!',
      acceptButtonStyleClass: 'p-button-success my-2',
      acceptLabel: 'Sí, continuar',
      rejectButtonStyleClass: 'p-button-outlined my-2',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.executeTestCase();  
      },
      reject: () => {
        this.resetValues(); 
      }
    });
  }

  executeTestCase(): void {
    if(this.isRequest()) return;
    this.isRequest.set(true);
    
    const idu_aplicacion = this.form.controls['idu_aplicacion'].value;
    
    this.herramientasService.startProcessTestCasesRVIA(idu_aplicacion)  
      .pipe(takeUntil(this.destroy$))    
      .subscribe({
        next: () => {
          setTimeout(() => {
            this.reset();
          }, 1000);
        },
        error: () => {              
          this.resetValues();
        }
      });
  }

  reset(): void {
    this.form.reset();
    this.resetValues();
    this.getApps();
  }

  resetValues(): void {
    this.isRequest.set(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}