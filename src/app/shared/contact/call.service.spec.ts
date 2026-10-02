import { Capacitor } from '@capacitor/core';
import { CallService } from './call.service';

describe('CallService', () => {
  let alertOptions: any;
  let present: jasmine.Spy;
  let alertController: { create: jasmine.Spy };
  let translate: { instant: jasmine.Spy };
  let service: CallService;

  beforeEach(() => {
    alertOptions = undefined;
    present = jasmine.createSpy('present');
    alertController = {
      create: jasmine.createSpy('create').and.callFake(async (options: any) => {
        alertOptions = options;
        return { present };
      }),
    };
    translate = {
      instant: jasmine.createSpy('instant').and.callFake((key: string) => key),
    };
    service = new CallService(alertController as any, translate as any);
  });

  it('does not open a call prompt for an invalid phone number', async () => {
    await service.placeCall('Driver', 'not-a-phone');

    expect(alertController.create).not.toHaveBeenCalled();
  });

  it('normalizes a valid number before showing it on desktop', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);

    await service.placeCall('Driver', '+91 98765-43210');

    expect(translate.instant).toHaveBeenCalledWith(
      'CALL.DESKTOP_MESSAGE',
      jasmine.objectContaining({
        name: 'Driver',
        phone: '+919876543210',
      })
    );
    expect(alertOptions.buttons[0].role).toBe('cancel');
    expect(present).toHaveBeenCalled();
  });

  it('offers call and cancel actions on a native device', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);

    await service.placeCall('Retailer', '9876543210');

    expect(alertOptions.buttons.length).toBe(2);
    expect(alertOptions.buttons[0].role).toBe('cancel');
    expect(alertOptions.buttons[1].handler).toEqual(jasmine.any(Function));
    expect(present).toHaveBeenCalled();
  });
});
