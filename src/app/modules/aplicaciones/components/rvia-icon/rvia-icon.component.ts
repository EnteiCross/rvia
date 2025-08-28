import { booleanAttribute, Component, Input, OnInit } from '@angular/core';
import { NumberAction, StatusApp } from '../../interfaces';
import { CommonModule } from '@angular/common';
import { PrimeNGModule } from '@modules/shared/prime/prime.module';

@Component({
    selector: 'rvia-icon',
    imports: [PrimeNGModule, CommonModule],
    templateUrl: './rvia-icon.component.html',
    styleUrl: './rvia-icon.component.scss'
})
export class RviaIconComponent implements OnInit{

  @Input({ transform: booleanAttribute }) mainProcess: boolean = false;
  @Input({ required: true }) status: StatusApp = 2;
  @Input({ required: true }) numProcess: number = 0;
  @Input({ required: true }) opcArquitectura: boolean = false;
  
  public NumberAction = NumberAction;  
  public StatusApp = StatusApp;
  public iconName = '';

  nameMainProcess: {[key: number]: string} = {
    0: 'No modificar código',
    1: 'Actualizar código',
    2: 'Sanitizar código',
    3: 'Migrar código'
  }

  nameOtherProcess: {[key: number]: string} = {
    1: 'Documentación completa',
    2: 'Documentación por código',
    3: 'Casos de pruebas',
    4: 'Calificación de código',
    5: 'Dimensionamiento de código'
  }

  nameStatus: {[key: number]: string} = {
    0: 'Sin solicitar',
    1: 'En proceso',
    2: 'En espera',
    3: 'Finalizado',
    4: 'Rechazado'
  }

  colorsStatus: {[key: number]: string} = {
    1: 'icon-process',
    2: 'icon-hold',
    3: 'icon-done',
    4: 'icon-refused'
  } 

  infoIcon = {
    name: '',
    sColor: '',
    sName: ''
  }

  nameIcon: {[key: number]: string} = {
    1: 'pi-file',
    2: 'pi-file',
    3: 'pi-clipboard',
    4: 'pi-check-square',
    5: 'pi-check-square',
  }

  ngOnInit(): void {
    if(this.mainProcess){
      this.infoIcon.name = this.nameMainProcess[this.numProcess];
      this.iconName = 'pi-code';
    }else {
      this.infoIcon.name = this.nameOtherProcess[this.numProcess];
      this.iconName = this.nameIcon[this.numProcess];
    }

    this.infoIcon.sColor = this.colorsStatus[this.status];    
    this.infoIcon.sName = this.getStatus();    
  }

  getStatus(): string {
    return this.numProcess === NumberAction.NONE
      ? 'No aplica'
      : this.nameStatus[this.status] || 'Error';
  }
}
