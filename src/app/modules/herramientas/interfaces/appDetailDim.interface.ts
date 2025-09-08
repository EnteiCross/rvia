import { FileDetail } from "./fileDetail.interface";

export interface AppDetailDim {
    aplicacion: {
        id_proyecto: number;
        nom_aplicacion: string;
        fec_creacion: string;
        num_empleado: number;
        nom_correo: string;
        nom_usuario: string;
        num_centro: number;
        nom_cliente_ia: string;
        val_monto: number;
        des_descripcion: string;
      },
    archivos: FileDetail[];
    costo_token: {
        costo_token: number;
        costo_token_extra: number;
    },
    total_consultas: number;
    total_blank: number;
    total_code: number;
    total_comment: number;
}   