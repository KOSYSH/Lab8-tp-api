import { useState } from 'react';
import { useApi } from './hooks/useApi';

function AxiosUsers() {
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useApi(
    'https://jsonplaceholder.typicode.com/users',
    { client: 'axios' }
  );
  const users = data || [];
  const filtered = users.filter(user =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <button onClick={reload} disabled={loading}>Recharger les utilisateurs</button>
      <p>
        <label htmlFor="recherche-utilisateurs">Rechercher un utilisateur : </label>
        <input
          id="recherche-utilisateurs"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </p>
      {loading ? (
        <p role="status">Chargement des utilisateurs…</p>
      ) : error ? (
        <p role="alert">Erreur : {error}</p>
      ) : filtered.length ? (
        <ul>
          {filtered.map(user => <li key={user.id}>{user.name} – {user.email}</li>)}
        </ul>
      ) : (
        <p>Aucun utilisateur trouvé.</p>
      )}
    </div>
  );
}

export default AxiosUsers;
