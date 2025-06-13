export interface LeaderForm {
    nom_empleado: string;
    num_empleado: string;
    num_puesto: number;
}

export interface Leader extends LeaderForm {
    idu_encargado: number;
}

export enum OriginMethodLeader {
    POSTCREATELEADER = 'POSTCREATELEADER'
}