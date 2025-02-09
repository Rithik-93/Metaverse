'use client'

import React, { useState } from 'react';
import axios from 'axios'
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export function Signin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = `${process.env.NEXT_PUBLIC_GAME_API}/api/v1/signin`;
            const payload = { username, password }
            const res = await axios.post(url, payload);
            if (res.status === 200) {
                window.localStorage.setItem('token', res.data.token)
                router.push('/spaces');
            }
            console.log(res.data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                    Create account
                </h2>
                <p className="mt-2 text-gray-600">
                    Sign in to access your account
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => router.push('/signup')}
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        Don't have an account? Sign up
                    </button>
                </div>
            </form>
        </div>
    );
}