import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, DevSettings, Platform } from 'react-native';

interface State {
  hasError: boolean;
  error?: any;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary] caught render error', error, info?.componentStack);
  }

  handleReload = () => {
    try {
      if (DevSettings && (DevSettings as any).reload) {
        (DevSettings as any).reload();
      } else {
        this.setState({ hasError: false, error: undefined });
      }
    } catch {
      this.setState({ hasError: false, error: undefined });
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children as React.ReactElement;

    const message = this.state.error?.message || String(this.state.error || 'Unknown error');

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={this.handleReload}>
          <Text style={styles.buttonText}>{Platform.select({ ios: 'Reload App', android: 'Reload App', default: 'Retry' })}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4DD0E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
