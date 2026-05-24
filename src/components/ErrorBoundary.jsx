import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    handleClearData = () => {
        if (window.confirm('This will clear all saved data (invoices, cart) and reload. Continue?')) {
            localStorage.removeItem('invoices');
            localStorage.removeItem('cart');
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                The app encountered an error. This is usually caused by corrupted saved data.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReset}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleClearData}
                                className="w-full py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all text-sm"
                            >
                                Clear Data & Reload
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono break-all">
                            {this.state.error?.message}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
