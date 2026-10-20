import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafd] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-6 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Display Glitch Prevented</h2>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'A rendering error occurred in this view.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#0b57d0] text-white rounded-lg text-sm font-medium hover:bg-[#0842a0] transition-colors"
            >
              Reload Admin Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
