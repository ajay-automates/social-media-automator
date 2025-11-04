import { useEffect } from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Stats from './components/Stats';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Hero />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
      </div>
  );
}

export default App;
