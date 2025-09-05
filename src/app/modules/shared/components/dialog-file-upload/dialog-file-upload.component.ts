import { Component, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { PrimeNGModule } from '@modules/shared/prime/prime.module';
import { AplicacionesService } from '@modules/aplicaciones/services/aplicaciones.service';
import { ValidationService } from '@modules/shared/services/validation.service';
import { NumberAction } from '@modules/aplicaciones/interfaces';

@Component({
  selector: 'dialog-file-upload',
  imports: [PrimeNGModule, ReactiveFormsModule],
  templateUrl: './dialog-file-upload.component.html',
  styleUrl: './dialog-file-upload.component.scss'
})
export class DialogFileUploadComponent implements OnInit, OnDestroy {
  private _visible: boolean = false;
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private appsService = inject(AplicacionesService);
  private vldtnSrv = inject(ValidationService);

  @ViewChild('fileInput') fileInput!: ElementRef;
  @Output() fileUploaded = new EventEmitter<boolean>();
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input()
  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    this._visible = value;
    this.visibleChange.emit(this._visible);
  }

  isLoading = signal<boolean>(false);
  fileName = signal<string| null>(null);
  isUploading = signal<boolean>(false);
  fileForm!: FormGroup;  

  ngOnInit(): void {
    this.fileForm = this.fb.group({
      file: [null,[
          Validators.required, 
          this.vldtnSrv.fileValidation('zip'),
          this.vldtnSrv.noWhitespaceValidation()
        ]]
    });
  }

  onFileSelected(event: Event): void {
    this.fileName.set(null);

    const inputElement = event.target as HTMLInputElement;
    const selectedFile = inputElement.files && inputElement.files.length > 0 
      ? inputElement.files[0] 
      : null;

    setTimeout(() => {
      this.fileForm.patchValue({
        file: selectedFile
      });
      this.fileForm.get('file')?.markAsTouched();
      
      if (this.fileForm.valid) {
          this.isLoading.set(true);
          this.simulateUpload();
      }
    });
  }

  simulateUpload(): void {
    setTimeout(() => {
      this.isLoading.set(false);
      const name = this.fileForm.get('file')?.value.name;
      this.fileName.set(name);

      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }, 2000); 
  }

  reset(): void {
    this.isLoading.set(false);
    this.fileName.set(null);
    this.fileForm.reset()

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  uploadFile(): void {
    if(this.isUploading() || this.fileForm.invalid) return;

    this.isUploading.set(true);
    const opt_archi = {
      1: false,
      2: false,
      3: false,
      4: false,
    };

    const zipFile = this.fileForm.get('file')?.value;
    const info = {
      action: NumberAction.SIZING,
      idu_aplicacion_de_negocio: 0,
      opt_archi,
      zipFile,
      type: 'zip',
      language: 0,
      pdfFile: null,
      urlGit: '',
    };

    this.appsService.saveProjectWitPDF(info)
      .pipe(takeUntil(this.destroy$))  
      .subscribe({
        next: () => {
          this.fileUploaded.emit(true);
          this.visible = false;
        },
        error: () => {      
          this.isUploading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
