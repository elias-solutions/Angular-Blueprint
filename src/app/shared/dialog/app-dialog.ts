import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

export const DIALOG_WIDTH = '560px';

export const DIALOG_PANEL_CLASS = 'app-dialog';

@Injectable({ providedIn: 'root' })
export class AppDialog {
  private readonly dialog = inject(MatDialog);

  open<TComponent, TData, TResult>(
    component: ComponentType<TComponent>,
    data: TData,
  ): Promise<TResult | undefined> {
    const ref = this.dialog.open<TComponent, TData, TResult>(component, {
      data,
      width: DIALOG_WIDTH,
      panelClass: DIALOG_PANEL_CLASS,
    });
    return firstValueFrom(ref.afterClosed());
  }
}
