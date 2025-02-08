'use client'

import React, { useState } from 'react';
import axios from 'axios'
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export function Auth() {
    const [isSignIn, setIsSignIn] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isSignIn
                ? `${process.env.NEXT_PUBLIC_GAME_API}/api/v1/signin`
                : `${process.env.NEXT_PUBLIC_GAME_API}/api/v1/signup`;

            const payload = isSignIn
                ? { username: email, password }
                : { name, username: email, password, type: 'user' };

            const res = await axios.post(url, payload);
            console.log(res.data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                    {isSignIn ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="mt-2 text-gray-600">
                    {isSignIn
                        ? 'Sign in to access your account'
                        : 'Sign up to get started with us'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {!isSignIn && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="John Doe"
                                required={!isSignIn}
                            />
                        </div>
                    </div>
                )}

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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                    {isSignIn ? 'Sign in' : 'Create account'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsSignIn(!isSignIn)}
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        {isSignIn
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </button>
                </div>
            </form>
        </div>
    );
}