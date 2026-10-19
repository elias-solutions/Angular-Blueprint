import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { AppDialog, DIALOG_PANEL_CLASS, DIALOG_WIDTH } from './app-dialog';

@Component({
  selector: 'app-test-dialog',
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button [mat-dialog-close]="'done'">Ok</button>`,
})
class TestDialog {}

describe('AppDialog', () => {
  afterEach(() => document.querySelector('.cdk-overlay-container')?.remove());

  it('opens every dialog with the shared width and panel class', () => {
    void TestBed.inject(AppDialog).open(TestDialog, {});
    TestBed.tick();

    const pane = document.querySelector<HTMLElement>('.cdk-overlay-pane');
    expect(pane?.classList).toContain(DIALOG_PANEL_CLASS);
    expect(pane?.style.width).toBe(DIALOG_WIDTH);
  });

  it('resolves with the dialog result', async () => {
    const result = TestBed.inject(AppDialog).open<TestDialog, object, string>(TestDialog, {});
    TestBed.tick();

    document.querySelector<HTMLButtonElement>('app-test-dialog button')?.click();

    await expect(result).resolves.toBe('done');
  });
});
