import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly transloco = inject(TranslocoService);

  success(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000, panelClass: 'snack-success' });
  }

  error(message: string): void {
    this.snackBar.open(message, this.transloco.translate('common.close'), {
      duration: 8000,
      panelClass: 'snack-error',
    });
  }
}
