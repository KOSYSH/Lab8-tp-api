import FetchPosts from './FetchPosts';
import AxiosUsers from './AxiosUsers';

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>TP – Consommer une API avec React — Yasser</h1>
      <section aria-labelledby="titre-articles">
        <h2 id="titre-articles">Articles (fetch)</h2>
        <FetchPosts />
      </section>
      <section aria-labelledby="titre-utilisateurs" style={{ marginTop: '2rem' }}>
        <h2 id="titre-utilisateurs">Utilisateurs (axios)</h2>
        <AxiosUsers />
      </section>
    </div>
  );
}

export default App;
