import { BackendAPI } from '../src/backendConfig.ts';

describe('BackendAPI customer data methods', () => {
  test('getCustomerData requests customer endpoint with query', async () => {
    const api = new BackendAPI();
    const requestSpy = jest.spyOn(api as any, 'request').mockResolvedValue({});
    await api.getCustomerData('salesforce', { id: '123' });
    expect(requestSpy).toHaveBeenCalledWith('/api/v1/connectors/salesforce/customer?id=123');
  });

  test('updateCustomerData sends PUT with payload', async () => {
    const api = new BackendAPI();
    const requestSpy = jest.spyOn(api as any, 'request').mockResolvedValue({});
    await api.updateCustomerData('bmcHelix', { name: 'Alice' });
    expect(requestSpy).toHaveBeenCalledWith('/api/v1/connectors/bmcHelix/customer', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Alice' })
    });
  });
});
