import { Arena } from '@/components/arena/arena';
import { Header } from '@/components/arena/header';

const Home = () => (
  <>
    <Header />
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6">
      <Arena />
    </main>
  </>
);

export default Home;
