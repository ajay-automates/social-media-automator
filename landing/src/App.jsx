import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import AINews from './components/AINews';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DataDeletion from './pages/DataDeletion';

import RefundPolicy from './pages/RefundPolicy';
import ContactUs from './pages/ContactUs';
import ShippingPolicy from './pages/ShippingPolicy';

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <AINews />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </>
  );
}

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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/data-deletion" element={<DataDeletion />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
      </Routes>
    </div>
  );
}

export default App;
