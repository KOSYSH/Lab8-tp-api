import { act, renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function response(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

afterEach(() => {
  delete global.fetch;
});

test('ignore les appels reload répétés tant que la requête est en cours', async () => {
  const request = deferred();
  global.fetch = jest.fn(() => request.promise);
  const { result } = renderHook(() => useApi('/articles'));

  act(() => {
    result.current.reload();
    result.current.reload();
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  await act(async () => request.resolve(response([{ id: 1 }])));
  expect(result.current.data).toEqual([{ id: 1 }]);
  expect(result.current.loading).toBe(false);
});

test('une ancienne réponse ne remplace pas les données de la nouvelle URL', async () => {
  const first = deferred();
  const second = deferred();
  global.fetch = jest.fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const { result, rerender } = renderHook(({ url }) => useApi(url), {
    initialProps: { url: '/articles?page=1' }
  });

  rerender({ url: '/articles?page=2' });
  await act(async () => second.resolve(response([{ id: 11 }])));
  await act(async () => first.resolve(response([{ id: 1 }])));
  expect(result.current.data).toEqual([{ id: 11 }]);
  expect(result.current.loading).toBe(false);
});

test('une erreur réseau termine le chargement et reste récupérable avec reload', async () => {
  global.fetch = jest.fn()
    .mockRejectedValueOnce(new Error('Hors ligne'))
    .mockResolvedValueOnce(response([{ id: 1 }]));
  const { result } = renderHook(() => useApi('/articles'));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe('Hors ligne');

  await act(async () => result.current.reload());
  expect(result.current.error).toBeNull();
  expect(result.current.data).toEqual([{ id: 1 }]);
  expect(result.current.loading).toBe(false);
});
