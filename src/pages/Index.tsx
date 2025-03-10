import React from 'react';
import VendorList from '@/components/vendor/VendorList';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import VendorGrid from '@/components/featured/VendorGrid';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#138808] mb-4">
            Fresh Farm Products Near You
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Connect directly with local farmers and get fresh, organic produce delivered to your doorstep.
          </p>
        </div>

        {!authenticated ? (
          <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-4">
              Sign in to See Nearby Vendors
            </h2>
            <p className="text-gray-600 mb-6">
              Create an account or sign in to view nearby vendors and their products.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => navigate('/login')}
                className="bg-[#138808] hover:bg-[#138808]/90"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/register')}
                variant="outline"
              >
                Create Account
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <VendorGrid />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
