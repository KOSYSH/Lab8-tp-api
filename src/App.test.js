import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios', () => ({ get: jest.fn() }));

const users = [
  { id: 1, name: 'Leanne Graham', email: 'leanne@example.com' },
  { id: 2, name: 'Ervin Howell', email: 'ervin@example.com' }
];

function postsForPage(page, count = 10) {
  return Array.from({ length: count }, (_, index) => ({
    id: (page - 1) * 10 + index + 1,
    title: `Article ${(page - 1) * 10 + index + 1}`
  }));
}

function response(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

beforeEach(() => {
  global.fetch = jest.fn(url => {
    const page = Number(new URL(url).searchParams.get('_page'));
    return Promise.resolve(response(postsForPage(page)));
  });
  axios.get.mockResolvedValue({ data: users });
});

afterEach(() => {
  jest.clearAllMocks();
  delete global.fetch;
});

test('affiche le chargement, bloque le rechargement puis affiche les deux listes', async () => {
  let finish;
  global.fetch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<App />);

  expect(screen.getByText('Chargement des articles…')).toBeInTheDocument();
  const reload = screen.getByRole('button', { name: 'Recharger les articles' });
  expect(reload).toBeDisabled();
  fireEvent.click(reload);
  expect(global.fetch).toHaveBeenCalledTimes(1);

  await act(async () => finish(response(postsForPage(1))));
  const articles = screen.getByRole('region', { name: 'Articles (fetch)' });
  expect(within(articles).getAllByRole('listitem')).toHaveLength(10);
  expect(screen.getByText('Leanne Graham – leanne@example.com')).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith('https://jsonplaceholder.typicode.com/users');
  expect(reload).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
});

test('charge les pages suivantes et précédentes avec les paramètres de pagination', async () => {
  render(<App />);
  await screen.findByText('Article 1');

  fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
  expect(await screen.findByText('Article 11')).toBeInTheDocument();
  expect(screen.getByText('Page 2')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenLastCalledWith('https://jsonplaceholder.typicode.com/posts?_page=2&_limit=10');

  fireEvent.click(screen.getByRole('button', { name: 'Précédent' }));
  expect(await screen.findByText('Article 1')).toBeInTheDocument();
  expect(screen.getByText('Page 1')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
});

test('filtre les utilisateurs sans tenir compte de la casse ni refaire la requête', async () => {
  render(<App />);
  await screen.findByText('Leanne Graham – leanne@example.com');
  const search = screen.getByRole('textbox', { name: 'Rechercher un utilisateur :' });

  fireEvent.change(search, { target: { value: 'gRaHaM' } });
  expect(screen.getByText('Leanne Graham – leanne@example.com')).toBeInTheDocument();
  expect(screen.queryByText('Ervin Howell – ervin@example.com')).not.toBeInTheDocument();

  fireEvent.change(search, { target: { value: 'introuvable' } });
  expect(screen.getByText('Aucun utilisateur trouvé.')).toBeInTheDocument();
  fireEvent.change(search, { target: { value: '' } });
  expect(screen.getByText('Ervin Howell – ervin@example.com')).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('affiche une erreur HTTP puis recharge les articles et efface l’erreur', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false });
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Erreur : Erreur réseau');
  expect(screen.queryByText('Chargement des articles…')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Recharger les articles' }));
  expect(await screen.findByText('Article 1')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('affiche une erreur Axios puis recharge les utilisateurs', async () => {
  axios.get.mockRejectedValueOnce(new Error('Connexion indisponible'));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Connexion indisponible');
  expect(screen.queryByText('Chargement des utilisateurs…')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Recharger les utilisateurs' }));
  expect(await screen.findByText('Leanne Graham – leanne@example.com')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
});

test('désactive Suivant lorsque la page reçue contient moins de dix articles', async () => {
  global.fetch.mockResolvedValueOnce(response(postsForPage(1, 3)));
  render(<App />);
  await screen.findByText('Article 1');
  expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
});
