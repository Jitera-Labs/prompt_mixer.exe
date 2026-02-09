import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-full flex flex-col items-center justify-center bg-[#1a1a1a] text-white/60 p-8">
          <h2 className="text-lg font-medium mb-2">Something went wrong</h2>
          <p className="text-sm text-white/40 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm hover:bg-blue-600/30"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
