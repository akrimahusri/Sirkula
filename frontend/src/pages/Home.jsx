import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Leaf, Recycle, TrendingUp, Search, ShieldCheck, MapPin, Camera, CreditCard, ArrowRight } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span className="font-bold tabular-nums">{count.toLocaleString('id-ID')}{suffix}</span>;
};

const Home = () => {
  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-brand-light overflow-hidden pt-20 pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green font-medium text-sm mb-6">
              <Leaf size={16} /> <span>Selamatkan Bumi, Dapatkan Untung</span>
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
              Ubah Sampah Jadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">Peluang Nyata</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-600 mb-10">
              Sirkula menghubungkan Anda dengan mitra daur ulang terpercaya di sekitar Anda. Jual sampah lebih mudah, cepat, dan transparan.
            </motion.p>
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-brand-green hover:bg-brand-dark text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                Jual Sampah Sekarang <ArrowRight size={20} />
              </Link>
              <Link to="/marketplace" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-2">
                <Search size={20} /> Cari Mitra
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 -left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-10 w-72 h-72 bg-brand-green rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </section>

      {/* Stats / Counter Section */}
      <section className="bg-brand-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-green-800">
            <div className="flex flex-col items-center p-4">
              <Recycle className="w-12 h-12 text-brand-green mb-4 opacity-80" />
              <div className="text-4xl font-extrabold mb-2"><AnimatedCounter end={1250} suffix=" Ton" /></div>
              <p className="text-green-100 font-medium uppercase tracking-wider text-sm">Sampah Terdaur Ulang</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <ShieldCheck className="w-12 h-12 text-brand-green mb-4 opacity-80" />
              <div className="text-4xl font-extrabold mb-2"><AnimatedCounter end={85} /></div>
              <p className="text-green-100 font-medium uppercase tracking-wider text-sm">Mitra Terverifikasi</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <TrendingUp className="w-12 h-12 text-brand-green mb-4 opacity-80" />
              <div className="text-4xl font-extrabold mb-2"><AnimatedCounter end={3420} /></div>
              <p className="text-green-100 font-medium uppercase tracking-wider text-sm">Pengguna Aktif</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Cara Kerja Sirkula</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Sirkulasi ekonomi yang sehat dimulai dari langkah sederhana Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: MapPin, title: '1. Pilih Mitra', desc: 'Cari pengepul terdekat yang menerima jenis sampah Anda menggunakan Peta kami.' },
              { icon: Camera, title: '2. Foto Sampah', desc: 'Unggah foto kondisi barang dan masukkan estimasi berat untuk dinilai.' },
              { icon: TrendingUp, title: '3. Atur Jemputan', desc: 'Atur jadwal, lalu kurir/mitra akan menjemput langsung ke lokasi Anda.' },
              { icon: CreditCard, title: '4. Terima Bayaran', desc: 'Transaksi selesai, uang tunai atau digital langsung masuk ke saku Anda!' }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="relative bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-brand-green/30 hover:shadow-lg transition-all group"
              >
                <div className="w-16 h-16 bg-brand-light text-brand-green rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Apa Kata Mereka?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
              <div className="text-brand-green text-5xl absolute top-4 right-6 opacity-20 font-serif">"</div>
              <p className="text-gray-700 italic mb-6 relative z-10 text-lg">"Sejak pakai Sirkula, nyari pengepul botol plastik bekas cafe jadi gampang banget. Kurir datang tepat waktu, harganya juga transparan!"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">A</div>
                <div>
                  <h4 className="font-bold text-gray-900">Ahmad Rizki</h4>
                  <p className="text-sm text-gray-500">Pemilik Kedai Kopi</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-green/20 relative">
              <div className="text-brand-green text-5xl absolute top-4 right-6 opacity-20 font-serif">"</div>
              <p className="text-gray-700 italic mb-6 relative z-10 text-lg">"Aplikasi ini ngebantu usaha rongsok saya dapet pasokan yang pasti tiap hari. Rute penjemputan juga bisa di-tracking."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center font-bold">B</div>
                <div>
                  <h4 className="font-bold text-gray-900">Budi Daur Ulang</h4>
                  <p className="text-sm text-brand-green font-medium">Mitra Pengepul</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
