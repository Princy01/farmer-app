import { HttpContextToken } from '@angular/common/http';

export const SKIP_TRANSLATION = new HttpContextToken<boolean>(() => false);
