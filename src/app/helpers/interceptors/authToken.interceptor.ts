import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "@modules/auth/services/auth.service";
        
const regexApps = /\/applications|\/applications\/\d+|\/applications\/git|\/applications\/gitlab/;
const methodsApps = ['GET','PATCH','POST'];
const checkRegex = (url: string): boolean => {
    return regexApps.test(url);
}

const regexCheckmarx = /\/checkmarx|\/checkmarx\/recoverypdf|\/checkmarx\/\d+/;
const methodsCheck = ['GET','POST'];
const checkRegexCheck = (url: string): boolean => {
    return regexCheckmarx.test(url);
}

const regexUsers = /\/auth\/\d+|\/auth/;
const methodsUsers = ['GET','PATCH','DELETE'];
const checkRegexUsers = (url: string): boolean => {
    return regexUsers.test(url);
} 

const regexDown = /\/applications\/zip\/\d+/;
const checkRegexDown = (url: string): boolean => {
    return regexDown.test(url);
}

export const AuthInterceptor = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {       
    const authService = inject(AuthService);
    
    try{
        const url = request.url;
        const method = request.method;
        
        if((url.includes('/auth/login') || url.includes('/auth/register') && method === 'POST')){
            return next(request);
        }
        
        const token: string | null =  localStorage.getItem('token') || null;
        const newReq = request.clone({
            headers: request.headers.set('Authorization',`Bearer ${token}`)
        });

        if(url.includes('/auth/check-status') && method === 'GET'){
            return next(newReq);
        }

        if(url.includes('/auth/change-password') && method === 'POST'){
            return next(newReq);
        }
 
        if(token && authService.user()){

            if(checkRegexDown(url) && method === 'GET'){
                return next(newReq);
            }

            if(url.includes('applications/files') && method === 'POST'){
                return next(newReq);
            }

            if(checkRegexCheck(url) && methodsCheck.includes(method)){
                return next(newReq);    
            }

            newReq.headers.set( 'Content-Type','application/json');
            
            if(checkRegex(url) && methodsApps.includes(method)){
                return next(newReq);
            }

            if(checkRegexUsers(url) && methodsUsers.includes(method)){
                return next(newReq);    
            }

            if(url.includes('/languages') && method === 'GET'){
                return next(newReq);    
            }

            if(url.includes('/centros') && method === 'POST'){
                return next(newReq);    
            }
        }

        return next(request);
    } catch(e){
        return next(request);
    }
}