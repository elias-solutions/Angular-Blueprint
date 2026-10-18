import { FormControl } from '@angular/forms';
import { notBlank, notInFuture } from './form-validators';

describe('form-validators', () => {
  describe('notBlank', () => {
    it.each(['', '   '])('rejects %p', (value) => {
      expect(notBlank(new FormControl(value))).toEqual({ blank: true });
    });

    it('accepts text', () => {
      expect(notBlank(new FormControl(' a '))).toBeNull();
    });
  });

  describe('notInFuture', () => {
    it('rejects a future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(notInFuture(new FormControl(tomorrow))).toEqual({ future: true });
    });

    it('accepts today and empty values', () => {
      expect(notInFuture(new FormControl(new Date()))).toBeNull();
      expect(notInFuture(new FormControl(null))).toBeNull();
    });
  });
});
