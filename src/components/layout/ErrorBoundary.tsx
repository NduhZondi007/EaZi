import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <View className="flex-1 items-center justify-center px-6 bg-white">
          <AlertTriangle size={48} color="#DC2626" />
          <Text className="text-lg font-bold text-[#111111] mt-4 text-center">
            Something went wrong
          </Text>
          <Text className="text-sm text-[#6B7280] mt-2 text-center">
            {this.state.error?.message ?? 'An unexpected error occurred. Please try again.'}
          </Text>
          <Pressable
            onPress={this.reset}
            className="mt-6 h-12 px-8 bg-[#111111] rounded-xl items-center justify-center"
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-white">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return <>{this.props.children}</>;
  }
}
