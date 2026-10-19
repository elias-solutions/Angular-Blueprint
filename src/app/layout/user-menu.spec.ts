import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthSession } from '../core/auth/auth-session';
import { translocoTesting } from '../i18n/testing/transloco-testing';
import { UserMenu } from './user-menu';

describe('UserMenu', () => {
  let logout: jest.Mock;

  beforeEach(() => {
    logout = jest.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [translocoTesting()],
      providers: [{ provide: AuthSession, useValue: { userName: signal('admin'), logout } }],
    });
  });

  it('shows the signed-in user and logs out on click', async () => {
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('admin');

    element.querySelector<HTMLButtonElement>('button')!.click();

    expect(logout).toHaveBeenCalled();
  });
});
