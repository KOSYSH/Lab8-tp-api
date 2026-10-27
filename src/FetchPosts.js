import { useState } from 'react';
import { useApi } from './hooks/useApi';

function FetchPosts() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(
    `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10`,
    { client: 'fetch' }
  );
  const posts = data || [];

  return (
    <div>
      <button onClick={reload} disabled={loading}>Recharger les articles</button>
      {loading ? (
        <p role="status">Chargement des articles…</p>
      ) : error ? (
        <p role="alert">Erreur : {error}</p>
      ) : (
        <ul>
          {posts.map(post => <li key={post.id}>{post.title}</li>)}
        </ul>
      )}
      <p>Page {page}</p>
      <button onClick={() => setPage(current => current - 1)} disabled={loading || page === 1}>
        Précédent
      </button>
      {' '}
      <button onClick={() => setPage(current => current + 1)} disabled={loading || Boolean(error) || posts.length < 10}>
        Suivant
      </button>
    </div>
  );
}

export default FetchPosts;
