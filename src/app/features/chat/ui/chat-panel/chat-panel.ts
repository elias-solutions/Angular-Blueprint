import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { AttachmentKind } from '../../domain/chat';
import { ChatPanelState } from '../../state/chat-panel-state';
import { ChatProviderSelection } from '../../state/chat-provider-selection';
import { ChatSession } from '../../state/chat-session';
import { PendingAttachments } from '../../state/pending-attachments';
import { toolLabelKey } from '../chat-labels';

const ATTACHMENT_ICONS: Readonly<Record<AttachmentKind, string>> = {
  text: 'description',
  image: 'image',
  pdf: 'picture_as_pdf',
};

@Component({
  selector: 'app-chat-panel',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanel {
  protected readonly session = inject(ChatSession);
  protected readonly panel = inject(ChatPanelState);
  protected readonly providers = inject(ChatProviderSelection);
  protected readonly pending = inject(PendingAttachments);
  protected readonly message = new FormControl('', { nonNullable: true });
  protected readonly toolLabelKey = toolLabelKey;
  protected readonly attachmentIcons = ATTACHMENT_ICONS;
  private readonly log = viewChild.required<ElementRef<HTMLElement>>('log');

  constructor() {
    afterRenderEffect(() => {
      this.session.entries();
      const log = this.log().nativeElement;
      log.scrollTop = log.scrollHeight;
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.send();
  }

  protected attach(input: HTMLInputElement): void {
    void this.pending.add(Array.from(input.files ?? []));
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.session.busy()) {
      void this.pending.add(Array.from(event.dataTransfer?.files ?? []));
    }
  }

  protected send(): void {
    const text = this.message.value;
    const hasContent = text.trim() !== '' || this.pending.attachments().length > 0;
    if (!hasContent || this.session.busy()) {
      return;
    }
    this.message.reset();
    void this.session.send(text, this.pending.take());
  }
}
