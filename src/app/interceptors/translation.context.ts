import { HttpContextToken } from '@angular/common/http';

export const SKIP_TRANSLATION = new HttpContextToken<boolean>(() => false);

// Usage examples:
// http.get('/api/data', { context: new HttpContext().set(SKIP_TRANSLATION, true) })
// http.post('/api/data', body, { context: new HttpContext().set(SKIP_TRANSLATION, false) })