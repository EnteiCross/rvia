import { inject, signal } from '@angular/core';
import { Router } from "@angular/router";

import { AuthService } from "@modules/auth/services/auth.service";
import { Nom_Rol } from "@modules/usuarios/interfaces";

const forbiddenRoles = [Nom_Rol.INVITADO]; 

export const ToolsGuard = (): boolean => {
    const router = inject(Router);
    const authService = inject(AuthService);

    const currentUser = signal(authService.user());
    
    if(!currentUser()){
        router.navigate(['/auth/login']);
        return false;
    }

    if (currentUser() && forbiddenRoles.includes(currentUser()?.position.nom_rol!)){
        router.navigate(['/apps/home']);
        return false;
    }

    return true;
}