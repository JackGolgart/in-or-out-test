'use client';

import React from 'react';
import { useRouter } from 'next/router';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="bg-red-900/20 rounded-xl p-8 max-w-lg w-full">
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
              <p className="text-gray-300 mb-6">
                We apologize for the inconvenience. Our team has been notified of this issue.
              </p>
              <div className="space-y-3 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="btn-secondary"
                >
                  Go Back
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-6 text-left">
                  <details className="bg-gray-800/50 rounded-lg p-4">
                    <summary className="text-red-400 cursor-pointer">Error Details</summary>
                    <pre className="mt-2 text-xs text-gray-400 overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 