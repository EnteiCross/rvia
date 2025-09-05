import { CheckmarxBaseInfo } from "@modules/shared/interfaces";
import { ApplicationStatus } from "./aplicacionStatus.interface";
import { Opt_architec } from "./optionsArchitecForm.interface";
import { Sourcecode } from "./sourceCode.interface";
import { Usuario } from "@modules/usuarios/interfaces";
import { StatusApp } from "./statusApp.enum";

export interface Aplication {
    applicationstatus: ApplicationStatus;
    checkmarx:         CheckmarxBaseInfo[];
    fec_creacion:      string;
    idu_aplicacion:    number;
    idu_proyecto:      string;
    nom_aplicacion:    string;
    num_accion:        number;
    opc_arquitectura:  Opt_architec;
    opc_estatus_calificar: StatusApp | 0;
    opc_estatus_caso:      StatusApp | 0;
    opc_estatus_doc_code:  StatusApp | 0;
    opc_estatus_doc:       StatusApp | 0;
    opc_lenguaje:      number;
    sequentialId:      number;
    sourcecode:        Sourcecode;
    totalCost:         number;
    user:              Usuario;
}