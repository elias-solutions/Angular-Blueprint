import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BackendSelection } from '../core/backend/backend-selection';
import { PersonApiResolver } from '../features/persons/data/person-api-resolver';

@Component({
  selector: 'app-backend-switcher',
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field subscriptSizing="dynamic" class="backend-field">
      <mat-icon matPrefix>dns</mat-icon>
      <mat-label>Backend</mat-label>
      <mat-select
        [value]="selection.active().id"
        (selectionChange)="selection.select($event.value)"
      >
        @for (backend of selection.backends; track backend.id) {
          <mat-option [value]="backend.id">{{ backend.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
    @if (!resolver.api().capabilities.write) {
      <mat-icon class="read-only" matTooltip="Dieses Backend bietet nur Lesezugriff."
        >lock</mat-icon
      >
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .backend-field {
      width: 300px;
      max-width: 60vw;
    }
  `,
})
export class BackendSwitcher {
  protected readonly selection = inject(BackendSelection);
  protected readonly resolver = inject(PersonApiResolver);
}
