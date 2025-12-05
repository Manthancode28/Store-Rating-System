import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';

// --- API CONFIG ---
const api = axios.create({ baseURL: 'http://localhost:5000' });


const Button = ({ children, onClick, type = "button", className = "", variant = "primary" }) => {
  const baseStyle = "w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white",
    outline: "border-2 border-gray-600 hover:border-indigo-500 text-gray-300 hover:text-white bg-transparent"
  };
  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// 2. Reusable Input Field
const Input = ({ placeholder, type = "text", value, onChange }) => (
  <input
    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400 mb-4"
    placeholder={placeholder}
    type={type}
    value={value}
    onChange={onChange}
  />
);

// 3. Star Rating Display Component
const StarRating = ({ rating, setRating, interactive = false }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          onClick={() => interactive && setRating(star)}
          className={`w-6 h-6 ${interactive ? 'cursor-pointer transform hover:scale-125 transition-transform' : ''} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// --- PAGES ---

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      setAuth(res.data.role);
    } catch (err) {
      alert('Login failed. Check credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Welcome Back</h2>
        <p className="text-center text-gray-400 mb-8">Sign in to your account</p>
        <form onSubmit={handleLogin}>
          <Input placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" className="mt-2">Sign In</Button>
          <div className="mt-6 text-center">
            <span className="text-gray-400">Don't have an account? </span>
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(form.name.length < 20) return alert("Validation: Name must be at least 20 characters.");
    try {
      await api.post('/auth/signup', form);
      alert('Registration Successful! Please Login.');
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-10">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Create Account</h2>
        <form onSubmit={handleSubmit}>
          <Input placeholder="Full Name (Min 20 chars)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <Input placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <Input type="password" placeholder="Password (Upper, Special)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <Input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <Button type="submit" className="mt-4">Create Account</Button>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-gray-400 hover:text-white transition">← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, stores: 0, ratings: 0 });
  const [stores, setStores] = useState([]);
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '' });
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const sRes = await api.get('/dashboard/stats', { headers: { Authorization: token } });
      setStats(sRes.data);
      const stRes = await api.get('/stores', { headers: { Authorization: token } });
      setStores(stRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const addStore = async (e) => {
    e.preventDefault();
    await api.post('/stores', newStore, { headers: { Authorization: token } });
    setNewStore({ name: '', email: '', address: '' });
    fetchData();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-800 p-6 rounded-xl border border-indigo-500/30 shadow-lg">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider">Total Users</h3>
          <p className="text-4xl font-bold text-indigo-400 mt-2">{stats.users}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-purple-500/30 shadow-lg">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider">Total Stores</h3>
          <p className="text-4xl font-bold text-purple-400 mt-2">{stats.stores}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-pink-500/30 shadow-lg">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider">Total Ratings</h3>
          <p className="text-4xl font-bold text-pink-400 mt-2">{stats.ratings}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Store Form */}
        <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg sticky top-24">
                <h3 className="text-xl font-bold mb-4 text-white">Add New Store</h3>
                <form onSubmit={addStore}>
                    <Input placeholder="Store Name" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} />
                    <Input placeholder="Store Email" value={newStore.email} onChange={e => setNewStore({...newStore, email: e.target.value})} />
                    <Input placeholder="Store Address" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                    <Button type="submit">Add Store</Button>
                </form>
            </div>
        </div>

        {/* Store List */}
        <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4 text-white">Registered Stores</h3>
            <div className="grid gap-4">
                {stores.length === 0 ? <p className="text-gray-500 italic">No stores added yet.</p> : 
                  stores.map(s => (
                    <div key={s.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center hover:bg-gray-750 transition border border-gray-700">
                        <div>
                            <h4 className="text-lg font-bold text-white">{s.name}</h4>
                            <p className="text-sm text-gray-400">{s.email}</p>
                            <p className="text-sm text-gray-500">{s.address}</p>
                        </div>
                        <div className="text-right">
                           <span className="inline-block bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">ID: {s.id}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [stores, setStores] = useState([]);
  const [userRatings, setUserRatings] = useState({}); // Local state for rating input
  const token = localStorage.getItem('token');

  useEffect(() => {
    api.get('/stores', { headers: { Authorization: token } }).then(res => setStores(res.data));
  }, []);

  const handleRatingChange = (storeId, val) => {
    setUserRatings({ ...userRatings, [storeId]: val });
  };

  const sendRating = async (storeId) => {
    const ratingVal = userRatings[storeId] || 5;
    try {
        await api.post('/ratings', { storeId, rating: ratingVal }, { headers: { Authorization: token } });
        alert("Rating Submitted Successfully!");
        // Refresh stores to see updated avg
        const res = await api.get('/stores', { headers: { Authorization: token } });
        setStores(res.data);
    } catch(e) { alert("Error submitting rating"); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">Explore Stores</h1>
        <p className="text-gray-400">Rate your favorite places and help others.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(s => (
          <div key={s.id} className="bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition duration-300 border border-gray-700 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-900/50 p-3 rounded-lg">
                        <span className="text-2xl">🏪</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-gray-900 px-2 py-1 rounded-md">
                        <span className="text-yellow-400">★</span>
                        <span className="font-bold text-white">{s.avg_rating ? Number(s.avg_rating).toFixed(1) : 'New'}</span>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{s.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{s.address}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-500 mb-2">Leave a rating:</p>
                <div className="flex justify-between items-center">
                    <StarRating 
                        rating={userRatings[s.id] || 0} 
                        setRating={(val) => handleRatingChange(s.id, val)} 
                        interactive={true} 
                    />
                    <button 
                        onClick={() => sendRating(s.id)}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition"
                    >
                        Submit
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP SHELL ---

const App = () => {
  const [role, setRole] = useState(localStorage.getItem('role'));

  const logout = () => {
    localStorage.clear();
    setRole(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Navigation Bar */}
        <nav className="bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-700">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg"></div>
                <span className="text-xl font-bold tracking-tight text-white">Rate<span className="text-indigo-400">Sphere</span></span>
            </div>
            {role && (
              <div className="flex items-center gap-4">
                <span className="hidden md:inline text-sm text-gray-400">Logged in as <span className="text-white font-semibold capitalize">{role}</span></span>
                <button onClick={logout} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition text-sm font-semibold border border-red-500/20">
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Content Area */}
        <Routes>
          <Route path="/login" element={!role ? <Login setAuth={setRole} /> : <Navigate to="/" />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            role === 'admin' ? <AdminDashboard /> : 
            role === 'user' ? <UserDashboard /> : 
            <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;