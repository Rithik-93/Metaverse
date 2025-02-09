'use client'

import React, { useState } from 'react';
import { Layout, Ruler, Map } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API } from '@/config';

export function CreateSpace() {
  const [name, setName] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [mapId, setMapId] = useState('');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const validateDimensions = (value: string) => {
    return /^[0-9]{1,4}x[0-9]{1,4}$/.test(value);
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateDimensions(dimensions)) {
      setError('Dimensions must be in format: 100x100');
      return;
    }

    try {
      const token = window.localStorage.getItem('token')
      const url = `${API}/api/v1/space`;
      const payload = { name, dimensions, mapId }
      const headers = { Authorization: token };
      const res = await axios.post(url, payload, { headers });
      if (res.status === 200) {
        const spaceId = res.data.spaceId;
        const trimmedToken = token?.split(' ')[1]
          router.push(`/arena/?spaceId=${spaceId}&token=${trimmedToken}`);
      }
      console.log(res.data);
  } catch (error) {
      console.error("Error:", error);
  }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Layout className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Create New Space</h2>
        <p className="mt-2 text-gray-600">
          Set up your virtual space dimensions and properties
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Space Name
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Layout className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My Awesome Space"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dimensions (width x height)
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Ruler className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              className={`pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="100x100"
              required
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <p className="mt-1 text-sm text-gray-500">
            Format: widthxheight (e.g., 100x100)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Map ID (Optional)
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Map className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={mapId}
              onChange={(e) => setMapId(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter map ID to clone from existing map"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Create Space
        </button>
      </form>
    </div>
  );
}