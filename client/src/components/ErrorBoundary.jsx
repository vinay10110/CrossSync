import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

// Use in App.jsx
function App() {
  return (
    <ErrorBoundary>
      <MantineProvider>
        {/* ... rest of your app */}
      </MantineProvider>
    </ErrorBoundary>
  );
} 