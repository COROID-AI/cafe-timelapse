import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Error boundary: surfaces fatal errors in the interface (not only inside
 * the 3D view) and offers a recoverable reload action.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    console.error('Café scene error:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-overlay" role="alert">
          <h2>Something went wrong</h2>
          <p>{this.state.message || 'The 3D scene failed to load.'}</p>
          <button type="button" className="btn btn-primary" onClick={this.handleReset}>
            Reload scene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
