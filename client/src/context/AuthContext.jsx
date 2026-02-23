import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const STORAGE_KEY = 'khonic_user';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on initial load
        try {
            const storedUserStr = localStorage.getItem(STORAGE_KEY);
            if (storedUserStr) {
                const parsedUser = JSON.parse(storedUserStr);
                // Basic validation: ensure it's an object with required fields
                if (parsedUser && typeof parsedUser === 'object' && parsedUser.email && parsedUser.name) {
                    setUser(parsedUser);
                } else {
                    // Invalid data, clear it
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Error restoring auth state:', error);
            localStorage.removeItem(STORAGE_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            const userData = { ...data.user, token: data.token };
            setUser(userData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            return userData;
        } else {
            throw new Error(data.message || 'Login gagal');
        }
    };

    const register = async (name, email, password) => {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            throw new Error(data.message || 'Registrasi gagal');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
