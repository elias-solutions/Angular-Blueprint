import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../i18n/language.service';

@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-button-toggle-group
      hideSingleSelectionIndicator
      [value]="language.active()"
      (change)="language.select($event.value)"
      [attr.aria-label]="'app.language' | transloco"
    >
      @for (code of language.languages; track code) {
        <mat-button-toggle [value]="code">{{ code.toUpperCase() }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
  styles: `
    mat-button-toggle-group {
      --mat-button-toggle-height: 36px;
    }
  `,
})
export class LanguageSwitcher {
  protected readonly language = inject(LanguageService);
}
