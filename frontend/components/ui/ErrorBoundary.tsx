"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  key: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, key: 0 };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, key: 0 };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, key: prev.key + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-xl font-semibold">خطایی رخ داد</h2>
            <p className="mt-2 text-muted-foreground">مشکلی پیش آمده است. لطفا صفحه را مجددا بارگذاری کنید.</p>
            <button
              className="mt-4 rounded-md bg-brand px-4 py-2 text-white"
              onClick={this.handleRetry}
            >
              تلاش مجدد
            </button>
          </div>
        )
      );
    }
    return <div key={this.state.key}>{this.props.children}</div>;
  }
}
