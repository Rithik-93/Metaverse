import React from 'react';
import { Auth } from '@/components/Signup';

function SignIn() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Auth/>
    </div>
  );
}

export default SignIn;