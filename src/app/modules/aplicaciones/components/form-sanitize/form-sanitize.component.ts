import { Component, ViewChild, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { RadioButtonClickEvent } from 'primeng/radiobutton';

import { PrimeNGModule } from '@modules/shared/prime/prime.module';
import { AplicacionesService } from '@modules/aplicaciones/services/aplicaciones.service';
import { ValidationService } from '@modules/shared/services/validation.service';
import { Language, NumberAction } from '@modules/aplicaciones/interfaces';
import { AppOrg } from '@modules/auth/interfaces';
import { RviaLoaderComponent } from '@modules/shared/components/loader/loader.component';

@Component({
    selector: 'form-sanitize',
    templateUrl: './form-sanitize.component.html',
    styleUrls: ['./form-sanitize.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, PrimeNGModule, RviaLoaderComponent]
})
export class FormSanitizeComponent implements OnInit, OnDestroy {
  @ViewChild('zipInput', { static: false }) zipInput!: ElementRef;
  @ViewChild('pdfInput', { static: false }) pdfInput!: ElementRef;
  @ViewChild('inputspan', { static: false }) spanInput!: ElementRef;
  @ViewChild('inputspanpdf', { static: false }) spanpdfInput!: ElementRef;
  private destroy$ = new Subject<void>();
  private aplicacionesService = inject(AplicacionesService);
  private vldtnSrv = inject(ValidationService);
  private router = inject(Router);
  
  txtSizeFile: number = 340;
  txtSizepdfFile: number = 340;
  formFiles!: FormGroup;
  isUploadFile: boolean = false;
  isUploadProject: boolean = false;

  radioOps = [
    { value: 'zip', image: 'Cargar.webp', tooltip: '.zip o .7z'},
    { value: 'git', image: 'gitlab.webp', tooltip: 'URL de Gitlab o Github'}
  ];

  actionsOps = [
    { value: NumberAction.UPDATECODE, txt: 'Actualizar código (Migración de versión a la más actual del mismo lenguaje)' },
    // { value: NumberAction.MIGRATION, txt: 'Migrar código (Migración de un lenguaje de programación a otro)' },
    { value: NumberAction.SANITIZECODE, txt: 'Sanitizar código (Mitigación de vulnerabilidades checkmarx)' },
    { value: NumberAction.NONE, txt: 'No modificar código' },
  ];
  actionOpsValues: number[] = this.actionsOps.map(a => a.value);
  
  actionArchitec = [
    { txt: 'Generar documentación completa', form: 'archiDocOverOpt' },
    { txt: 'Generar documentación por código', form: 'archiDocCodeOpt' },
    { txt: 'Generar casos de pruebas', form: 'archiCasesOpt' },
    { txt: 'Generar dimensionamiento', form: 'archiDimOpt' },
    // { txt: 'Generar calificación de proyecto', form: 'archiRateOpt' },
  ];
  
  isLoading: boolean = true;
  lenguagesOps: Language[] = [];
  businessAppsOps: AppOrg[] = [];

  activeIndex: number = 0;
  selectedValue: number = 1;
  readonly headersBase = [
    { label: 'Acciones'},
    { label: 'Tipo de proyecto'},
    { label: 'Seleccionar proyecto'},
    { label: 'Resumen'},
  ]; 
  headers = [...this.headersBase];
  NumberAction = NumberAction;

  ngOnInit(): void {
    this.aplicacionesService.getBusinessApp()
    .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if(resp){
            this.initForm();
            this.businessAppsOps = resp;
            this.isLoading = false;
          }
        }
      });
  }
  
  private initForm(): void{
    this.formFiles = new FormGroup({
      action: new FormControl(NumberAction.UPDATECODE),
      archiDocOverOpt: new FormControl([]),
      archiDocCodeOpt: new FormControl([]),
      archiCasesOpt: new FormControl([]),
      archiDimOpt: new FormControl([]),
      archiRateOpt: new FormControl({ value: [], disabled: true }),
      
      architecSelected: new FormControl(null, Validators.required),
      language: new FormControl(null),
      idu_aplicacion_de_negocio: new FormControl(null,[Validators.required]),
      pdfFile: new FormControl(null,[this.vldtnSrv.fileValidation('pdf')]),
      type:    new FormControl('zip',[Validators.required]),
      urlGit:  new FormControl(null,[this.vldtnSrv.isValidGitlabUrl()]),
      zipFile: new FormControl(null,[this.vldtnSrv.fileValidation('zip'),this.vldtnSrv.noWhitespaceValidation()]),
    });
  }

  triggerFileInput(type: string): void {
    if(type === 'zip') this.zipInput.nativeElement.click();
    if(type === 'pdf') this.pdfInput.nativeElement.click();
  }
  
  onFileSelected(event:any, formOption:string): void {
    this.isUploadFile = true;    
    const file = event.target.files[0];
    if(file){
      setTimeout(() => {
        this.formFiles.patchValue({
          [formOption]: file
        });
        this.changeSizeInput(formOption,file.name);
        this.isUploadFile = false;
      }, 1500);
    }else{
      this.isUploadFile = false;
    }
  } 

  changeSizeInput(type: string,filename:string): void{

    if(type === 'zipFile'){
      this.spanInput.nativeElement.textContent = filename;
      this.txtSizeFile = this.spanInput.nativeElement.offsetWidth + 200;
      return
    }

    if(type === 'pdfFile'){
      this.spanpdfInput.nativeElement.textContent = filename;
      this.txtSizepdfFile = this.spanpdfInput.nativeElement.offsetWidth + 200;
      return
    }
  }

  changeRadioAction({ value }: RadioButtonClickEvent): void {
    if(this.selectedValue === value) return;
    
    this.selectedValue = value;
    if(this.selectedValue === NumberAction.SANITIZECODE){
      let itemsOpc = [...this.headersBase];
      itemsOpc.splice(this.headersBase.length - 1,0, { label: 'Seleccionar PDF' });
      this.headers = [...itemsOpc];       
    }else if(this.selectedValue === NumberAction.NONE){
      let itemsOpc = [...this.headersBase];
      itemsOpc.splice(this.headersBase.length - 1,0, { label: 'Arquitectura' });
      this.headers = [...itemsOpc];
    }else {
      this.headers = [...this.headersBase];
    }
  }

  onRadioClick(selectedForm: string): void {
    this.formFiles.patchValue({
      archiDocOverOpt: [],
      archiDocCodeOpt: [],
      archiCasesOpt: [],
      archiRateOpt: [],
      archiDimOpt:  [],
      [selectedForm]: [true]
    });
  }

  changeStep(value: number) {
    if(value < 0){
      if(this.activeIndex === 1){
        this.cleanInput('type');
      }
      
      if(this.activeIndex === 2){
        this.cleanInput('project');
      }
      
      if(this.activeIndex === 3 && this.selectedValue === NumberAction.NONE){
        this.cleanInput('architec');
      }

      if(this.activeIndex === 3 && this.selectedValue === NumberAction.SANITIZECODE){
        this.cleanInput('pdf');
      }
    }

    this.activeIndex += value;
  }
  
  cleanInput(type: string): void {    
    if(type === 'architec'){
      this.formFiles.patchValue({
        archiDocOverOpt: null,
        archiDocCodeOpt: null,
        archiCasesOpt:   null,
        archiRateOpt:    null,
        archiDimOpt: null,
      });
      this.formFiles.patchValue({ architecSelected: null });
    }
    
    if(type === 'type'){
      this.formFiles.patchValue({ type: 'zip' });
    }

    if(type === 'project'){
      this.formFiles.patchValue({
        zipFile: null,
        urlGit: null
      })
      this.txtSizeFile = 340;
    }

    if(type === 'pdf'){
      this.formFiles.patchValue({ pdfFile: null });
      this.txtSizepdfFile = 340;
    }
  }

  checkDisabled(): boolean {

    if(this.activeIndex === 0 && this.selectedValue === NumberAction.MIGRATION){
      return this.formFiles.controls['language'].value === null
    }
 
    if(this.activeIndex === 1){
      return !(this.formFiles.controls['type'].value === 'zip' 
        || this.formFiles.controls['type'].value === 'git')  
    }
 
    if(this.activeIndex === 2){
      const opt = this.formFiles.controls['type'].value;
      const formZip = this.formFiles.controls['zipFile'];
      const zipValid = !formZip.errors && formZip.value !== null;
      const formGit = this.formFiles.controls['urlGit'];
      const gitValid = !formGit.errors && formGit.value !== null;
      const bussinesApp = this.formFiles.controls['idu_aplicacion_de_negocio'];
      return (!(opt === 'zip' && zipValid) && !(opt === 'git' && gitValid)) || !bussinesApp.value;
    }

    if(this.activeIndex === 3 && this.selectedValue === NumberAction.SANITIZECODE){
      return !!this.formFiles.controls['pdfFile'].errors || 
        !this.formFiles.controls['pdfFile'].value 
    }

    if(this.activeIndex === 3 && this.selectedValue === NumberAction.NONE){
      const { 
       archiDocOverOpt, archiDocCodeOpt,
       archiCasesOpt,archiRateOpt, archiDimOpt } = this.formFiles.getRawValue();

        return !archiCasesOpt?.[0] && !archiDocOverOpt?.[0] &&
              !archiDocCodeOpt?.[0] && !archiRateOpt?.[0] && !archiDimOpt?.[0];
      }

    return false;
  }

  get projectName(): string {
    if(this.formFiles.controls['type'].value === 'zip'){
      return this.formFiles.controls['zipFile'].value.name
    }

    if(this.formFiles.controls['type'].value === 'git'){
      return this.formFiles.controls['urlGit'].value;
    }

    return 'error'
  }

  get projectAction(): string {
    const currentAction = this.actionsOps.find(opt => opt.value === this.selectedValue);
    return currentAction ? currentAction.txt : 'Error en nombre de la acción';
  }

  get projectLanguage(): string {
    const num = this.formFiles.controls['language'].value - 1;
    return this.lenguagesOps[num].nom_lenguaje
  }

  get projectType(): string {
    return this.formFiles.controls['type'].value === 'zip' 
      ? this.radioOps[0].tooltip 
      : this.radioOps[1].tooltip 
  }

  get projectPDF(): string {
    return this.formFiles.controls['pdfFile'].value.name; 
  }

  get servicesProject(): string | null {
    const {
      archiDocOverOpt = [],
      archiDocCodeOpt = [],
      archiCasesOpt = [],
      archiRateOpt = [],
      archiDimOpt = [],
    } = this.formFiles.value;
  
    const txtOpc: string[] = [];
  
    if (Array.isArray(archiDocOverOpt) && archiDocOverOpt[0]) txtOpc.push('Documentación completa');
    if (Array.isArray(archiDocCodeOpt) && archiDocCodeOpt[0]) txtOpc.push('Documentación por código');
    if (Array.isArray(archiCasesOpt) && archiCasesOpt[0]) txtOpc.push('Casos de pruebas');
    if (Array.isArray(archiRateOpt) && archiRateOpt[0]) txtOpc.push('Calificación de proyecto');
    if (Array.isArray(archiDimOpt) && archiDimOpt[0]) txtOpc.push('Dimensionamiento de código');
  
    return txtOpc.length > 0 ? txtOpc.join(' - ') : null;
  }

  uploadFiles(): void {
    if(this.isUploadProject) return;

    this.isUploadProject = true;
    const values = this.formFiles.value;

    const opt_archi = {
      '1': Array.isArray(values.archiDocOverOpt) && values.archiDocOverOpt.length > 0,
      '2': Array.isArray(values.archiDocCodeOpt) && values.archiDocCodeOpt.length > 0,
      '3': Array.isArray(values.archiCasesOpt) && values.archiCasesOpt.length > 0,
      '4': Array.isArray(values.archiRateOpt) && values.archiRateOpt.length > 0,
      '5': Array.isArray(values.archiDimOpt) && values.archiDimOpt.length > 0,
    };

    if(!this.actionOpsValues.includes(values.action)) return;
    if(values.type === 'zip' && !values.zipFile) return;
    if(values.type === 'git' && !values.urlGit) return;
    if(values.action === NumberAction.MIGRATION && !values.language) return;
    if(values.action === NumberAction.SANITIZECODE && !values.pdfFile) return;
  
    if(values.action === NumberAction.NONE){
      const v = Object.values(opt_archi).some(opt => opt === true);
      if(!v) return 
    }

    let { 
      archiCasesOpt, 
      archiDocOverOpt, 
      archiDocCodeOpt,
      archiRateOpt,
      archiDimOpt,
      architecSelected,
      ...info
    } = this.formFiles.value;
    
    info = {
      ...info,
      opt_archi
    }

    console.log(info);

    // this.aplicacionesService.saveProjectWitPDF(info)
    //   .pipe(takeUntil(this.destroy$))  
    //   .subscribe({
    //     next: () => {
    //       this.back();
    //     },
    //     error: () => {      
    //       this.isUploadProject = false
    //     }
    //   });
  }

  back(): void {
    this.router.navigate(['apps/list-apps'],{ replaceUrl: true });
  }

  ngOnDestroy(): void{
    this.destroy$.next();
    this.destroy$.complete();
  }
}